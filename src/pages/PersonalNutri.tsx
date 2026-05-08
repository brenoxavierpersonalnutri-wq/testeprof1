import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAlunas, upsertAluna } from "@/lib/alunaStore";
import { Aluna } from "@/lib/alunaTypes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft, Utensils, Camera, ClipboardCheck,
    Calendar as CalendarIcon, Save, RefreshCw, Bell, MessageSquare, ExternalLink, CheckCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import logoCouple from "@/assets/logo-couple.png";
import { cn } from "@/lib/utils";
import { upsertTask } from "@/lib/taskStore";
import { calculateDeliveryDueDate } from "@/lib/businessDaysUtils";
import { Input } from "@/components/ui/input";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROGRAM_OPTIONS } from "@/data/programs";
import { Search } from "lucide-react";

interface AlunaRowProps {
    aluna: Aluna;
    handleUpdateAluna: (aluna: Aluna, updates: Partial<Aluna>) => Promise<void>;
    toast: any;
}

function AlunaRow({ aluna, handleUpdateAluna, toast }: AlunaRowProps) {
    const [fotosOpen, setFotosOpen] = useState(false);
    const [revalOpen, setRevalOpen] = useState(false);

    return (
        <tr className="hover:bg-muted/30 transition-colors">
            <td className="px-6 py-4">
                <div className="font-medium">{aluna.nomeCompleto}</div>
                <div className="text-xs text-muted-foreground">{aluna.programa}</div>
            </td>

            <td className="px-6 py-4">
                <div className="flex justify-center">
                    <Switch
                        checked={!!aluna.fotosAnamnese}
                        onCheckedChange={(val) => handleUpdateAluna(aluna, { fotosAnamnese: val })}
                    />
                </div>
            </td>

            <td className="px-6 py-4">
                <div className="flex justify-center">
                    <Popover open={fotosOpen} onOpenChange={setFotosOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "gap-2 text-xs",
                                    aluna.dataFotosAnamnese && "border-green-500/50 text-green-600 bg-green-50 dark:bg-green-950/20"
                                )}
                            >
                                <Camera className="h-3.5 w-3.5" />
                                {aluna.dataFotosAnamnese ? format(parseISO(aluna.dataFotosAnamnese), "dd/MM") : "Marcar"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                                mode="single"
                                modifiers={{ today: new Date(0) }}
                                selected={aluna.dataFotosAnamnese ? parseISO(aluna.dataFotosAnamnese) : undefined}
                                onSelect={(date) => {
                                    if (date) {
                                        const anamneseDateStr = format(date, "yyyy-MM-dd");
                                        const revalDate = addDays(date, 35);
                                        const revalDateStr = format(revalDate, "yyyy-MM-dd");
                                        handleUpdateAluna(aluna, {
                                            dataFotosAnamnese: anamneseDateStr,
                                            dataAvaliacao: revalDateStr
                                        });
                                        setFotosOpen(false);
                                    } else {
                                        handleUpdateAluna(aluna, {
                                            dataFotosAnamnese: undefined,
                                            dataAvaliacao: undefined
                                        });
                                        setFotosOpen(false);
                                    }
                                }}
                                locale={ptBR}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </td>

            <td className="px-6 py-4">
                <div className="flex justify-center">
                    <Switch
                        checked={!!aluna.liberouTreinoDieta}
                        onCheckedChange={(val) => handleUpdateAluna(aluna, { liberouTreinoDieta: val })}
                    />
                </div>
            </td>

            <td className="px-6 py-4">
                <div className="flex justify-center">
                    <Switch
                        checked={!!aluna.liberouFotos}
                        onCheckedChange={(val) => handleUpdateAluna(aluna, { liberouFotos: val })}
                    />
                </div>
            </td>

            <td className="px-6 py-4">
                <div className="flex justify-center">
                    <Popover open={revalOpen} onOpenChange={setRevalOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "gap-2 text-xs",
                                    aluna.dataAvaliacao && isSameDay(parseISO(aluna.dataAvaliacao), new Date()) && "border-primary text-primary bg-primary/5"
                                )}
                            >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {aluna.dataAvaliacao ? format(parseISO(aluna.dataAvaliacao), "dd/MM") : "---"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                modifiers={{ today: new Date(0) }}
                                selected={aluna.dataAvaliacao ? parseISO(aluna.dataAvaliacao) : undefined}
                                onSelect={(date) => {
                                    if (date) {
                                        handleUpdateAluna(aluna, { dataAvaliacao: format(date, "yyyy-MM-dd") });
                                        setRevalOpen(false);
                                    } else {
                                        handleUpdateAluna(aluna, { dataAvaliacao: undefined });
                                        setRevalOpen(false);
                                    }
                                }}
                                locale={ptBR}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </td>

            <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        title="Marcar rotina completa"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                            const todayStr = format(new Date(), "yyyy-MM-dd");
                            const revalDateStr = format(addDays(new Date(), 35), "yyyy-MM-dd");
                            handleUpdateAluna(aluna, {
                                fotosAnamnese: true,
                                dataFotosAnamnese: aluna.dataFotosAnamnese || todayStr,
                                liberouTreinoDieta: true,
                                liberouFotos: true,
                                dataAvaliacao: aluna.dataAvaliacao || revalDateStr
                            });
                        }}
                    >
                        <CheckCheck className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        title="Enviar WhatsApp"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => {
                            const phone = aluna.telefone?.replace(/\D/g, "");
                            if (!phone) {
                                toast({ title: "Erro", description: "Telefone não cadastrado para esta aluna.", variant: "destructive" });
                                return;
                            }

                            const dataReval = aluna.dataAvaliacao ? format(parseISO(aluna.dataAvaliacao), "dd/MM") : "(data)";

                            const message = `🚀 Seu treino já está no app MFITPERSONAL!

📲 Baixe na loja do seu celular e acesse com o e-mail cadastrado.
➡️ Lá dentro já está tudo liberado pra você começar!

📑 As orientações completas (cardio, água, refeição livre e mais) estão no PDF que vou te enviar.

📸 Sua próxima reavaliação de fotos, vamos marcar na semana do dia ${dataReval} pode ser? 

ESSA SUA REAVALIAÇÃO É DE SUA RESPONSABILIDADE ENVIAR, COMBINADO? - Nesse formato do programa -GORDURA +DEFINIÇÃO, recomendo fazermos as reavaliações a cada 4-6 semanas, mas preciso que entenda que é da sua responsabilidade enviar as fotos. Pode enviar por aqui ou por email, o que preferir ❤️

⚡ Pontos-chave:
1️⃣ Cardio → escolha o que mais gosta (ou odeia menos 😅)..
2️⃣ Treino de Força → assista os vídeos, mande vídeos de execução para correção, o segredo está aqui.
3️⃣ Dieta → busque loucamente deixá-la gostosa, que nem pareça dieta. (A dieta está disponível em "Arquivos" dentro do aplicativo).

Para lista de substituição da dieta, utilize a minha IA (ela é treinada com as minhas referências, vai ser prático e eficiente)
https://chatgpt.com/g/g-68a849119a2c81919f458b4aad730f1b-breno-xavier-personal-e-nutri

✨ VAMOS JUNTOS!!`;

                            window.open(`https://api.whatsapp.com/send?phone=${phone.startsWith("55") ? phone : "55" + phone}&text=${encodeURIComponent(message)}`, "_blank");
                        }}
                    >
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                </div>
            </td>
        </tr>
    );
}

