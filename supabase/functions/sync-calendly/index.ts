import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CALENDLY_API_BASE = "https://api.calendly.com";

type CalendlyPagination = {
  next_page?: string | null;
  next_page_token?: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, headers: Record<string, string>, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "2", 10);
      const waitMs = Math.max(retryAfter * 1000, 1000 * (attempt + 1));
      console.log(`Rate limited on ${url}, waiting ${waitMs}ms (attempt ${attempt + 1})`);
      await sleep(waitMs);
      continue;
    }
    return res;
  }
  // Final attempt
  return fetch(url, { headers });
}

function buildScheduledEventsUrl(params: {
  minStartTime: string;
  maxStartTime: string;
  status: string;
  orgUri: string | null;
  userUri: string;
  pageToken?: string | null;
}) {
  const searchParams = new URLSearchParams({
    min_start_time: params.minStartTime,
    max_start_time: params.maxStartTime,
    count: "100",
    status: params.status,
  });

  if (params.orgUri) {
    searchParams.set("organization", params.orgUri);
  } else {
    searchParams.set("user", params.userUri);
  }

  if (params.pageToken) {
    searchParams.set("page_token", params.pageToken);
  }

  return `${CALENDLY_API_BASE}/scheduled_events?${searchParams.toString()}`;
}

function resolveNextPageUrl(
  pagination: CalendlyPagination | undefined,
  fallbackParams: {
    minStartTime: string;
    maxStartTime: string;
    status: string;
    orgUri: string | null;
    userUri: string;
  }
) {
  const nextPage = pagination?.next_page;
  if (typeof nextPage === "string" && nextPage.length > 0) {
    return nextPage.startsWith("http")
      ? nextPage
      : `${CALENDLY_API_BASE}${nextPage.startsWith("/") ? "" : "/"}${nextPage}`;
  }

  const nextPageToken = pagination?.next_page_token;
  if (typeof nextPageToken === "string" && nextPageToken.length > 0) {
    return buildScheduledEventsUrl({
      ...fallbackParams,
      pageToken: nextPageToken,
    });
  }

  return null;
}

function isInvalidPageTokenError(status: number, body: string) {
  return status === 400 && body.includes('"parameter":"page_token"');
}

