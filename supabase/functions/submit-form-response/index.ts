// Edge Function pública: recebe respostas do formulário de qualificação (novaav.brenoxavier.com.br)
// e armazena em lead_form_responses. Calcula score/nivel server-side por segurança.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ===== Tabela de pontuação (espelho do formulário) =====
const P1_PTS: Record<string, number> = {
  emagrecer: -20,
  perder_gordura_definir: 5,
  definido_slim: 5,
  volume_muscular: 5,
};
const P5_PTS: Record<string, number> = {
  nao_entregam: 5,
  demoro_muito: 0,
  consigo_resultado: -10,
};
const P6_PTS: Record<string, number> = {
  uso_atual: 10,
  ja_usei: 5,
  nunca_usei: 0,
};
const P7_PTS: Record<string, number> = {
  nutricional: 10,
  treino: 10,
  ambos: 20,
  nunca: 0,
};
const P8_PTS: Record<string, number> = {
  abaixo_100: -20,
  "100_250": 5,
  "250_400": 10,
  "400_600": 15,
  "600_1000": 20,
  acima_1000: 25,
};
const P9_PTS: Record<string, number> = {
  imediato: 15,
  futuramente: -5,
  pensar: -10,
};

function calcScore(b: Record<string, unknown>): { score: number; nivel: string } {
  let s = 0;
  s += P1_PTS[String(b.p1_objetivo ?? "")] ?? 0;
  s += P5_PTS[String(b.p5_estrategias ?? "")] ?? 0;
  s += P6_PTS[String(b.p6_caneta ?? "")] ?? 0;
  const p7 = String(b.p7_acompanhamento ?? "");
  s += P7_PTS[p7] ?? 0;
  if (p7 !== "nunca") {
    s += P8_PTS[String(b.p8_investimento ?? "")] ?? 0;
  }
  s += P9_PTS[String(b.p9_prioridade ?? "")] ?? 0;
  const peso = Number(b.p4_peso);
  if (!Number.isNaN(peso) && peso > 86) s -= 10;

  let nivel = "DQ";
  if (s >= 65) nivel = "A";
  else if (s >= 50) nivel = "B";
  else if (s >= 41) nivel = "C";
  else if (s >= 35) nivel = "D";

  return { score: s, nivel };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { score, nivel } = calcScore(body);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const toNum = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const toInt = (v: unknown) => {
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) ? n : null;
    };
    const toStr = (v: unknown) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s.length ? s : null;
    };

    const { data, error } = await supabase
      .from("lead_form_responses")
      .insert({
        nome: toStr(body.nome),
        telefone: toStr(body.telefone),
        email: toStr(body.email),
        p1_objetivo: toStr(body.p1_objetivo),
        p2_situacao: toStr(body.p2_situacao),
        p3_profissao: toStr(body.p3_profissao),
        p4_altura: toNum(body.p4_altura),
        p4_peso: toNum(body.p4_peso),
        p4_idade: toInt(body.p4_idade),
        p5_estrategias: toStr(body.p5_estrategias),
        p6_caneta: toStr(body.p6_caneta),
        p7_acompanhamento: toStr(body.p7_acompanhamento),
        p8_investimento: toStr(body.p8_investimento),
        p9_prioridade: toStr(body.p9_prioridade),
        score,
        nivel,
        utm_source: toStr(body.utm_source),
        utm_medium: toStr(body.utm_medium),
        utm_campaign: toStr(body.utm_campaign),
        utm_content: toStr(body.utm_content),
        utm_term: toStr(body.utm_term),
      })
      .select("id, score, nivel")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, id: data.id, score: data.score, nivel: data.nivel }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("submit-form-response error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
