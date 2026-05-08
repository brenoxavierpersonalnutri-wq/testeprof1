// Edge Function: gateway-criar-cobranca
// Esqueleto pronto para integração futura com InfinitePay.
// Por enquanto, gera uma cobrança no banco local (modo mock) quando a INFINITEPAY_API_KEY não estiver configurada.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function calcLiquido(bruto: number, metodo: string, parcelas: number, taxas: any) {
  const fixa = Number(taxas.taxa_fixa ?? 0.49);
  let perc = 0;
  if (metodo === "pix") perc = Number(taxas.taxa_pix ?? 0.99);
  else if (metodo === "boleto") perc = Number(taxas.taxa_boleto ?? 2.49);
  else perc = parcelas > 1 ? Number(taxas.taxa_cartao_parcelado ?? 4.99) : Number(taxas.taxa_cartao_vista ?? 3.99);
  return { liquido: +(bruto - bruto * (perc / 100) - fixa).toFixed(2), taxa_percentual: perc, taxa_fixa: fixa };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { cliente_nome, cliente_email, cliente_cpf_cnpj, cliente_telefone, valor_bruto, metodo, descricao, parcelas = 1, link_id } = body;

    if (!cliente_nome || !cliente_email || !valor_bruto || !metodo) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identifica user_id: via API key (header) ou via link público
    const auth = req.headers.get("authorization") ?? "";
    let user_id: string | null = null;

    if (auth.startsWith("Bearer bg_live_")) {
      const key = auth.replace("Bearer ", "").trim();
      const hash = await sha256(key);
      const { data: keyRow } = await supabase
        .from("gateway_api_keys")
        .select("user_id, ativo")
        .eq("key_hash", hash)
        .maybeSingle();
      if (!keyRow?.ativo) {
        return new Response(JSON.stringify({ error: "API key inválida" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      user_id = keyRow.user_id;
      await supabase.from("gateway_api_keys").update({ ultimo_uso: new Date().toISOString() }).eq("key_hash", hash);
    } else if (link_id) {
      const { data: link } = await supabase.from("gateway_links").select("user_id").eq("id", link_id).maybeSingle();
      user_id = link?.user_id ?? null;
    }

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: cfg } = await supabase.from("gateway_config").select("*").eq("user_id", user_id).maybeSingle();
    const calc = calcLiquido(Number(valor_bruto), metodo, parcelas, cfg ?? {});

    // === INTEGRAÇÃO INFINITEPAY (esqueleto) ===
    const infinitepayKey = Deno.env.get("INFINITEPAY_API_KEY");
    let gatewayResp: any = null;

    if (infinitepayKey) {
      // TODO: substituir pelo endpoint real da InfinitePay quando disponível
      // const r = await fetch("https://api.infinitepay.io/v2/charges", {
      //   method: "POST",
      //   headers: { "Authorization": `Bearer ${infinitepayKey}`, "Content-Type": "application/json" },
      //   body: JSON.stringify({ amount: Math.round(valor_bruto * 100), method: metodo, customer: { name: cliente_nome, email: cliente_email } })
      // });
      // gatewayResp = await r.json();
      console.log("[gateway-criar-cobranca] InfinitePay key detectada — endpoint real ainda não implementado.");
    }

    const insert = {
      user_id,
      link_id: link_id ?? null,
      cliente_nome,
      cliente_email,
      cliente_cpf_cnpj: cliente_cpf_cnpj ?? null,
      cliente_telefone: cliente_telefone ?? null,
      valor_bruto: Number(valor_bruto),
      valor_liquido: calc.liquido,
      taxa_percentual: calc.taxa_percentual,
      taxa_fixa: calc.taxa_fixa,
      metodo,
      parcelas,
      descricao: descricao ?? null,
      status: metodo === "cartao" ? "pago" : "pendente",
      pago_em: metodo === "cartao" ? new Date().toISOString() : null,
      gateway_id: gatewayResp?.id ?? null,
      qr_code: metodo === "pix" ? (gatewayResp?.qr_code ?? `MOCK_QR_${Date.now()}`) : null,
      codigo_barras: metodo === "boleto" ? (gatewayResp?.barcode ?? `MOCK_BOLETO_${Date.now()}`) : null,
      vencimento: metodo === "boleto" ? new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) : null,
    };

    const { data: tx, error } = await supabase.from("gateway_transacoes").insert(insert).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, transacao: tx }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[gateway-criar-cobranca]", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