function dedupeEvents(events: any[]) {
  const seen = new Map<string, any>();

  for (const event of events) {
    const key = typeof event?.uri === "string" ? event.uri : JSON.stringify(event);
    if (!seen.has(key)) {
      seen.set(key, event);
    }
  }

  return Array.from(seen.values());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const calendlyToken = Deno.env.get("CALENDLY_API_TOKEN");
    if (!calendlyToken) {
      console.error("CALENDLY_API_TOKEN not set");
      return new Response(JSON.stringify({ error: "CALENDLY_API_TOKEN not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeaders = { Authorization: `Bearer ${calendlyToken}` };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get current user URI
    console.log("Fetching Calendly user info...");
    const meRes = await fetch("https://api.calendly.com/users/me", {
      headers: authHeaders,
    });
    if (!meRes.ok) {
      const err = await meRes.text();
      console.error("Calendly /users/me failed:", err);
      return new Response(JSON.stringify({ error: "Calendly /users/me failed", details: err }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const meData = await meRes.json();
    const userUri = meData.resource.uri;
    const orgUri = meData.resource.current_organization;
    console.log("Calendly user URI:", userUri);
    console.log("Calendly org URI:", orgUri);

    // 2. Fetch scheduled events (last 30 days + next 30 days) with pagination
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() - 30);
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 30);

    async function fetchEventsInRange(
      status: string,
      rangeStart: Date,
      rangeEnd: Date,
      depth = 0
    ): Promise<any[]> {
      const allItems: any[] = [];
      const seenPageUrls = new Set<string>();
      const minStartTime = rangeStart.toISOString();
      const maxStartTime = rangeEnd.toISOString();

      let nextPageUrl: string | null = buildScheduledEventsUrl({
        minStartTime,
        maxStartTime,
        status,
        orgUri,
        userUri,
      });
      let page = 0;

      while (nextPageUrl) {
        if (seenPageUrls.has(nextPageUrl)) {
          console.warn(`Repeated Calendly next_page URL detected for ${status}. Stopping pagination to avoid loop.`, nextPageUrl);
          break;
        }

        seenPageUrls.add(nextPageUrl);
        page++;

        console.log(
          `Fetching Calendly ${status} events (${minStartTime} → ${maxStartTime}, page ${page}, depth ${depth})...`
        );

        const res = await fetchWithRetry(nextPageUrl, authHeaders);

        if (!res.ok) {
          const errorText = await res.text();
          const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
          const canSplitRange = depth < 6 && rangeMs > 12 * 60 * 60 * 1000;

          if (page > 1 && isInvalidPageTokenError(res.status, errorText) && canSplitRange) {
            const midpoint = new Date(rangeStart.getTime() + Math.floor(rangeMs / 2));
            const rightStart = new Date(midpoint.getTime() + 1000);

            console.warn(
              `Calendly page token failed for ${status} in range ${minStartTime} → ${maxStartTime}. Splitting range at ${midpoint.toISOString()} (depth ${depth + 1}).`
            );

            const [leftItems, rightItems] = await Promise.all([
              fetchEventsInRange(status, rangeStart, midpoint, depth + 1),
              fetchEventsInRange(status, rightStart, rangeEnd, depth + 1),
            ]);

            return dedupeEvents([...allItems, ...leftItems, ...rightItems]);
          }

          console.error(
            `Calendly ${status} events fetch failed (${minStartTime} → ${maxStartTime}, page ${page}):`,
            errorText
          );
          break;
        }

        const data = await res.json();
        const items = data.collection || [];
        allItems.push(...items);

        nextPageUrl = resolveNextPageUrl(data.pagination, {
          minStartTime,
          maxStartTime,
          status,
          orgUri,
          userUri,
        });

        console.log(
          `Found ${items.length} ${status} events on page ${page}. Total so far: ${allItems.length}`
        );
      }

      return dedupeEvents(allItems);
    }

    async function fetchAllEvents(status: string): Promise<any[]> {
      return fetchEventsInRange(status, minDate, maxDate);
    }

    const events = await fetchAllEvents("active");
    const canceledEvents = await fetchAllEvents("canceled");

    const allEvents = [...events, ...canceledEvents];
    console.log(`Total events to process: ${allEvents.length}`);

    // 3. Get existing consultations to skip ones that already have names
    const { data: existingConsultations } = await supabase
      .from("consultations")
      .select("calendly_event_uri, client_name");

    const existingMap = new Map<string, string>();
    for (const c of existingConsultations || []) {
      existingMap.set(c.calendly_event_uri, c.client_name);
    }

    // 4. For each event, get invitees (with rate limit handling)
    let synced = 0;
    for (let i = 0; i < allEvents.length; i++) {
      const event = allEvents[i];
      const eventUri = event.uri;
      console.log(`Processing event: ${eventUri}`);
      const startTime = event.start_time;
      const endTime = event.end_time;
      const eventDate = startTime.split("T")[0];
      const eventTypeName = event.name || "";
      const calendlyStatus = event.status;

      // Skip invitee fetch if we already have a real name
      const existingName = existingMap.get(eventUri);
      const needsInviteeFetch = !existingName || existingName === "Sem nome";

      let clientName = existingName || "Sem nome";
      let clientEmail = "";
      let clientPhone: string | null = null;

      if (needsInviteeFetch) {
        if (i > 0) await sleep(200);

        try {
          console.log(`Fetching invitees for event: ${eventUri}`);
          const inviteesRes = await fetchWithRetry(`${eventUri}/invitees`, authHeaders);
          if (inviteesRes.ok) {
            const inviteesData = await inviteesRes.json();
            const invitees = inviteesData.collection || [];
            console.log(`Found ${invitees.length} invitees.`);
            if (invitees.length > 0) {
              clientName = invitees[0].name || "Sem nome";
              clientEmail = invitees[0].email || "";
              if (invitees[0].text_reminder_number) {
                clientPhone = invitees[0].text_reminder_number;
              }
              const qas = invitees[0].questions_and_answers || [];
              for (const qa of qas) {
                const question = (qa.question || "").toLowerCase();
                if (
                  !clientPhone &&
                  (question.includes("phone") ||
                    question.includes("telefone") ||
                    question.includes("whatsapp") ||
                    question.includes("celular") ||
                    question.includes("número"))
                ) {
                  clientPhone = qa.answer || null;
                }
              }
            }
          } else {
            console.error(`Invitees failed for ${eventUri}: ${inviteesRes.status}`);
          }
        } catch (invErr) {
          console.error(`Invitees error for ${eventUri}:`, invErr);
        }
      }

      // Map Calendly status to consultation status
      let consultationStatus = "não convertido";
      if (calendlyStatus === "canceled") {
        consultationStatus = "no-show";
      }

      const upsertData: Record<string, any> = {
        calendly_event_uri: eventUri,
        client_name: clientName,
        client_email: clientEmail,
        date: eventDate,
        start_time: startTime,
        end_time: endTime,
        status: consultationStatus,
        event_type_name: eventTypeName,
        calendly_status: calendlyStatus,
        updated_at: new Date().toISOString(),
      };

      if (clientEmail) upsertData.client_email = clientEmail;
      if (clientPhone) upsertData.client_phone = clientPhone;

      console.log(`Upserting consultation for ${clientName}...`);
      const { error } = await supabase.from("consultations").upsert(
        upsertData,
        { onConflict: "calendly_event_uri", ignoreDuplicates: false }
      );

      if (error) {
        console.error(`Error upserting ${eventUri}:`, error);
      } else {
        synced++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced, total: allEvents.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
