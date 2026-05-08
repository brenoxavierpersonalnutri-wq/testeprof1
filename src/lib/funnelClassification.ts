export type FunnelKey =
  | "organico"
  | "social_selling"
  | "low_ticket"
  | "low_grupo"
  | "trafego_direto"
  | "indicacao"
  | "comentou_eu_quero"
  | "acomp_individual"
  | "ex_aluna"
  | "renovacao";

interface FunnelClassificationInput {
  via?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  utmMedium?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  origem?: string | null;
  isIndividual?: boolean;
}

const normalizeValue = (value?: string | null) => (value ?? "").toLowerCase().trim();

export function inferFunnelKey(input: FunnelClassificationInput): FunnelKey {
  const via = normalizeValue(input.via).replace(/_/g, "-");
  const utmSource = normalizeValue(input.utmSource);
  const utmCampaign = normalizeValue(input.utmCampaign);
  const utmMedium = normalizeValue(input.utmMedium);
  const utmContent = normalizeValue(input.utmContent);
  const utmTerm = normalizeValue(input.utmTerm);
  const origem = normalizeValue(input.origem).replace(/_/g, "-");

  const allStr = [via, utmSource, utmCampaign, utmMedium, utmContent, utmTerm, origem].join(" ");

  // PRIORIDADE 1: classificação explícita por `via` (sobrescreve qualquer UTM)
  if (via === "comentou-eu-quero") return "comentou_eu_quero";
  if (via === "social-selling") return "social_selling";
  if (via === "organico") return "organico";
  if (via === "indicacao") return "indicacao";
  if (via === "acompanhamento-individual") return "acomp_individual";
  if (via === "ex-aluna" || via === "ex_aluna") return "ex_aluna";
  if (via === "renovacao" || via === "renovação") return "renovacao";
  if (
    via === "grupo-low-ticket" ||
    via === "grupo-low" ||
    via === "low-grupo" ||
    (allStr.includes("grupo") && allStr.includes("low"))
  ) {
    return "low_grupo";
  }
  if (
    via === "low-ticket" ||
    via === "desafio" ||
    via === "low-14dias" ||
    via === "api-oficial-low-ticket" ||
    via === "avaliacao-low-ticket"
  ) {
    return "low_ticket";
  }
  if (via === "trafego") return "trafego_direto";

  if (
    utmSource === "social_selling" ||
    utmCampaign === "social_selling" ||
    via === "social-selling" ||
    allStr.includes("social-selling") ||
    allStr.includes("social selling") ||
    allStr.includes("whatsapp") ||
    allStr.includes("wpp") ||
    allStr.includes("chat") ||
    allStr.includes("direct")
  ) {
    return "social_selling";
  }

  if (
    utmSource === "organico" ||
    utmCampaign === "organico" ||
    via === "organico" ||
    (utmMedium === "perfil" && utmCampaign === "bio_link") ||
    allStr.includes("bio_link") ||
    allStr.includes("bio-link") ||
    allStr.includes("linktree") ||
    allStr.includes("bio")
  ) {
    return "organico";
  }

  if (
    utmMedium === "grupo-low" ||
    utmMedium === "grupo_low" ||
    via === "grupo-low-ticket" ||
    via === "grupo-low" ||
    (allStr.includes("grupo") && allStr.includes("low"))
  ) {
    return "low_grupo";
  }

  if (
    utmSource === "low_ticket" ||
    utmSource === "avaliacao_low_ticket" ||
    utmCampaign === "avaliacao_low_ticket" ||
    allStr.includes("avaliacao-low-ticket") ||
    utmCampaign === "low_ticket" ||
    via === "low-ticket" ||
    via === "api-oficial-low-ticket" ||
    via === "low-14dias" ||
    via === "desafio" ||
    allStr.includes("api_oficial") ||
    allStr.includes("api-oficial") ||
    allStr.includes("14dias") ||
    allStr.includes("desafio")
  ) {
    return "low_ticket";
  }

  if (utmSource === "indicacao" || utmCampaign === "indicacao" || via === "indicacao") {
    return "indicacao";
  }

  if (via === "comentou-eu-quero" || allStr.includes("eu_quero") || allStr.includes("comentario")) {
    return "comentou_eu_quero";
  }

  if (input.isIndividual || via === "acompanhamento-individual" || allStr.includes("acompanhamento") || allStr.includes("individual")) {
    return "acomp_individual";
  }

  if (allStr.includes("ex-aluna") || allStr.includes("ex_aluna") || allStr.includes("exaluna")) {
    return "ex_aluna";
  }

  if (allStr.includes("renovacao") || allStr.includes("renovação") || allStr.includes("renovar")) {
    return "renovacao";
  }

  if (
    via === "trafego" ||
    via === "site" ||
    utmSource === "instagram" ||
    utmSource === "facebook" ||
    utmSource === "meta" ||
    utmSource === "google" ||
    utmSource === "tiktok" ||
    utmSource === "youtube" ||
    allStr.includes("ads") ||
    allStr.includes("trafego")
  ) {
    return "trafego_direto";
  }

  return "trafego_direto";
}

export function inferBookingVia(input: FunnelClassificationInput): string {
  const funnel = inferFunnelKey(input);

  switch (funnel) {
    case "social_selling":
      return "social-selling";
    case "low_ticket":
      return "low-ticket";
    case "low_grupo":
      return "grupo-low-ticket";
    case "trafego_direto":
      return "trafego";
    case "comentou_eu_quero":
      return "comentou-eu-quero";
    case "acomp_individual":
      return "acompanhamento-individual";
    case "ex_aluna":
      return "ex-aluna";
    case "renovacao":
      return "renovacao";
    default:
      return funnel;
  }
}