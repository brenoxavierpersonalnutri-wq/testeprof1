import { useState, useEffect, useCallback } from "react";
import { format, isBefore, startOfDay, isToday, parse, addMinutes, getDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, CalendarHeart, Loader2 } from "lucide-react";
import { inferBookingVia } from "@/lib/funnelClassification";

// Interface for the ranges fetched from DB
interface TimeRange {
  start: string;
  end: string;
}

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// Function to generate slots at 30-min intervals for a set of ranges
const generateSlots = (ranges: TimeRange[], gapMinutes: number = 40): string[] => {
  const slots: string[] = [];
  ranges.forEach(range => {
    const startHour = parseInt(range.start.split(":")[0]);
    const startMin = parseInt(range.start.split(":")[1]);
    const endHour = parseInt(range.end.split(":")[0]);
    const endMin = parseInt(range.end.split(":")[1]);
    
    let current = new Date();
    current.setHours(startHour, startMin, 0, 0);
    
    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);
    
    // Ensure the last slot's consultation (duration = gap) doesn't exceed end time
    while (isBefore(current, end) || current.getTime() === end.getTime()) {
      // Only add if slot + duration fits within the end time
      const slotEnd = addMinutes(current, gapMinutes);
      if (isBefore(slotEnd, end) || slotEnd.getTime() === end.getTime()) {
        slots.push(format(current, "HH:mm"));
      }
      current = addMinutes(current, gapMinutes);
    }
  });
  return Array.from(new Set(slots)).sort();
};

// Format date for calendar links in Brasília timezone (no UTC conversion)
const formatLocalDateTime = (date: Date, time: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const [h, m] = time.split(":");
  return `${year}${month}${day}T${h}${m}00`;
};

const getMinBookableDate = (): Date => {
  const today = startOfDay(new Date());
  const now = new Date();
  return addDays(today, now.getHours() >= 12 ? 2 : 1);
};

