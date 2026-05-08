import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, TestTube2, Trash2, ExternalLink, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { rotatorApi, RotatorLink } from "@/lib/rotatorApi";
import { motion } from "framer-motion";

export function RotatorTab() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rotators, setRotators] = useState<RotatorLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => { loadRotators(); }, []);

  const loadRotators = async () => {
    setLoading(true);
    try {
      const data = await rotatorApi.getAll();
      setRotators(data);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
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
      toast({ title: "Projeto Criado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const deleteRotator = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await rotatorApi.delete(id);
      setRotators(rotators.filter((r) => r.id !== id));
      toast({ title: "Projeto removido" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-xl font-semibold flex items-center gap-2">
             <Activity className="h-5 w-5 text-primary" /> Projetos Link Master
           </h2>
           <p className="text-sm text-muted-foreground mt-1">Crie links para dividir o tráfego do seu anúncio entre múltiplas páginas e analisar conversão.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" /> Criar Projeto
        </Button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary/20 bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Novo Projeto de Links</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do projeto (ex: Captação)"
              className="h-10 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="Slug do link (ex: captacao-mar)"
              className="h-10 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button onClick={createRotator} disabled={!newName.trim() || !newSlug.trim()} className="h-10 gap-2">
              <Plus className="h-4 w-4" /> Criar Projeto
            </Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando projetos...</div>
      ) : rotators.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl border-border/50">
          <TestTube2 className="h-12 w-12 mx-auto mb-3 opacity-30 text-primary" />
          <p className="text-sm">Nenhum projeto criado ainda.</p>
          <p className="text-xs mt-1">Clique em "+ Criar Projeto" para começar</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rotators.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group flex flex-col justify-between rounded-xl border border-border bg-card hover:border-primary/40 transition-all cursor-pointer overflow-hidden p-5"
              onClick={() => navigate(`/rotator?id=\${r.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteRotator(r.id, e)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Métricas Requisitadas */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-border/40">
                <div>
                   <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Alcance</p>
                   <p className="text-sm font-semibold">0</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Conversão</p>
                   <p className="text-sm font-semibold text-emerald-400">0%</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Investimento</p>
                   <p className="text-sm font-semibold">R$ 0,00</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CTR</p>
                   <p className="text-sm font-semibold">0%</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground group-hover:text-primary transition-colors">
                 <span>Gerenciar URLs e Dashboard</span>
                 <ExternalLink className="h-3.5 w-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
