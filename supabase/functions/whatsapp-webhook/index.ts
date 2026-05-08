import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-vps-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate VPS API key
    const vpsKey = req.headers.get("x-vps-api-key");
    const expectedKey = Deno.env.get("WHATSAPP_VPS_API_KEY");
    if (!expectedKey || vpsKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { event, data } = body;

    // event: "message" | "status_update" | "connection_update"
    if (event === "message") {
      const { phone, name, message, messageId, timestamp } = data;

      // Upsert contact
      await supabase
        .from("whatsapp_contacts")
        .upsert(
          { phone, name: name || phone, updated_at: new Date().toISOString() },
          { onConflict: "phone" }
        );

      // Insert message
      await supabase.from("whatsapp_messages").insert({
        contact_phone: phone,
        direction: "inbound",
        sender_type: "lead",
        body: message,
        message_id: messageId,
        created_at: timestamp || new Date().toISOString(),
      });

      // Check if AI agent is active
      const { data: agentSettings } = await supabase
        .from("ai_agent_settings")
        .select("*")
        .eq("active", true)
        .limit(1)
        .single();

      if (agentSettings) {
        // Call AI to generate response
        const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
        if (lovableApiKey) {
          // Get recent context if enabled
          let context = "";
          if (agentSettings.context_enabled) {
            const { data: recentMessages } = await supabase
              .from("whatsapp_messages")
              .select("direction, sender_type, body, created_at")
              .eq("contact_phone", phone)
              .order("created_at", { ascending: false })
              .limit(10);

            if (recentMessages) {
              context = recentMessages
                .reverse()
                .map(
                  (m: any) =>
                    `${m.sender_type === "lead" ? "Lead" : "Você"}: ${m.body}`
                )
                .join("\n");
            }
          }

          const aiResponse = await fetch(
            "https://api.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: agentSettings.model || "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: agentSettings.prompt },
                  {
                    role: "user",
                    content: context
                      ? `Histórico:\n${context}\n\nNova mensagem do lead: ${message}`
                      : `Mensagem do lead: ${message}`,
                  },
                ],
                temperature: Number(agentSettings.temperature) || 0.7,
              }),
            }
          );

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const reply =
              aiData.choices?.[0]?.message?.content || "";

            if (reply) {
              // Save bot message to DB
              await supabase.from("whatsapp_messages").insert({
                contact_phone: phone,
                direction: "outbound",
                sender_type: "bot",
                body: reply,
              });

              // Send via VPS
              const vpsUrl = Deno.env.get("WHATSAPP_VPS_URL");
              if (vpsUrl) {
                await fetch(`${vpsUrl}/send`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": expectedKey,
                  },
                  body: JSON.stringify({ phone, message: reply }),
                });
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event === "status_update") {
      const { messageId, status } = data;
      if (messageId) {
        await supabase
          .from("whatsapp_messages")
          .update({ status })
          .eq("message_id", messageId);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("whatsapp-webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
