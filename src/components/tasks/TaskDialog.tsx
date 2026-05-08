import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";

import { CollaboratorTask } from "@/lib/taskTypes";

interface TaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task?: CollaboratorTask;
}

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState<Date>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const { upsertTask } = useTasks();

    useEffect(() => {
        if (task) {
            setSelectedUser(task.userId);
            setTitle(task.title);
            setDescription(task.description || "");
            setDate(new Date(task.dueDate));
        } else if (open) {
            // Reset for new task
            setSelectedUser("");
            setTitle("");
            setDescription("");
            setDate(undefined);
        }
    }, [task, open]);

    const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
        queryKey: ["profiles-list"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name")
                .eq("approved", true);
            if (error) throw error;
            return data;
        },
        enabled: open,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !title || !date) return;

        setIsSubmitting(true);
        try {
            await upsertTask({
                id: task?.id,
                userId: selectedUser,
                title,
                description,
                dueDate: date.toISOString(),
                status: task?.status || 'pending',
                type: task?.type || 'manual',
            });
            onOpenChange(false);
            setTitle("");
            setDescription("");
            setDate(undefined);
            setSelectedUser("");
        } catch (err: any) {
            console.error("Task submission error:", err);
            // Error is handled by the mutation's onError (via toast)
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{task ? "Editar Tarefa" : "Atribuir Nova Tarefa"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="user">Colaborador</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingProfiles ? "Carregando..." : "Selecionar..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Título da Tarefa</Label>
                        <Input
                            id="title"
                            placeholder="Ex: Revisar treino da Aluna X"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição (opcional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Detalhes adicionais..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Prazo de Entrega</Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: ptBR }) : "Selecionar data"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => {
                                        setDate(d);
                                        setCalendarOpen(false);
                                    }}
                                    initialFocus
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isSubmitting || !selectedUser || !title || !date} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {task ? "Atualizar Tarefa" : "Criar Tarefa"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
