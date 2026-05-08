import { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addDays,
    subDays,
    parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreVertical,
    Trash2,
    Check,
    DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateConsultation } from "@/hooks/useConsultations";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CollaboratorTask } from "@/lib/taskTypes";

type ViewType = "month" | "week" | "day";

export function TaskCalendar({ userId: externalUserId, onEditTask }: { userId?: string; onEditTask?: (task: CollaboratorTask) => void }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewType>("month");
    const { user, isAdmin } = useAuth();
    const effectiveUserId = externalUserId || user?.id;
    const { data: tasks = [], updateStatus, deleteTask } = useTasks(effectiveUserId);

    const nextDate = () => {
        if (view === "month") setCurrentDate(addMonths(currentDate, 1));
        else if (view === "week") setCurrentDate(addDays(currentDate, 7));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const prevDate = () => {
        if (view === "month") setCurrentDate(subMonths(currentDate, 1));
        else if (view === "week") setCurrentDate(subDays(currentDate, 7));
        else setCurrentDate(subDays(currentDate, 1));
    };

    const getDayTasks = (date: Date) => {
        return tasks.filter((t) => isSameDay(parseISO(t.dueDate), date));
    };

    const renderMonthView = () => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        const days = eachDayOfInterval({ start, end });

        return (
            <div className="grid grid-cols-7 gap-px bg-muted overflow-hidden rounded-lg border border-border">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                    <div key={d} className="bg-background py-2 text-center text-xs font-semibold text-muted-foreground border-b border-border">
                        {d}
                    </div>
                ))}
                {days.map((day) => {
                    const dayTasks = getDayTasks(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "bg-background min-h-[100px] p-2 transition-colors",
                                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                                isToday && "bg-primary/5"
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                    "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                    isToday && "bg-primary text-primary-foreground font-bold"
                                )}>
                                    {format(day, "d")}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {dayTasks.slice(0, 3).map((task) => (
                                    <TaskItem key={task.id} task={task} compact onEdit={onEditTask} />
                                ))}
                                {dayTasks.length > 3 && (
                                    <div className="text-[10px] text-muted-foreground pl-1 font-medium">
                                        + {dayTasks.length - 3} mais...
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWeekView = () => {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        const days = eachDayOfInterval({ start, end });

        return (
            <div className="grid grid-cols-7 gap-4">
                {days.map((day) => {
                    const dayTasks = getDayTasks(day);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div key={day.toISOString()} className="space-y-4">
                            <div className={cn(
                                "text-center p-2 rounded-lg border transition-all",
                                isToday ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border"
                            )}>
                                <div className="text-xs uppercase font-bold opacity-80">{format(day, "EEE", { locale: ptBR })}</div>
                                <div className="text-2xl font-bold">{format(day, "d")}</div>
                            </div>
                            <div className="space-y-2">
                                {dayTasks.map((task) => (
                                    <TaskItem key={task.id} task={task} onEdit={onEditTask} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDayView = () => {
        const dayTasks = getDayTasks(currentDate);
        return (
            <div className="max-w-2xl mx-auto space-y-2">
                <div className="text-center mb-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{format(currentDate, "EEEE", { locale: ptBR })}</div>
                    <div className="text-2xl font-bold">{format(currentDate, "d 'de' MMMM", { locale: ptBR })}</div>
                </div>
                {dayTasks.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-muted rounded-2xl text-muted-foreground text-xs">
                        Sem tarefas para este dia.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dayTasks.map((task) => (
                            <TaskItem key={task.id} task={task} full onEdit={onEditTask} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())} title="Hoje">
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center border rounded-md">
                        <Button variant="ghost" size="icon" onClick={prevDate} className="h-9 w-9 rounded-r-none">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-4 font-semibold min-w-[140px] text-center">
                            {format(currentDate, view === "month" ? "MMMM yyyy" : "d 'de' MMM", { locale: ptBR })}
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextDate} className="h-9 w-9 rounded-l-none">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex bg-muted p-1 rounded-lg">
                    {(["month", "week", "day"] as ViewType[]).map((v) => (
                        <Button
                            key={v}
                            variant={view === v ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView(v)}
                            className="text-xs h-7 px-3"
                        >
                            {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="min-h-[200px]">
                {view === "month" && renderMonthView()}
                {view === "week" && renderWeekView()}
                {view === "day" && renderDayView()}
            </div>
        </div>
    );
}

function TaskItem({ task, compact, full, onEdit }: { task: CollaboratorTask; compact?: boolean; full?: boolean; onEdit?: (task: CollaboratorTask) => void }) {
    const { updateStatus, deleteTask } = useTasks();
    const updateConsultation = useUpdateConsultation();
    const { isAdmin } = useAuth();
    const isCompleted = task.status === "completed";

    const typeConfig = {
        liberacao: { color: "bg-blue-500", label: "Liberação" },
        reavaliacao: { color: "bg-orange-500", label: "Reavaliação" },
        manual: { color: "bg-purple-500", label: "Manual" },
        residuo: { color: "bg-emerald-500", label: "Cobrar Restante" },
        outro: { color: "bg-gray-500", label: "Outro" },
    };

    const config = typeConfig[task.type] || typeConfig.outro;

    if (compact) {
        return (
            <div
                className={cn(
                    "px-1.5 py-1 text-[10px] rounded border flex items-start gap-1 cursor-pointer transition-opacity hover:bg-muted/50",
                    isCompleted ? "opacity-40 bg-muted line-through" : "bg-background"
                )}
                onClick={() => onEdit?.(task)}
                title={task.title}
            >
                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0 mt-1", config.color)} />
                <span className="flex-1 break-words leading-tight whitespace-normal">{task.title}</span>
            </div>
        );
    }

    return (
        <div className={cn(
            "p-3 rounded-xl border bg-card transition-all flex items-start gap-3",
            isCompleted ? "opacity-50 grayscale bg-muted/50" : "shadow-sm hover:shadow-md border-border"
        )}>
            <Button
                size="icon"
                variant={isCompleted ? "secondary" : "outline"}
                className={cn("h-8 w-8 rounded-full shrink-0", !isCompleted && "hover:border-success hover:text-success")}
                onClick={() => {
                    const newStatus = isCompleted ? "pending" : "completed";
                    updateStatus({ id: task.id, status: newStatus });
                    
                    if (task.metadata?.type === "residuo" && task.metadata?.consultationId) {
                        updateConsultation.mutate({
                            id: task.metadata.consultationId,
                            signalResiduePaid: newStatus === "completed"
                        });
                    }
                }}
            >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : task.type === "residuo" ? <DollarSign className="h-4 w-4 text-emerald-500" /> : <div className="h-4 w-4" />}
            </Button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-1.5 py-0 h-4 border-none text-white", config.color)}>
                        {config.label}
                    </Badge>
                    <span className={cn("text-xs text-muted-foreground", !isCompleted && "text-primary flex items-center gap-1")}>
                        <Clock className="h-3 w-3" />
                        {format(parseISO(task.dueDate), "HH:mm")}
                    </span>
                </div>
                <h4 className={cn("font-semibold text-sm truncate", isCompleted && "line-through")}>{task.title}</h4>
                {full && task.description && (
                    <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                )}
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => updateStatus({ id: task.id, status: isCompleted ? "pending" : "completed" })}>
                        <Check className="mr-2 h-4 w-4" />
                        {isCompleted ? "Marcar pendente" : "Marcar concluída"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(task)}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    {isAdmin && (
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                            if (window.confirm("Excluir esta tarefa?")) deleteTask(task.id);
                        }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
