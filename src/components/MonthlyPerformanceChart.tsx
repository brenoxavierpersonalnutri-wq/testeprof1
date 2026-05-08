import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { Consultation } from "@/types/consultation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  parseISO,
  isWithinInterval,
  getDay,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MonthlyPerformanceChartProps {
  consultations: Consultation[];
  currentDate: Date;
}

const METAS = {
  diaria: { feitas: 8 },
  sabado: { feitas: 0 },
  domingo: { feitas: 0 },
  semanal: { agendadas: 50, feitas: 40, convertidas: 15 },
  mensal: { agendadas: 200, feitas: 160 },
  noShow: { taxa: 20 },
};

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface DayData {
  date: Date;
  dateStr: string;
  agendadas: number;
  feitas: number;
  noShow: number;
  isCurrentMonth: boolean;
}

export function MonthlyPerformanceChart({ consultations, currentDate }: MonthlyPerformanceChartProps) {
  const [period, setPeriod] = useState<"semanal" | "mensal">("semanal");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Calendar data for daily view
  const calendarData = useMemo(() => {
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

    return allDays.map((day): DayData => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayConsultations = consultations.filter((c) => c.date === dayStr);
      return {
        date: day,
        dateStr: dayStr,
        agendadas: dayConsultations.length,
        feitas: dayConsultations.filter((c) => c.attended === true).length,
        noShow: dayConsultations.filter((c) => c.attended === false).length,
        isCurrentMonth: day >= monthStart && day <= monthEnd,
      };
    });
  }, [consultations, monthStart, monthEnd]);

  // Weekly data
  const weeklyData = useMemo(() => {
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    );

    return weeks.map((ws) => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const weekConsultations = consultations.filter((c) => {
        const d = parseISO(c.date);
        return isWithinInterval(d, { start: ws, end: we });
      });
      return {
        name: `${format(ws, "dd/MM")}–${format(we, "dd/MM")}`,
        agendadas: weekConsultations.length,
        confirmadas: weekConsultations.filter((c) => c.callConfirmed === true).length,
        feitas: weekConsultations.filter((c) => c.attended === true).length,
        noShow: weekConsultations.filter((c) => c.attended === false).length,
        convertidas: weekConsultations.filter((c) => c.converted === true).length,
        metaAgendadas: METAS.semanal.agendadas,
        metaFeitas: METAS.semanal.feitas,
        metaConvertidas: METAS.semanal.convertidas,
      };
    });
  }, [consultations, monthStart, monthEnd]);

  // Monthly summary for progress view
  const monthlyStats = useMemo(() => {
    const agendadas = consultations.length;
    const confirmadas = consultations.filter((c) => c.callConfirmed === true).length;
    const feitas = consultations.filter((c) => c.attended === true).length;
    const noShow = consultations.filter((c) => c.attended === false).length;
    const convertidas = consultations.filter((c) => c.converted === true).length;
    return { name: format(currentDate, "MMMM yyyy", { locale: ptBR }), agendadas, confirmadas, feitas, noShow, convertidas };
  }, [consultations, currentDate]);

  const getMeta = () => {
    switch (period) {
      case "semanal": return METAS.semanal.feitas;
      case "mensal": return METAS.mensal.feitas;
    }
  };

  const weeks = useMemo(() => {
    const result: DayData[][] = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      result.push(calendarData.slice(i, i + 7));
    }
    return result;
  }, [calendarData]);

  const renderCalendar = () => (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>
      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1">
          {week.map((day) => {
            const hasData = day.agendadas > 0;
            const isSaturday = getDay(day.date) === 6;
            const isSunday = getDay(day.date) === 0;
            const isFuture = day.date > new Date();
            const metMeta = isSaturday
              ? day.feitas >= METAS.sabado.feitas
              : isSunday
              ? day.feitas >= METAS.domingo.feitas
              : day.feitas >= METAS.diaria.feitas;
            const showColor = day.isCurrentMonth && !isFuture && !isSunday;

            return (
              <div
                key={day.dateStr}
                className={cn(
                  "relative rounded-lg p-1.5 min-h-[60px] text-center transition-colors border",
                  !day.isCurrentMonth && "opacity-30 border-border/20 bg-card",
                  isSunday && day.isCurrentMonth && "border-border/20 bg-muted/30",
                  showColor && metMeta && "border-success/40 bg-success/15",
                  showColor && !metMeta && "border-destructive/40 bg-destructive/15",
                )}
              >
                <span className={cn(
                  "text-[11px] font-medium",
                  !day.isCurrentMonth && "text-muted-foreground",
                  day.isCurrentMonth && "text-foreground",
                )}>
                  {format(day.date, "d")}
                </span>
                {hasData && day.isCurrentMonth && (
                  <div className="mt-0.5 space-y-0">
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="text-[8px] text-muted-foreground">📅</span>
                      <span className="text-[10px] font-bold">{day.agendadas}</span>
                    </div>
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="text-[8px] text-muted-foreground">✓</span>
                      <span className={cn("text-[10px] font-bold", metMeta ? "text-success" : "text-destructive")}>{day.feitas}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>📅 Agendadas</span>
          <span>•</span>
          <span>✓ Feitas</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-success/20 border border-success/30" />
          <span>Meta batida</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30" />
          <span>Meta não batida</span>
        </div>
      </div>
    </div>
  );

  const renderBarChart = (data: any[]) => (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
          <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="confirmadas" name="Confirmadas" fill="hsl(238 75% 65%)" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="feitas" name="Feitas" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="noShow" name="No-Show" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="convertidas" name="Convertidas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} barSize={12} />

          {/* Individual Reference Lines for Metas */}
          <ReferenceLine
            y={METAS.semanal.agendadas}
            stroke="hsl(238 75% 65%)"
            strokeDasharray="5 5"
            label={{ value: `Meta: ${METAS.semanal.agendadas}`, fill: "hsl(238 75% 65%)", fontSize: 10, position: 'insideTopLeft' }}
          />
          <ReferenceLine
            y={METAS.semanal.feitas}
            stroke="hsl(var(--warning))"
            strokeDasharray="5 5"
            label={{ value: `Meta: ${METAS.semanal.feitas}`, fill: "hsl(var(--warning))", fontSize: 10, position: 'insideTopLeft' }}
          />
          <ReferenceLine
            y={METAS.semanal.convertidas}
            stroke="hsl(var(--success))"
            strokeDasharray="5 5"
            label={{ value: `Meta: ${METAS.semanal.convertidas}`, fill: "hsl(var(--success))", fontSize: 10, position: 'insideTopLeft' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderMonthlyProgress = () => {
    const { agendadas, confirmadas, feitas, noShow, convertidas } = monthlyStats;
    const pctAgendadas = METAS.mensal.agendadas > 0 ? Math.round((agendadas / METAS.mensal.agendadas) * 100) : 0;
    const pctConfirmadas = METAS.mensal.agendadas > 0 ? Math.round((confirmadas / METAS.mensal.agendadas) * 100) : 0;
    const pctFeitas = METAS.mensal.feitas > 0 ? Math.round((feitas / METAS.mensal.feitas) * 100) : 0;
    const conversionRate = feitas > 0 ? Math.round((convertidas / feitas) * 100) : 0;
    const noShowRate = agendadas > 0 ? Math.round((noShow / agendadas) * 100) : 0;

    const renderProgressBar = (label: string, current: number, goal: number | string, pct: number, isGood: boolean) => (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">
            {current} {goal !== "N/A" ? `/ ${goal}` : ""} ({pct}%)
          </span>
        </div>
        <div className="relative w-full h-6 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${isGood ? "bg-success" : "bg-primary"} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          >
            {pct >= 20 && (
              <span className="text-[10px] font-bold text-white">{pct} %</span>
            )}
          </div>
          {pct < 20 && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
              {pct}%
            </span>
          )}
        </div>
      </div>
    );

    return (
      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
        <h4 className="text-sm font-semibold capitalize">{monthlyStats.name}</h4>
        {renderProgressBar("Confirmadas", confirmadas, METAS.mensal.agendadas, pctConfirmadas, confirmadas >= METAS.mensal.agendadas * 0.8)}
        {renderProgressBar("Feitas", feitas, METAS.mensal.feitas, pctFeitas, feitas >= METAS.mensal.feitas)}
        {renderProgressBar("Convertidas", convertidas, "N/A", conversionRate, true)}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="text-center p-2 rounded-lg bg-card border border-border/50">
            <p className="text-[10px] text-muted-foreground">Confirmadas</p>
            <p className="text-base font-bold text-indigo-500">{confirmadas}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-card border border-border/50">
            <p className="text-[10px] text-muted-foreground">Feitas</p>
            <p className={`text-base font-bold ${feitas >= METAS.mensal.feitas ? "text-success" : "text-destructive"}`}>{feitas}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-card border border-border/50">
            <p className="text-[10px] text-muted-foreground">No-Show</p>
            <p className={`text-base font-bold ${noShowRate <= METAS.noShow.taxa ? "text-success" : "text-destructive"}`}>{noShow} ({noShowRate}%)</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-card border border-border/50">
            <p className="text-[10px] text-muted-foreground">Conversão</p>
            <p className="text-base font-bold text-primary">{conversionRate}%</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Performance</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="semanal" className="text-xs px-2">Semanal</TabsTrigger>
              <TabsTrigger value="mensal" className="text-xs px-2">Mensal</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {period !== "mensal" ? (
          <p className="text-xs text-muted-foreground">
            Metas Semanais: {METAS.semanal.agendadas} Confirmadas · {METAS.semanal.feitas} Feitas · {METAS.semanal.convertidas} Convertidas
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Metas: {METAS.mensal.agendadas} confirmadas · {METAS.mensal.feitas} feitas · No-Show ≤{METAS.noShow.taxa}%
          </p>
        )}
      </CardHeader>
      <CardContent>
        {period === "semanal" && renderBarChart(weeklyData)}
        {period === "mensal" && renderMonthlyProgress()}
      </CardContent>
    </Card>
  );
}