export default function AgendarPublic() {
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isAutoSelecting, setIsAutoSelecting] = useState(true);
  
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotGapMinutes, setSlotGapMinutes] = useState(60);
  const [maxDailyBookings, setMaxDailyBookings] = useState(12);
  const [isDayFull, setIsDayFull] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formResponse, setFormResponse] = useState<any | null>(null);

  const leadName = searchParams.get("nome") || searchParams.get("name") || searchParams.get("Nome completo") || "Futura Aluna";
  const leadPhone = searchParams.get("whatsapp") || searchParams.get("telefone") || searchParams.get("phone") || "Não informado";
  const isIndividual = (searchParams.get("origem") || "").toLowerCase().includes("individual");

  // Helper to read cookie
  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // Helper to set cookie on root domain for cross-subdomain sharing
  const setCookie = (name: string, value: string, days: number) => {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const parts = window.location.hostname.split('.');
    const domain = parts.length >= 3 ? '.' + parts.slice(-3).join('.') : parts.length === 2 ? '.' + parts.join('.') : window.location.hostname;
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;domain=${domain};SameSite=Lax`;
  };

  // On mount: persist any UTMs from URL into cookies AND sessionStorage
  useEffect(() => {
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmKeys.forEach(k => {
      const v = searchParams.get(k);
      if (v) {
        sessionStorage.setItem(k, v);
        setCookie('ft_' + k, v, 30);
      }
    });
    console.log('[Agendar] UTM debug on mount:', {
      url_utm_source: searchParams.get('utm_source'),
      url_utm_campaign: searchParams.get('utm_campaign'),
      session_utm_source: sessionStorage.getItem('utm_source'),
      session_utm_campaign: sessionStorage.getItem('utm_campaign'),
      cookie_utm_source: getCookie('ft_utm_source'),
      cookie_utm_campaign: getCookie('ft_utm_campaign'),
      all_cookies: document.cookie,
    });
  }, [searchParams]);

  // Fetch most recent form response for this lead (by phone) to include all answers in WhatsApp message
  useEffect(() => {
    const fetchLatestResponse = async () => {
      const phoneDigits = (leadPhone || "").replace(/\D/g, "");
      if (phoneDigits.length < 8) return;
      const tail = phoneDigits.slice(-9);
      const { data } = await supabase
        .from("lead_form_responses")
        .select("*")
        .ilike("telefone", `%${tail}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setFormResponse(data);
    };
    fetchLatestResponse();
  }, [leadPhone]);

  const fetchAvailability = useCallback(async (date: Date) => {
    setIsLoadingSlots(true);
    const dateStr = format(date, "yyyy-MM-dd");

    const { data, error } = await supabase.rpc("get_public_booking_info", { p_date: dateStr });

    if (!error && data && data.length > 0) {
      const booked = data[0].booked_slots || [];
      setBookedSlots(booked);
      setSlotGapMinutes(data[0].slot_gap_minutes ?? 60);
      setMaxDailyBookings(data[0].max_daily_bookings ?? 12);
      setIsDayFull(booked.length >= (data[0].max_daily_bookings ?? 12));

      const weekly = data[0].availability_weekly || {};
      const overridesData = data[0].availability_overrides || {};

      let applicableRanges: TimeRange[] = [];
      if ((overridesData as any)[dateStr]) {
        applicableRanges = (overridesData as any)[dateStr];
      } else {
        const dayOfWeek = getDay(date).toString();
        applicableRanges = (weekly as any)[dayOfWeek] || [];
      }

      setAvailableSlots(generateSlots(applicableRanges, data[0].slot_gap_minutes ?? 40));
    } else {
      setBookedSlots([]);
      setAvailableSlots([]);
      setIsDayFull(false);
      if (error) console.error("Failed to load availability", error, data);
    }

    setIsLoadingSlots(false);
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    setSelectedTime(null);
    fetchAvailability(selectedDate);

    const interval = window.setInterval(() => {
      fetchAvailability(selectedDate);
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAvailability(selectedDate);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setSelectedTime(null);
    };
  }, [fetchAvailability, selectedDate]);

  useEffect(() => {
    const autoSelectNextAvailable = async () => {
      let dateToTest = getMinBookableDate();
      let found = false;
      let attempts = 0;
      
      while (!found && attempts < 14) {
        const dateStr = format(dateToTest, "yyyy-MM-dd");
        const { data, error } = await supabase.rpc("get_public_booking_info", { p_date: dateStr });
        
        if (!error && data && data.length > 0) {
          const booked = data[0].booked_slots || [];
          const slotGapMinutes = data[0].slot_gap_minutes ?? 60;
          const maxDailyBookings = data[0].max_daily_bookings ?? 12;
          
          if (booked.length < maxDailyBookings) {
            const weekly = data[0].availability_weekly || {};
            const overridesData = data[0].availability_overrides || {};

            let applicableRanges: TimeRange[] = [];
            if ((overridesData as any)[dateStr]) {
              applicableRanges = (overridesData as any)[dateStr];
            } else {
              const dayOfWeek = getDay(dateToTest).toString();
              applicableRanges = (weekly as any)[dayOfWeek] || [];
            }

            const rawSlots = generateSlots(applicableRanges, data[0].slot_gap_minutes ?? 40);
            
            const validSlots = rawSlots.filter((time) => {
                const slotMin = timeToMinutes(time);
                const tooClose = booked.some(b => Math.abs(slotMin - timeToMinutes(b)) < slotGapMinutes);
                if (tooClose) return false;
                
                if (isToday(dateToTest)) {
                    const now = new Date();
                    const timeObj = parse(time, "HH:mm", dateToTest);
                    if (isBefore(timeObj, addMinutes(now, 30))) {
                        return false;
                    }
                }
                return true;
            });

            if (validSlots.length > 0) {
              found = true;
              setSelectedDate(dateToTest);
              setIsAutoSelecting(false);
              return; 
            }
          }
        }
        
        dateToTest = addDays(dateToTest, 1);
        attempts++;
      }
      
      setSelectedDate(getMinBookableDate());
      setIsAutoSelecting(false);
    };

    if (!selectedDate && isAutoSelecting) {
      autoSelectNextAvailable();
    }
  }, []); // Run once on mount if we are auto-selecting and have no date

  const handleBooking = async () => {
    if (!selectedDate) return;
    if (!selectedTime || selectedTime.trim() === "") {
      alert("Por favor, selecione um horário para prosseguir com o agendamento.");
      return;
    }
    
    setIsSubmitting(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      // Read UTMs: URL param > sessionStorage > cookie (cross-subdomain via track.js)
      const getUtm = (key: string) => 
        (searchParams.get(key) || sessionStorage.getItem(key) || getCookie('ft_' + key) || "").toLowerCase();

      const utmSource = getUtm('utm_source');
      const utmCampaign = getUtm('utm_campaign');
      const utmMedium = getUtm('utm_medium');
      const utmContent = getUtm('utm_content');
      const utmTerm = getUtm('utm_term');
      const paramOrigem = (searchParams.get('origem') || searchParams.get('via') || "").toLowerCase();
      const funnelOption = inferBookingVia({
        utmSource,
        utmCampaign,
        utmMedium,
        utmContent,
        utmTerm,
        origem: paramOrigem,
        isIndividual,
      });

      console.log('[Agendar] Booking UTM data:', { utmSource, utmCampaign, utmMedium, utmContent, utmTerm, paramOrigem, funnelOption });

      const scoreParam = searchParams.get('score');
      const leadScore = scoreParam ? parseInt(scoreParam, 10) : null;

      const { error } = await supabase.rpc("book_public_consultation", {
        p_client_name: leadName,
        p_client_phone: leadPhone,
        p_date: dateStr,
        p_time: selectedTime,
        p_funnel: funnelOption,
        p_utm_source: utmSource || null,
        p_utm_campaign: utmCampaign || null,
        p_utm_medium: utmMedium || null,
        p_utm_content: utmContent || null,
        p_utm_term: utmTerm || null,
        p_lead_score: (leadScore && !isNaN(leadScore)) ? leadScore : null,
      });

      if (error) throw error;
      
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Erro ao agendar:", err);
      alert(`Houve um erro ao agendar: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppLink = () => {
    let message = isIndividual
      ? `Olá! Fui qualificada e tenho interesse na *Consultoria Individual*! 🎉\n\n`
      : `Olá! Fui qualificada no formulário de avaliação! 🎉\n\n`;
    message += `*Horário Agendado:*\n📅 ${format(selectedDate!, "dd/MM/yyyy")} às 🕒 ${selectedTime}\n\n`;
    message += `*Nome:* ${leadName}\n`;
    message += `*WhatsApp:* ${leadPhone}\n\n`;
    message += `*Minhas respostas:*\n\n`;

    const r = formResponse;
    if (r) {
      const labels: Record<string, { q: string; opts?: Record<string, string> }> = {
        p1_objetivo: { q: "1. Objetivo principal", opts: { emagrecer: "Emagrecer", perder_gordura_definir: "Perder gordura e definir", definido_slim: "Ficar definido / slim", volume_muscular: "Ganhar volume muscular" } },
        p2_situacao: { q: "2. Situação atual" },
        p3_profissao: { q: "3. Profissão" },
        p5_estrategias: { q: "5. Sobre estratégias anteriores", opts: { nao_entregam: "Não entregam o que prometem", demoro_muito: "Demoro muito para ver resultado", consigo_resultado: "Consigo resultado sozinho(a)" } },
        p6_caneta: { q: "6. Caneta emagrecedora", opts: { uso_atual: "Uso atualmente", ja_usei: "Já usei", nunca_usei: "Nunca usei" } },
        p7_acompanhamento: { q: "7. Já teve acompanhamento", opts: { nutricional: "Nutricional", treino: "Treino", ambos: "Ambos", nunca: "Nunca tive" } },
        p8_investimento: { q: "8. Quanto já investiu por mês", opts: { abaixo_100: "Abaixo de R$ 100", "100_250": "R$ 100 - 250", "250_400": "R$ 250 - 400", "400_600": "R$ 400 - 600", "600_1000": "R$ 600 - 1000", acima_1000: "Acima de R$ 1000" } },
        p9_prioridade: { q: "9. Prioridade para começar", opts: { imediato: "Quero começar imediatamente", futuramente: "Futuramente", pensar: "Ainda preciso pensar" } },
      };
      const fmt = (k: string, v: any) => {
        if (!v) return "—";
        const o = labels[k]?.opts;
        return o?.[v] ?? String(v);
      };
      ["p1_objetivo", "p2_situacao", "p3_profissao"].forEach(k => {
        message += `*${labels[k].q}*\n${fmt(k, r[k])}\n\n`;
      });
      message += `*4. Dados físicos*\nAltura: ${r.p4_altura ?? "—"} cm\nPeso: ${r.p4_peso ?? "—"} kg\nIdade: ${r.p4_idade ?? "—"} anos\n\n`;
      ["p5_estrategias", "p6_caneta", "p7_acompanhamento", "p8_investimento", "p9_prioridade"].forEach(k => {
        message += `*${labels[k].q}*\n${fmt(k, r[k])}\n\n`;
      });
      message += `*Score:* ${r.score ?? "—"}/80 (Nível ${r.nivel ?? "—"})\n`;
    } else {
      // Fallback: usa parâmetros da URL (caso o formResponse ainda não tenha sido carregado)
      searchParams.forEach((value, key) => {
        if (!key.startsWith("utm_") && key !== "origem" && key !== "score") {
          message += `*${key}*\n${value}\n\n`;
        }
      });
    }

    const SDR_PHONE = "553198048618";
    return `https://api.whatsapp.com/send?phone=${SDR_PHONE}&text=${encodeURIComponent(message)}`;
  };

  const getGoogleCalendarUrl = () => {
    if (!selectedDate || !selectedTime) return "#";
    const startStr = formatLocalDateTime(selectedDate, selectedTime);
    const [h, m] = selectedTime.split(":").map(Number);
    const endMinutes = h * 60 + m + 30;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    const endStr = formatLocalDateTime(selectedDate, `${endH}:${endM}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Avalia%C3%A7%C3%A3o+Individual&dates=${startStr}/${endStr}&ctz=America/Sao_Paulo&details=Sua+avalia%C3%A7%C3%A3o+est%C3%A1+confirmada.`;
  };

  const getIcsFile = () => {
    if (!selectedDate || !selectedTime) return "#";
    const startStr = formatLocalDateTime(selectedDate, selectedTime);
    const [h, m] = selectedTime.split(":").map(Number);
    const endMinutes = h * 60 + m + 30;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    const endStr = formatLocalDateTime(selectedDate, `${endH}:${endM}`);
    
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nURL:https://equipe.brenoxavier.com.br\nDTSTART;TZID=America/Sao_Paulo:${startStr}\nDTEND;TZID=America/Sao_Paulo:${endStr}\nSUMMARY:Avaliação Individual\nDESCRIPTION:Sua avaliação está confirmada.\nLOCATION:WhatsApp\nEND:VEVENT\nEND:VCALENDAR`;
    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  };

  const handleAddCalendar = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isApple = /iPad|iPhone|iPod|Mac/.test(userAgent) && !(window as any).MSStream;
    
    if (isApple) {
      const link = document.createElement('a');
      link.href = getIcsFile();
      link.download = "avaliacao.ics";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(getGoogleCalendarUrl(), "_blank");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <CardTitle className="text-2xl text-primary">Agendamento Confirmado!</CardTitle>
            <CardDescription className="text-base text-slate-800 pt-2">
              Seu horário para <strong>{format(selectedDate!, "dd/MM/yyyy")} às {selectedTime}</strong> foi reservado com sucesso.
            </CardDescription>

            <div className="flex flex-col items-center justify-center pt-4">
              <span className="text-xs font-bold text-slate-500 mb-2">ADICIONAR LEMBRETE:</span>
              <Button 
                variant="outline" 
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full sm:w-auto" 
                onClick={handleAddCalendar}
              >
                <CalendarHeart className="w-4 h-4 mr-2" /> Adicionar ao Calendário
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center text-center">
            <p className="text-sm font-bold text-slate-800 mt-4 leading-relaxed max-w-sm mx-auto uppercase">
              Agora é necessário enviar suas fotos no whatsapp para realizarmos a sua avaliação individual
            </p>
            
            <Button 
              size="lg" 
              className="w-full h-14 text-lg bg-[#25D366] hover:bg-[#1DA851] text-white shadow-lg shadow-[#25d366]/30 group"
              onClick={() => window.open(getWhatsAppLink(), "_self")}
            >
              Concluir no WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex py-12 px-4 justify-center">
      <div className="w-full max-w-4xl grid md:grid-cols-[1fr_350px] gap-8">
        
        {/* Lado Esquerdo - Info da Consulta */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">Agende sua Avaliação</h1>
            <p className="text-slate-500 mt-2 text-lg">
              Parabéns <strong>{leadName}</strong>, você foi qualificada! Agora só falta escolher o melhor horário para falarmos com você.
            </p>
          </div>
          
          <Card className="border-none shadow-md">
            <CardContent className="p-0 sm:flex">
              <div className="p-6 sm:border-r border-slate-100 flex-1">
                <div className="flex items-center gap-2 font-semibold text-lg flex-wrap mb-4 text-slate-700">
                  <CalendarHeart className="w-5 h-5 text-primary" />
                  <span>Selecione o Dia</span>
                  {isAutoSelecting && <Loader2 className="w-4 h-4 animate-spin text-primary/50 ml-2" />}
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => {
                    return startOfDay(date) < getMinBookableDate();
                  }}
                  className="rounded-md mx-auto w-full pb-0"
                />
              </div>

              {selectedDate && (
                <div className="p-6 bg-slate-50/50 sm:w-64">
                  <div className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-700">
                    <Clock className="w-5 h-5 text-primary" />
                    Horários
                  </div>
                  
                  {isLoadingSlots ? (
                    <div className="py-8 flex justify-center text-primary/50"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : isDayFull ? (
                    <div className="py-6 text-center text-sm text-amber-600 font-medium">
                      Dia lotado! Máximo de {maxDailyBookings} reuniões atingido. Escolha outro dia.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {availableSlots.filter((time) => {
                        // Block slots that overlap with any booked slot (within gap distance)
                        const slotMin = timeToMinutes(time);
                        const tooClose = bookedSlots.some(booked => {
                          const bookedMin = timeToMinutes(booked);
                          return Math.abs(slotMin - bookedMin) < slotGapMinutes;
                        });
                        if (tooClose) return false;
                        // If today, filter past slots (+30 min buffer)
                        if (isToday(selectedDate!)) {
                          const now = new Date();
                          const timeObj = parse(time, "HH:mm", selectedDate!);
                          if (isBefore(timeObj, addMinutes(now, 30))) {
                            return false;
                          }
                        }
                        return true;
                      }).map((time) => {
                        const isSelected = selectedTime === time;
                        
                        return (
                          <Button
                            key={time}
                            variant={isSelected ? "default" : "outline"}
                            className={`w-full justify-center ${
                              isSelected ? 'bg-primary text-white shadow-md' : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </Button>
                        );
                      })}
                      {availableSlots.filter(t => {
                        const slotMin = timeToMinutes(t);
                        return !bookedSlots.some(b => Math.abs(slotMin - timeToMinutes(b)) < slotGapMinutes);
                      }).length === 0 && (
                        <div className="col-span-full py-6 text-center text-sm text-slate-500">
                          Nenhum horário disponível para esta data.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito - Resumo */}
        <div className="sticky top-6 h-fit">
          <Card className="shadow-lg border-primary/20 overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-xl">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <CalendarHeart className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Data</h4>
                    <p className="font-semibold text-slate-900">
                      {selectedDate ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Nenhuma data"}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <Clock className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Horário</h4>
                    <p className="font-semibold text-slate-900">
                      {selectedTime ? `${selectedTime} (Horário de Brasília)` : "Nenhum horário"}
                    </p>
                    {selectedTime && (
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Duração: 30 minutos
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <Button 
                  size="lg" 
                  className="w-full shadow-md" 
                  disabled={!selectedDate || isSubmitting}
                  onClick={handleBooking}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Agendamento"}
                </Button>
                <p className="text-xs text-center text-slate-400 mt-3 px-2">
                  Você será redirecionada(o) ao WhatsApp para finalizar o envio das suas respostas da avaliação.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
