// pages/KanbanPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { Task, TaskStatus, Therapist } from '../types';
import * as taskService from '../services/taskService';
import * as therapistService from '../services/therapistService';
import { Plus, ListTodo } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface ColumnProps {
    title: string;
    tasks: Task[];
    therapists: Therapist[];
    onTaskClick: (task: Task) => void;
}

const KanbanColumn: React.FC<ColumnProps> = ({ title, tasks, therapists, onTaskClick }) => (
    <div className="w-80 flex-shrink-0 bg-slate-100 rounded-xl p-3">
        <h3 className="font-semibold text-slate-700 mb-3 px-1">{title} ({tasks.length})</h3>
        <div className="space-y-3 h-full overflow-y-auto">
            {tasks.map(task => (
                <TaskCard
                    key={task.id}
                    task={task}
                    therapist={therapists.find(t => t.id === task.assignedUserId)}
                    onClick={() => onTaskClick(task)}
                />
            ))}
        </div>
    </div>
);

const KanbanPage: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);

    const { user } = useAuth();
    const { showToast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tasksData, therapistsData] = await Promise.all([
                taskService.getTasks(),
                therapistService.getTherapists(),
            ]);
            setTasks(tasksData);
            setTherapists(therapistsData);
        } catch (error) {
            showToast('Falha ao carregar dados do quadro de tarefas.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns = useMemo(() => ({
        [TaskStatus.ToDo]: tasks.filter(t => t.status === TaskStatus.ToDo),
        [TaskStatus.InProgress]: tasks.filter(t => t.status === TaskStatus.InProgress),
        [TaskStatus.Done]: tasks.filter(t => t.status === TaskStatus.Done),
    }), [tasks]);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleOpenNewTaskModal = () => {
        setSelectedTask(undefined);
        setIsModalOpen(true);
    };

    const handleSaveTask = async (taskData: Omit<Task, 'id' | 'actorUserId'> & { id?: string }) => {
        if (!user) return;
        const previousAssigneeId = selectedTask?.assignedUserId;
        
        await taskService.saveTask(taskData, user.id);
        
        if (taskData.assignedUserId && taskData.assignedUserId !== previousAssigneeId) {
            const assignee = therapists.find(t => t.id === taskData.assignedUserId);
            if(assignee) {
                 showToast(`Tarefa "${taskData.title}" atribuída a ${assignee.name}.`, 'success');
            }
        } else if (taskData.id) {
             showToast('Tarefa atualizada com sucesso!', 'success');
        } else {
            showToast('Tarefa criada com sucesso!', 'success');
        }

        fetchData(); // Refresh data
        setIsModalOpen(false);
    };

    return (
        <>
            <PageHeader
                title="Quadro de Tarefas"
                subtitle="Organize as atividades da clínica de forma visual e colaborativa."
            >
                <button
                    onClick={handleOpenNewTaskModal}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Nova Tarefa
                </button>
            </PageHeader>
            
            <TaskFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                taskToEdit={selectedTask}
                therapists={therapists}
            />

            <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                         <div key={i} className="w-80 flex-shrink-0 bg-slate-100 rounded-xl p-3">
                            <Skeleton className="h-6 w-1/2 mb-4" />
                            <Skeleton className="h-24 w-full mb-3" />
                            <Skeleton className="h-24 w-full" />
                         </div>
                    ))
                ) : (
                    <>
                        <KanbanColumn title={TaskStatus.ToDo} tasks={columns[TaskStatus.ToDo]} therapists={therapists} onTaskClick={handleTaskClick} />
                        <KanbanColumn title={TaskStatus.InProgress} tasks={columns[TaskStatus.InProgress]} therapists={therapists} onTaskClick={handleTaskClick} />
                        <KanbanColumn title={TaskStatus.Done} tasks={columns[TaskStatus.Done]} therapists={therapists} onTaskClick={handleTaskClick} />
                    </>
                )}
            </div>
        </>
    );
};

export default KanbanPage;
