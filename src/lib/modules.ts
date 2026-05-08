export const APP_MODULES = [
  { key: "vendas", label: "Consultas/Vendas", path: "/vendas" },
  { key: "mensal", label: "Dashboard Mensal", path: "/balanco-mensal" },
  { key: "anual", label: "Dashboard Anual", path: "/anual" },
  { key: "alunas", label: "Gestão de Alunas", path: "/alunas" },
  { key: "financeiro", label: "Dash Financeiro", path: "/financeiro" },
  { key: "teste", label: "BXMetrics / Meta Ads", path: "/teste" },
  { key: "rotator", label: "Rotador de Links", path: "/rotator" },
] as const;

export type ModuleKey = (typeof APP_MODULES)[number]["key"];

export const getModuleByPath = (path: string): ModuleKey | null => {
  const mod = APP_MODULES.find((m) => m.path === path);
  return mod ? mod.key : null;
};