export default function PersonalNutri() {
    const [alunas, setAlunas] = useState<Aluna[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
    const [planFilter, setPlanFilter] = useState<string>("all");
    const [statusTab, setStatusTab] = useState<"ativas" | "inativas">("ativas");

    const [filterAnamnese, setFilterAnamnese] = useState<"all" | "pendente" | "concluido">("all");
    const [filterFotos, setFilterFotos] = useState<"all" | "pendente" | "concluido">("all");
    const [filterTreino, setFilterTreino] = useState<"all" | "pendente" | "concluido">("all");
    const [filterFotosLib, setFilterFotosLib] = useState<"all" | "pendente" | "concluido">("all");

    const filteredAlunas = useMemo(() => {
        let result = alunas.filter(a => statusTab === "ativas" ? a.status !== "inativa" : a.status === "inativa");

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(a => a.nomeCompleto.toLowerCase().includes(lower));
        }

        if (planFilter && planFilter !== "all") {
            result = result.filter(a => a.programa === planFilter);
        }

        if (dateFilter?.from) {
            result = result.filter(a => {
                if (!a.dataCompra) return false;
                try {
                    const d = parseISO(a.dataCompra);
                    if (dateFilter.to) {
                        return d >= dateFilter.from! && d <= dateFilter.to!;
                    }
                    return isSameDay(d, dateFilter.from!);
                } catch {
                    return false;
                }
            });
        }

        if (filterAnamnese !== "all") {
            result = result.filter(a => filterAnamnese === "concluido" ? !!a.fotosAnamnese : !a.fotosAnamnese);
        }
        if (filterFotos !== "all") {
            result = result.filter(a => filterFotos === "concluido" ? !!a.dataFotosAnamnese : !a.dataFotosAnamnese);
        }
        if (filterTreino !== "all") {
            result = result.filter(a => filterTreino === "concluido" ? !!a.liberouTreinoDieta : !a.liberouTreinoDieta);
        }
        if (filterFotosLib !== "all") {
            result = result.filter(a => filterFotosLib === "concluido" ? !!a.liberouFotos : !a.liberouFotos);
        }

        return result;
    }, [alunas, searchTerm, planFilter, dateFilter, filterAnamnese, filterFotos, filterTreino, filterFotosLib]);

    const loadAlunas = useCallback(async () => {
        try {
            const data = await fetchAlunas();
            setAlunas(data);
        } catch (err: any) {
            toast({ title: "Erro ao carregar", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadAlunas();
        // Request notification permission on load
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, [loadAlunas]);

    // Check for re-evaluations today
    useEffect(() => {
        if (alunas.length > 0) {
            const today = new Date();
            const todayEvaluations = alunas.filter(a =>
                a.dataAvaliacao && isSameDay(parseISO(a.dataAvaliacao), today)
            );

            if (todayEvaluations.length > 0) {
                toast({
                    title: "Reavaliações Hoje! 🔔",
                    description: `Você tem ${todayEvaluations.length} aluna(s) para cobrar reavaliação hoje.`,
                    duration: 10000,
                });

                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("BX Fitness - Reavaliações", {
                        body: `Você tem ${todayEvaluations.length} aluna(s) para reavaliar hoje!`,
                        icon: logoCouple
                    });
                }
            }
        }
    }, [alunas, toast]);

    const handleUpdateAluna = async (aluna: Aluna, updates: Partial<Aluna>) => {
        if (!user) return;
        const updatedAluna = { ...aluna, ...updates };

        // Optimistic update
        setAlunas(prev => prev.map(a => a.id === aluna.id ? updatedAluna : a));

        setSaving(aluna.id);
        try {
            await upsertAluna(updatedAluna, user.id);

            // Automatic Tasks Logic
            if (updates.dataFotosAnamnese || (updates.fotosAnamnese && !aluna.fotosAnamnese)) {
                // Task: Liberação de Treino/Dieta (+2 business days)
                const startDate = updates.dataFotosAnamnese ? parseISO(updates.dataFotosAnamnese) : new Date();
                const dueDate = calculateDeliveryDueDate(startDate);

                // Instead of a prefixed ID which breaks UUID columns, we omit the ID so Supabase generates a new UUID
                // If you want to prevent duplicates, you'd need to query first. For now, creating a new task.
                await upsertTask({
                    id: crypto.randomUUID(),
                    userId: user.id,
                    title: `Liberação: ${aluna.nomeCompleto}`,
                    description: `Enviar treino e dieta (vence em ${format(dueDate, "dd/MM")})`,
                    dueDate: dueDate.toISOString(),
                    status: 'pending',
                    type: 'liberacao',
                    metadata: { alunaId: aluna.id, alunaNome: aluna.nomeCompleto }
                });
            }

            if (updates.dataAvaliacao) {
                // Task: Reavaliação
                const dueDate = parseISO(updates.dataAvaliacao);
                await upsertTask({
                    id: crypto.randomUUID(),
                    userId: user.id,
                    title: `Reavaliação: ${aluna.nomeCompleto}`,
                    description: `Cobrar fotos e realizar reavaliação`,
                    dueDate: dueDate.toISOString(),
                    status: 'pending',
                    type: 'reavaliacao',
                    metadata: { alunaId: aluna.id, alunaNome: aluna.nomeCompleto }
                });
            }

            toast({ title: "Atualizado", description: `${aluna.nomeCompleto} atualizada.` });
        } catch (err: any) {
            toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
            loadAlunas(); // Rollback
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/alunas">
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="rounded-xl overflow-hidden">
                            <img src={logoCouple} alt="BG Fitness" className="h-12 w-12 rounded-xl object-cover object-top" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-bold tracking-tight">Painel Personal/Nutri</h1>
                            <p className="text-xs text-muted-foreground">Controle de pendências e reavaliações</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadAlunas} disabled={loading} className="gap-2">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Sincronizar
                    </Button>
                </div>
            </header>

            <main className="container max-w-6xl mx-auto px-4 py-8">
                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 bg-card/50 p-4 rounded-xl border border-border">
                    <div className="flex-1 relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nome..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <DateRangeFilter dateRange={dateFilter} onRangeChange={setDateFilter} onClear={() => setDateFilter(undefined)} />
                    </div>
                    <div className="w-full md:w-56">
                        <Select value={planFilter} onValueChange={setPlanFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Tipo de plano" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os programas</SelectItem>
                                {PROGRAM_OPTIONS.map(p => (
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-6 bg-card/50 p-4 rounded-xl border border-border">
                    <span className="text-xs font-semibold text-muted-foreground self-center w-full md:w-auto uppercase tracking-wider">Filtros de Pendência:</span>
                    <Select value={filterAnamnese} onValueChange={setFilterAnamnese as any}>
                        <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Anamnese/MFIT" /></SelectTrigger>
                        <SelectContent className="text-xs">
                            <SelectItem value="all">Anamnese: Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterFotos} onValueChange={setFilterFotos as any}>
                        <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Enviou Fotos" /></SelectTrigger>
                        <SelectContent className="text-xs">
                            <SelectItem value="all">Env. Fotos: Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="concluido">Recebido</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterTreino} onValueChange={setFilterTreino as any}>
                        <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Treino/Dieta" /></SelectTrigger>
                        <SelectContent className="text-xs">
                            <SelectItem value="all">Treino/Dieta: Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="concluido">Liberado</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterFotosLib} onValueChange={setFilterFotosLib as any}>
                        <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Fotos Lib." /></SelectTrigger>
                        <SelectContent className="text-xs">
                            <SelectItem value="all">Fotos Lib: Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="concluido">Liberado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="mb-6 flex justify-start">
                    <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as any)} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
                            <TabsTrigger value="ativas">Ativas</TabsTrigger>
                            <TabsTrigger value="inativas">Inativas</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                        <RefreshCw className="h-8 w-8 animate-spin" />
                        <p>Carregando alunas...</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="px-6 py-4 text-sm font-semibold">Aluna</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-center whitespace-nowrap">ANAMNESE/MFIT</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-center whitespace-nowrap">ENVIOU FOTOS</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-center whitespace-nowrap">Treino/Dieta</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-center whitespace-nowrap">FOTOS LIB.</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-center">Reavaliação (35 dias)</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredAlunas.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                                    Nenhuma aluna encontrada.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAlunas.map((aluna) => (
                                                <AlunaRow
                                                    key={aluna.id}
                                                    aluna={aluna}
                                                    handleUpdateAluna={handleUpdateAluna}
                                                    toast={toast}
                                                />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                            <Bell className="h-5 w-5 shrink-0" />
                            <p className="text-xs">
                                <strong>Dica:</strong> Datas de reavaliação destacadas em azul indicam que a data é hoje. Você receberá uma notificação ao abrir o sistema!
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
