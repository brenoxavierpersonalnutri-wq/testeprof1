import { useState, useEffect, useCallback } from "react";
import { AlunaStatsCards } from "@/components/alunas/AlunaStatsCards";
import { AlunaList } from "@/components/alunas/AlunaList";
import { AlunaForm } from "@/components/alunas/AlunaForm";
import { AlunaImportSheet } from "@/components/alunas/AlunaImportSheet";
import { AlunaDashboard } from "@/components/alunas/AlunaDashboard";
import { fetchAlunas, upsertAluna, deleteAlunaDb, importAlunasDb } from "@/lib/alunaStore";
import { Aluna } from "@/lib/alunaTypes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, LayoutDashboard, UserPlus, Users, ShoppingCart, Utensils, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import logoCouple from "@/assets/logo-couple.png";
import { UserProfileHeader } from "@/components/UserProfileHeader";
import { RefreshCw, Lock, CalendarPlus, Bell } from "lucide-react";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { useTasks } from "@/hooks/useTasks";
import { isSameDay, parseISO } from "date-fns";

const Alunas = () => {
  const navigate = useNavigate();
  const [alunas, setAlunas] = useState<Aluna[]>([]);
  const [activeTab, setActiveTab] = useState("cadastro");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingAluna, setEditingAluna] = useState<Aluna | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const { signOut, isAdmin, user, allowedModules } = useAuth();
  const { toast } = useToast();
  const { data: tasks = [] } = useTasks(user?.id);

  const handleFilterSelect = (filter: string) => {
    setActiveFilter(filter);
    setActiveTab("dashboard");
  };

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

  useEffect(() => { loadAlunas(); }, [loadAlunas]);

  useEffect(() => {
    const handler = () => loadAlunas();
    window.addEventListener('alunas-updated', handler);
    return () => window.removeEventListener('alunas-updated', handler);
  }, [loadAlunas]);

  // Task Notifications
  useEffect(() => {
    if (tasks.length > 0) {
      const today = new Date();
      const todayTasks = tasks.filter(t =>
        t.status === 'pending' && isSameDay(parseISO(t.dueDate), today)
      );

      if (todayTasks.length > 0) {
        toast({
          title: "Tarefas para Hoje! 🔔",
          description: `Você tem ${todayTasks.length} tarefa(s) pendente(s) para hoje na agenda.`,
          duration: 10000,
        });

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("BX Fitness - Agenda", {
            body: `Você tem ${todayTasks.length} tarefa(s) para hoje!`,
            icon: logoCouple
          });
        }
      }
    }
  }, [tasks, toast]);

  const handleSave = async (aluna: Aluna) => {
    if (!user) return;
    try {
      await upsertAluna(aluna, user.id);
      await loadAlunas();
      setEditingAluna(null);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlunaDb(id);
      await loadAlunas();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = (aluna: Aluna) => { setEditingAluna(aluna); setFormOpen(true); };
  const handleAdd = () => { setEditingAluna(null); setFormOpen(true); };

  const handleImport = async (imported: Aluna[]) => {
    if (!user) return;
    try {
      await importAlunasDb(imported, user.id);
      await loadAlunas();
    } catch (err: any) {
      toast({ title: "Erro ao importar", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleResiduo = async (aluna: Aluna) => {
    if (!user) return;
    try {
      // Toggle the flag directly or assume true if clicked "Mark as Done"
      await upsertAluna({ ...aluna, residuoPago: true }, user.id);
      await loadAlunas();
      toast({ title: "Sucesso", description: "Lembrete marcado como pago!" });
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <UserProfileHeader />
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Início
              </Button>
            </Link>
            <Link to="/alunas/personal-nutri">
              <Button variant="outline" size="sm" className="gap-2 border-primary text-primary">
                <Utensils className="h-4 w-4" />
                Personal/Nutri
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (isAdmin || allowedModules.includes("vendas")) {
                  navigate("/vendas");
                } else {
                  toast({
                    title: "Acesso Negado",
                    description: "Você não tem acesso liberado para este módulo. Solicite ao administrador.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              Consulta
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <AlunaStatsCards alunas={alunas} onFilterSelect={handleFilterSelect} />

            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl p-3 shadow-sm">
              <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                <CalendarPlus className="h-6 w-6 text-primary" />
                Minha Agenda
              </h2>
              <TaskCalendar />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 max-w-sm">
                <TabsTrigger value="cadastro" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Cadastro</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Painel</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cadastro" className="space-y-6">
                <AlunaList alunas={alunas} onEdit={handleEdit} onDelete={handleDelete} onAdd={handleAdd} onImport={() => setImportOpen(true)} onToggleResiduo={handleToggleResiduo} />
              </TabsContent>

              <TabsContent value="dashboard">
                <AlunaDashboard
                  alunas={alunas}
                  onEdit={handleEdit}
                  activeFilter={activeFilter}
                  onClearFilter={() => setActiveFilter(null)}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <AlunaForm
        key={editingAluna?.id || (formOpen ? "new" : "closed")}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingAluna(null); }}
        onSave={handleSave}
        aluna={editingAluna}
      />

      <AlunaImportSheet open={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />

      <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} />
    </div>
  );
};

export default Alunas;
