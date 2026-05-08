export type TaskStatus = 'pending' | 'completed';
export type TaskType = 'manual' | 'reavaliacao' | 'liberacao' | 'residuo';

export interface CollaboratorTask {
    id: string;
    userId: string;
    createdBy: string | null;
    title: string;
    description: string | null;
    dueDate: string;
    status: TaskStatus;
    type: TaskType;
    metadata: {
        alunaId?: string;
        alunaNome?: string;
        type?: string;
        consultationId?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskInput {
    userId: string;
    title: string;
    description?: string;
    dueDate: string;
    type?: TaskType;
    metadata?: any;
}
