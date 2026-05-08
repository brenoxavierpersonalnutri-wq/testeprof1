import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, upsertTask, updateTaskStatus, deleteTask } from "@/lib/taskStore";
import { CollaboratorTask } from "@/lib/taskTypes";
import { useToast } from "@/hooks/use-toast";

export function useTasks(userId?: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const query = useQuery({
        queryKey: ["tasks", userId],
        queryFn: () => fetchTasks(userId),
    });

    const updateMutation = useMutation({
        mutationFn: (task: Partial<CollaboratorTask>) => upsertTask(task),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast({ title: "Agenda atualizada", description: "Tarefa salva com sucesso." });
        },
        onError: (err: any) => {
            toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: 'pending' | 'completed' }) => updateTaskStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
        onError: (err: any) => {
            toast({ title: "Erro ao atualizar status", description: err.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast({ title: "Tarefa removida", description: "A tarefa foi excluída da agenda." });
        },
        onError: (err: any) => {
            toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
        },
    });

    return {
        ...query,
        upsertTask: updateMutation.mutate,
        updateStatus: statusMutation.mutate,
        deleteTask: deleteMutation.mutate,
    };
}
