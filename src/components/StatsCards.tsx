import { useMemo } from "react";
import { Consultation, ConsultationStatus } from "@/types/consultation";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, TrendingUp, UserX, XCircle, RotateCcw, Handshake } from "lucide-react";
import { format, isBefore, startOfDay, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";


type StatsFilterValue = ConsultationStatus | "desqualificada" | "call_confirmada" | "call_nao_confirmada" | "feitas" | "reembolsadas" | "pagamento_ok" | "negociando_lista" | null;

interface StatsCardsProps {
  consultations: Consultation[];
  hasDateFilter: boolean;
  dateRange?: DateRange;
  activeFilter?: StatsFilterValue;
  onFilterChange?: (status: StatsFilterValue) => void;
  onCardDrill?: (filter: Exclude<StatsFilterValue, null>, label: string) => void;
}

export function StatsCards({ consultations, hasDateFilter, dateRange, activeFilter, onFilterChange, onCardDrill }: StatsCardsProps) {
  const total = consultations.length;
  const feitas = consultations.filter(c => c.attended === true).length;
  const converted = consultations.filter(c => c.status === "convertido").length;
  // No-Show = confirmou a reunião e não compareceu
  const noShow = consultations.filter(c => c.callConfirmed === true && c.attended === false).length;
  const notConverted = consultations.filter(c => c.status === "não convertido").length;

  const callConfirmed = consultations.filter(c => c.callConfirmed === true).length;
  const callConfirmedRate = total > 0 ? Math.round((callConfirmed / total) * 100) : 0;

  const callNotConfirmed = consultations.filter(c => c.callConfirmed === false).length;
  const callNotConfirmedRate = total > 0 ? Math.round((callNotConfirmed / total) * 100) : 0;

  // Feitas calculadas sobre as confirmadas
  const feitasRate = callConfirmed > 0 ? Math.round((feitas / callConfirmed) * 100) : 0;
  // Conversão sobre as feitas
  const conversionRate = feitas > 0 ? Math.round((converted / feitas) * 100) : 0;
  // No-show sobre as confirmadas
  const noShowRate = callConfirmed > 0 ? Math.round((noShow / callConfirmed) * 100) : 0;
  const notConvertedRate = feitas > 0 ? Math.round((notConverted / feitas) * 100) : 0;

  const desqualificadas = consultations.filter(c => c.disqualified === true).length;
  const desqualificadasRate = total > 0 ? Math.round((desqualificadas / total) * 100) : 0;

  // Reembolsadas
  const refundedList = consultations.filter(c => c.refunded === true);
  const refundedCount = refundedList.length;
  const refundedTotal = refundedList.reduce((sum, c) => sum + (c.ticketValue || 0), 0);
  const refundedTotalLabel = refundedTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Negociando — leads em negociação ativa no período
  const negotiatingList = consultations.filter(c => (c.status === "negociando" || c.negotiating === true) && c.refunded !== true);
  const negotiatingCount = negotiatingList.length;
  const negotiatingPotential = negotiatingList.reduce((sum, c) => sum + (c.ticketValue || 0), 0);
  const negotiatingPotentialLabel = negotiatingPotential.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const dateDisplay = useMemo(() => {
    if (!dateRange?.from) return format(new Date(), "dd 'de' MMMM", { locale: ptBR });
    if (!dateRange.to) return format(dateRange.from, "dd 'de' MMMM", { locale: ptBR });
    return `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`;
  }, [dateRange]);

  const cards: {
    label: string;
    value: number;
    subtitle?: string;
    icon: typeof CalendarCheck;
    color: string;
    filterStatus: string | null;
  }[] = [
      {
        label: hasDateFilter ? "Consultas no Período" : "Consultas Hoje",
        value: total - desqualificadas,
        subtitle: dateDisplay,
        icon: CalendarCheck,
        color: "bg-primary/10 text-primary",
        filterStatus: null,
      },
      {
        label: "Consultas Feitas",
        value: feitas,
        subtitle: `${feitasRate}% das confirmadas`,
        icon: CalendarCheck,
        color: "bg-blue-500/10 text-blue-500",
        filterStatus: "feitas",
      },
      {
        label: "Convertidas",
        value: converted,
        subtitle: `${conversionRate}% das feitas`,
        icon: TrendingUp,
        color: "bg-success/10 text-success",
        filterStatus: "convertido",
      },
      {
        label: "Convertidas / Pagamento OK",
        value: converted - refundedCount,
        subtitle: `${feitas > 0 ? Math.round(((converted - refundedCount) / feitas) * 100) : 0}% das feitas`,
        icon: TrendingUp,
        color: "bg-emerald-500/10 text-emerald-600",
        filterStatus: "pagamento_ok",
      },
      {
        label: "No-Show",
        value: noShow,
        subtitle: `${noShowRate}% das confirmadas`,
        icon: UserX,
        color: "bg-noshow/10 text-noshow",
        filterStatus: "no-show",
      },
      {
        label: "Não Convertidas",
        value: notConverted,
        subtitle: `${notConvertedRate}% das feitas`,
        icon: XCircle,
        color: "bg-warning/10 text-warning",
        filterStatus: "não convertido",
      },
      {
        label: "Desqualificadas",
        value: desqualificadas,
        subtitle: `${desqualificadasRate}% do total`,
        icon: UserX,
        color: "bg-slate-500/10 text-slate-500",
        filterStatus: "desqualificada",
      },
      {
        label: "Call Confirmadas",
        value: callConfirmed,
        subtitle: `${callConfirmedRate}% do total`,
        icon: CalendarCheck,
        color: "bg-indigo-500/10 text-indigo-500",
        filterStatus: "call_confirmada",
      },
      {
        label: "Call Não Confirmadas",
        value: callNotConfirmed,
        subtitle: `${callNotConfirmedRate}% do total`,
        icon: XCircle,
        color: "bg-red-500/10 text-red-500",
        filterStatus: "call_nao_confirmada",
      },
      {
        label: "Reembolsadas",
        value: refundedCount,
        subtitle: `${refundedTotalLabel} reembolsado`,
        icon: RotateCcw,
        color: "bg-destructive/10 text-destructive",
        filterStatus: "reembolsadas",
      },
      {
        label: "Negociando",
        value: negotiatingCount,
        subtitle: `${negotiatingPotentialLabel} em potencial`,
        icon: Handshake,
        color: "bg-amber-500/10 text-amber-600",
        filterStatus: "negociando_lista",
      },
    ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {cards.map((card) => {
        const isActive = activeFilter === card.filterStatus;
        return (
          <Card
            key={card.label}
            className={`border-none shadow-sm hover:shadow-md transition-all cursor-pointer ${isActive ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
            onClick={() => {
              const newFilter = isActive ? null : (card.filterStatus as StatsFilterValue);
              if (onFilterChange) {
                onFilterChange(newFilter);
              }
              if (onCardDrill && card.filterStatus) {
                onCardDrill(card.filterStatus as Exclude<StatsFilterValue, null>, card.label);
              }
            }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-3xl font-display font-bold mt-2">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className={`p-2.5 rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
