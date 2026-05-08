import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus, Copy, ArrowLeft, ExternalLink,
  MousePointerClick, ShoppingCart, DollarSign, TrendingUp, Code2, ChevronRight, LogOut,
  Trash2, BarChart3, Settings2, TestTube2,
} from "lucide-react";
import { rotatorApi, RotatorLink, RotatorDestination, RotatorStats } from "@/lib/rotatorApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Rotator() {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const [rotators, setRotators] = useState<RotatorLink[]>([]);
  const [selected, setSelected] = useState<RotatorLink | null>(null);
  const [destinations, setDestinations] = useState<RotatorDestination[]>([]);
  const [stats, setStats] = useState<{ stats: RotatorStats[]; totals: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPixel, setShowPixel] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState("resultados");

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const DEFAULT_SLOTS = 10;
  const [slots, setSlots] = useState<Array<{ label: string; url: string; weight: number }>>(
    Array.from({ length: DEFAULT_SLOTS }, (_, i) => ({
      label: `v${i + 1}`,
      url: "",
      weight: 10,
    }))
  );

  useEffect(() => { loadRotators(); }, []);
  useEffect(() => { if (selected) loadDetails(selected.id); }, [selected]);

  const loadRotators = async () => {
    setLoading(true);
    try {
      const data = await rotatorApi.getAll();
      setRotators(data);
      if (idParam) {
        const found = data.find(r => r.id === idParam);
        if (found) setSelected(found);
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (id: string) => {
    try {
      const [dests, statsData] = await Promise.all([
        rotatorApi.getDestinations(id),
        rotatorApi.getTotalStats(id),
      ]);
      setDestinations(dests);
      setStats(statsData);
      const newSlots = Array.from({ length: DEFAULT_SLOTS }, (_, i) => {
        const d = dests[i];
        return d
          ? { label: d.label, url: d.url, weight: d.weight }
          : { label: `v${i + 1}`, url: "", weight: 10 };
      });
      setSlots(newSlots);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const createRotator = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    try {
      const rotator = await rotatorApi.create(
        newName.trim(),
        newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")
      );
      setRotators([rotator, ...rotators]);
      setNewName("");
      setNewSlug("");
      setShowCreate(false);
      toast({ title: "Teste A/B criado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const updateSlot = (index: number, field: "label" | "url" | "weight", value: string | number) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const saveDestinations = async () => {
    if (!selected) return;
    try {
      for (const d of destinations) {
        await rotatorApi.removeDestination(d.id);
      }
      const filledSlots = slots.filter((s) => s.url.trim());
      for (const s of filledSlots) {
        await rotatorApi.addDestination(selected.id, s.url.trim(), s.label.trim(), s.weight);
      }
      await loadDetails(selected.id);
      toast({ title: "Variações salvas!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const deleteRotator = async (id: string) => {
    try {
      await rotatorApi.delete(id);
      setRotators(rotators.filter((r) => r.id !== id));
      if (selected?.id === id) {
        setSelected(null);
        setDestinations([]);
        setStats(null);
      }
      toast({ title: "Teste removido" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const filledSlots = slots.filter((s) => s.url.trim());
  const totalWeight = filledSlots.reduce((s, d) => s + d.weight, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/teste">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <TestTube2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Testes A/B</h1>
              <p className="text-xs text-muted-foreground">Crie projetos para testar múltiplas páginas</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Header + Create */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Testes A/B</h2>
                <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
                  <Plus className="h-4 w-4" /> Criar
                </Button>
              </div>

              {showCreate && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary/20 bg-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Novo Teste A/B</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nome do teste (ex: LP Captação)"
                      className="h-10 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      placeholder="Apelido do link (ex: captacao-mar)"
                      className="h-10 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <Button onClick={createRotator} disabled={!newName.trim() || !newSlug.trim()} className="h-10 gap-2">
                      <Plus className="h-4 w-4" /> Criar Teste
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Project Cards Grid */}
              {loading ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
              ) : rotators.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <TestTube2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum teste criado ainda.</p>
                  <p className="text-xs mt-1">Clique em "+ Criar" para começar seu primeiro teste A/B</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rotators.map((r, idx) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group rounded-xl border border-border bg-card hover:border-primary/40 transition-all cursor-pointer overflow-hidden"
                      onClick={() => { setSelected(r); setActiveTab("resultados"); }}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <TestTube2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{r.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <span className="text-primary/80">$</span> Vendas • {formatDate(r.created_at)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteRotator(r.id); }}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-border/50 px-5 py-3">
                        <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary" size="sm">
                          <BarChart3 className="h-4 w-4" /> Ver Resultados
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Detail Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setSelected(null); setStats(null); }} className="text-muted-foreground hover:text-foreground transition">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <TestTube2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold">{selected.name}</h1>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded">Vendas</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate max-w-md">{rotatorApi.getRedirectUrl(selected.slug)}</p>
                      <button onClick={() => copyToClipboard(rotatorApi.getRedirectUrl(selected.slug))} className="text-primary hover:text-primary/80">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              {stats && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { icon: MousePointerClick, label: "Visitas", value: stats.totals.clicks.toLocaleString("pt-BR"), color: "text-primary" },
                    { icon: ShoppingCart, label: "Checkouts", value: `${stats.totals.checkouts}`, sub: `${stats.totals.checkout_rate.toFixed(1)}%`, color: "text-amber-400" },
                    { icon: DollarSign, label: "Conversões", value: `${stats.totals.purchases}`, sub: `${stats.totals.conversion_rate.toFixed(1)}%`, color: "text-emerald-400" },
                    { icon: TrendingUp, label: "Receita", value: `R$ ${stats.totals.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "text-primary" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                        <span className="text-xs">{kpi.label}</span>
                      </div>
                      <p className="mt-2 text-xl font-bold text-foreground">
                        {kpi.value}
                        {kpi.sub && <span className="text-sm font-normal text-muted-foreground ml-1">({kpi.sub})</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabs: Resultados | Configurar | Pixel */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="resultados" className="gap-2"><BarChart3 className="h-4 w-4" /> Resultados</TabsTrigger>
                  <TabsTrigger value="config" className="gap-2"><Settings2 className="h-4 w-4" /> Configurar Variações</TabsTrigger>
                  <TabsTrigger value="pixel" className="gap-2"><Code2 className="h-4 w-4" /> Pixel</TabsTrigger>
                </TabsList>

                {/* Results Table */}
                <TabsContent value="resultados" className="mt-6">
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead className="text-xs font-semibold uppercase tracking-wider">Variação</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Visitas</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Checkouts</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Conv.</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Receita</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Taxa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats?.stats && stats.stats.length > 0 ? (
                          stats.stats.map((s, i) => {
                            const bestConversion = Math.max(...stats.stats.map((x) => x.conversion_rate));
                            const isBest = s.conversion_rate === bestConversion && s.conversion_rate > 0;
                            return (
                              <TableRow key={s.destination_id} className={`border-border/30 ${isBest ? "border-l-2 border-l-primary" : ""}`}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">{s.label || `v${i + 1}`}</span>
                                    {isBest && <TrendingUp className="h-3.5 w-3.5 text-primary" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                                    {s.url.replace(/^https?:\/\//, "").split("?")[0]}
                                  </p>
                                </TableCell>
                                <TableCell className="text-right font-medium">{s.clicks}</TableCell>
                                <TableCell className="text-right font-medium">{s.checkouts}</TableCell>
                                <TableCell className="text-right font-medium">{s.purchases}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {s.revenue > 0 ? `R$ ${s.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                                </TableCell>
                                <TableCell className={`text-right font-bold ${isBest ? "text-primary" : s.conversion_rate > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                                  {s.conversion_rate.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                              Nenhuma variação configurada. Vá em "Configurar Variações" para adicionar páginas.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Config Tab */}
                <TabsContent value="config" className="mt-6">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold">Variações do Teste</h3>
                        <p className="text-xs text-muted-foreground mt-1">Configure até 10 páginas para testar. Defina o peso de tráfego para cada uma.</p>
                      </div>
                      <Button onClick={saveDestinations} size="sm">Salvar</Button>
                    </div>

                    {totalWeight > 0 && totalWeight !== 100 && (
                      <div className="mb-4 text-xs font-medium text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg">
                        A soma dos pesos é {totalWeight}% — o ideal é 100%
                      </div>
                    )}

                    <div className="space-y-3">
                      {slots.map((slot, i) => {
                        const pctReal = slot.url.trim() && totalWeight > 0 ? ((slot.weight / totalWeight) * 100).toFixed(1) : "—";
                        return (
                          <div
                            key={i}
                            className={`rounded-lg border p-4 transition ${slot.url.trim() ? "border-border bg-secondary/30" : "border-border/20 bg-secondary/5 opacity-50"}`}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                                {i + 1}
                              </span>
                              <span className="text-xs font-semibold text-foreground">{slot.label || `v${i + 1}`}</span>
                              {slot.url.trim() && (
                                <span className="ml-auto text-xs text-primary">{pctReal}% do tráfego</span>
                              )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-[120px_1fr_80px]">
                              <input
                                value={slot.label}
                                onChange={(e) => updateSlot(i, "label", e.target.value)}
                                placeholder="Nome"
                                className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                              <input
                                value={slot.url}
                                onChange={(e) => updateSlot(i, "url", e.target.value)}
                                placeholder="URL (https://...)"
                                className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                              <div className="relative">
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={slot.weight}
                                  onChange={(e) => updateSlot(i, "weight", parseInt(e.target.value) || 1)}
                                  className="h-9 w-full rounded-lg border border-border bg-secondary px-3 pr-7 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                {/* Pixel Tab */}
                <TabsContent value="pixel" className="mt-6">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Code2 className="h-4 w-4 text-primary" /> Pixel de Rastreamento
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Cole este código nas suas páginas de destino para rastrear checkouts e compras.
                    </p>
                    <div className="relative">
                      <pre className="overflow-x-auto rounded-lg bg-secondary p-4 text-xs text-foreground">
                        {rotatorApi.getTrackingPixelSnippet(selected.slug)}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(rotatorApi.getTrackingPixelSnippet(selected.slug))}
                        className="absolute right-2 top-2 rounded-lg bg-card p-1.5 text-muted-foreground hover:text-foreground transition"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
