import { ProgramType, PlanDuration } from "@/lib/alunaTypes";
import { supabase } from "@/integrations/supabase/client";

export interface ProgramOption {
  value: string;
  label: string;
  price: number;
  programa: ProgramType;
  duracao: PlanDuration;
}

export const DEFAULT_PROGRAM_OPTIONS: ProgramOption[] = [
  { value: "mgmd-12m", label: "MGMD 12M", price: 997, programa: "menos_gordura", duracao: "12" },
  { value: "elite-6m", label: "ELITE 6M", price: 1500, programa: "elite", duracao: "6" },
  { value: "elite-2m", label: "ELITE 2M", price: 1997, programa: "elite", duracao: "2" },
  { value: "plataforma", label: "PLATAFORMA", price: 297, programa: "plataforma_magra", duracao: "12" },
  { value: "mgmd-quadrimestral", label: "MGMD QUADRIMESTRAL", price: 497, programa: "menos_gordura", duracao: "4" },
  { value: "slim-definida-6m", label: "6 MESES 497 - SLIM DEFINIDA", price: 497, programa: "menos_gordura", duracao: "6" },
];

// Backwards compat - starts as defaults, gets merged when fetchAllPrograms is called
export let PROGRAM_OPTIONS: ProgramOption[] = [...DEFAULT_PROGRAM_OPTIONS];

export async function fetchCustomPrograms(): Promise<ProgramOption[]> {
  const { data, error } = await supabase
    .from("custom_programs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row: any) => ({
    value: row.value,
    label: row.label,
    price: Number(row.price),
    programa: (row.programa || "consultoria_slim") as ProgramType,
    duracao: (row.duracao || "1") as PlanDuration,
  }));
}

export async function fetchAllPrograms(): Promise<ProgramOption[]> {
  const custom = await fetchCustomPrograms();
  const merged = [...DEFAULT_PROGRAM_OPTIONS];
  for (const c of custom) {
    if (!merged.find((m) => m.value === c.value)) {
      merged.push(c);
    }
  }
  PROGRAM_OPTIONS = merged;
  return merged;
}

export async function addCustomProgram(program: Omit<ProgramOption, "value">): Promise<ProgramOption> {
  const value = program.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const row = {
    value,
    label: program.label,
    price: program.price,
    programa: program.programa,
    duracao: program.duracao,
  };
  const { error } = await supabase.from("custom_programs").insert(row);
  if (error) throw error;
  const opt: ProgramOption = { ...row, price: Number(row.price) };
  PROGRAM_OPTIONS = [...PROGRAM_OPTIONS, opt];
  return opt;
}

export function getProgramByValue(value: string) {
  return PROGRAM_OPTIONS.find((p) => p.value === value);
}

export function getProgramByPrice(price: number) {
  return PROGRAM_OPTIONS.find((p) => p.price === price);
}
