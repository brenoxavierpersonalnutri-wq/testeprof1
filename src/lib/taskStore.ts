import { supabase } from "@/integrations/supabase/client";
import { CollaboratorTask, CreateTaskInput } from "./taskTypes";

function fromDbRow(row: any): CollaboratorTask {
    return {
        id: row.id,
        userId: row.user_id,
        createdBy: row.created_by,
        title: row.title,
        description: row.description,
        dueDate: row.due_date,
        status: row.status as any,
        type: row.type as any,
        metadata: row.metadata || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function fetchTasks(userId?: string): Promise<CollaboratorTask[]> {
    let query = supabase.from("collaborator_tasks" as any).select("*");

    if (userId) {
        query = query.eq("user_id", userId);
    }

    const { data, error } = await query.order("due_date", { ascending: true });
    if (error) throw error;
    return (data || []).map(fromDbRow);
}

export async function upsertTask(task: Partial<CollaboratorTask>): Promise<void> {
    const { error } = await supabase
        .from("collaborator_tasks" as any)
        .upsert({
            id: task.id,
            user_id: task.userId,
            title: task.title,
            description: task.description,
            due_date: task.dueDate,
            status: task.status,
            type: task.type,
            metadata: task.metadata,
        });
    if (error) throw error;
}

export async function updateTaskStatus(id: string, status: 'pending' | 'completed'): Promise<void> {
    const { error } = await supabase
        .from("collaborator_tasks" as any)
        .update({ status })
        .eq("id", id);
    if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
    const { error } = await supabase
        .from("collaborator_tasks" as any)
        .delete()
        .eq("id", id);
    if (error) throw error;
}
