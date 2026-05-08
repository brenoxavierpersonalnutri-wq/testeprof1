// Edge Function: gateway-webhook
// Recebe notificações da InfinitePay (ou outro gateway) e atualiza status da transação.
// Esqueleto: aceita payloads no formato { gateway_id, status, paid_at? }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
};

const STATUS_MAP: Record<string, string> = {
  paid: "pago",
  approved: "pago",
  confirmed: "pago",
  pending: "pendente",
  waiting: "pendente",
  expired: "expirado",
  failed: "recusado",
  refused: "recusado",
  refunded: "estornado",
  chargeback: "estornado",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    console.log("[gateway-webhook] payload:", JSON.stringify(payload));

    // TODO: validar assinatura do webhook quando InfinitePay estiver plugada
    // const signature = req.headers.get("x-signature");
    // const secret = Deno.env.get("INFINITEPAY_WEBHOOK_SECRET");
    // if (!verifySignature(payload, signature, secret)) return new Response("invalid", { status: 401 });

    const gateway_id = payload.gateway_id ?? payload.id ?? payload.charge_id;
    const rawStatus = (payload.status ?? payload.event ?? "").toLowerCase();
    const novoStatus = STATUS_MAP[rawStatus] ?? rawStatus;

    if (!gateway_id || !novoStatus) {
      return new Response(JSON.stringify({ error: "payload inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const update: any = { status: novoStatus, updated_at: new Date().toISOString() };
    if (novoStatus === "pago") update.pago_em = payload.paid_at ?? new Date().toISOString();

    const { error } = await supabase.from("gateway_transacoes").update(update).eq("gateway_id", gateway_id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[gateway-webhook]", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
