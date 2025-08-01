
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Activity, Clock, Users, Trash2 } from 'lucide-react';
import { Group, Patient, Exercise, Therapist } from '../types';
import * as patientService from '../services/patientService';
import * as exerciseService from '../services/exerciseService';
import * as therapistService from '../services/therapistService';
import { useToast } from '../contexts/ToastContext';
import Skeleton from './ui/Skeleton';

interface GroupFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (group: Omit<Group, 'id' | 'capacity' | 'status'> & { id?: string }) => Promise<void>;
    groupToEdit?: Group;
}

const initialFormData: Omit<Group, 'id' | 'capacity' | 'status' | 'members' | 'exercises'> & { members: string[], exercises: string[] } = {
    name: '',
    description: '',
    therapistId: '',
    members: [],
    schedule: { days: [], time: '09:00', duration: 50 },
    exercises: [],
};

const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const GroupFormModal: React.FC<GroupFormModalProps> = ({ isOpen, onClose, onSave, groupToEdit }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [therapists, setTherapists] = useState<Therapist[]>([]);

    const { showToast } = useToast();
    const modalRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [p, e, t] = await Promise.all([
                    patientService.getPatients(),
                    exerciseService.getExercises(),
                    therapistService.getTherapists()
                ]);
                setPatients(p);
                setExercises(e);
                setTherapists(t);
            } catch {
                showToast('Erro ao carregar dados para o formulário.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen, showToast]);

    useEffect(() => {
        if (groupToEdit) {
            setFormData({
                name: groupToEdit.name,
                description: groupToEdit.description,
                therapistId: groupToEdit.therapistId,
                schedule: groupToEdit.schedule,
                members: groupToEdit.members.map(m => m.patientId),
                exercises: groupToEdit.exercises.map(e => e.exerciseId),
            });
        } else {
            setFormData(initialFormData);
        }
    }, [groupToEdit, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, [name]: value } }));
    };

    const toggleDay = (day: string) => {
        const days = formData.schedule.days.includes(day)
            ? formData.schedule.days.filter(d => d !== day)
            : [...formData.schedule.days, day];
        setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, days } }));
    };

    const handleMultiSelectChange = (field: 'members' | 'exercises', selectedId: string) => {
        const currentSelection = formData[field];
        const newSelection = currentSelection.includes(selectedId)
            ? currentSelection.filter(id => id !== selectedId)
            : [...currentSelection, selectedId];
        setFormData(prev => ({ ...prev, [field]: newSelection }));
    };

    const handleSaveClick = async () => {
        if (!formData.name || !formData.therapistId) {
            showToast("Nome do grupo e Fisioterapeuta são obrigatórios.", 'error');
            return;
        }
        setIsSaving(true);
        
        const membersData = formData.members.map(patientId => {
            const patient = patients.find(p => p.id === patientId)!;
            return {
                patientId: patient.id,
                patientName: patient.name,
                joinDate: new Date().toISOString(),
                status: 'active' as const,
                level: 'beginner' as const,
                avatarUrl: patient.avatarUrl
            };
        });

        const exercisesData = formData.exercises.map((exerciseId, index) => ({
            exerciseId,
            order: index + 1,
        }));
        
        const submissionData = {
            id: groupToEdit?.id,
            name: formData.name,
            description: formData.description,
            therapistId: formData.therapistId,
            schedule: formData.schedule,
            members: membersData,
            exercises: exercisesData,
        };

        await onSave(submissionData);
        setIsSaving(false);
    };

    const renderMultiSelect = (
        title: string,
        field: 'members' | 'exercises',
        items: (Patient | Exercise)[],
        selectedIds: string[]
    ) => (
        <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-2 space-y-1">
            {items.map(item => (
                <label key={item.id} className="flex items-center p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleMultiSelectChange(field, item.id)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-3 text-sm text-slate-700">{item.name}</span>
                </label>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">{groupToEdit ? 'Editar Grupo' : 'Novo Grupo'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    {isLoading ? <Skeleton className="h-full w-full" /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Nome do Grupo*</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Descrição</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"></textarea>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Fisioterapeuta Responsável*</label>
                                    <select name="therapistId" value={formData.therapistId} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                                        <option value="">Selecione...</option>
                                        {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Horário</label>
                                    <div className="grid grid-cols-2 gap-4">
                                         <input type="time" name="time" value={formData.schedule.time} onChange={handleScheduleChange} className="w-full p-2 border border-slate-300 rounded-lg"/>
                                         <input type="number" name="duration" value={formData.schedule.duration} onChange={handleScheduleChange} placeholder="Duração (min)" className="w-full p-2 border border-slate-300 rounded-lg"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-2">Dias da Semana</label>
                                    <div className="flex flex-wrap gap-2">
                                        {weekDays.map(day => (
                                            <button key={day} onClick={() => toggleDay(day)} type="button" className={`px-3 py-1 text-sm rounded-full border ${formData.schedule.days.includes(day) ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Membros ({formData.members.length})</label>
                                    {renderMultiSelect('Membros', 'members', patients, formData.members)}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Exercícios ({formData.exercises.length})</label>
                                    {renderMultiSelect('Exercícios', 'exercises', exercises, formData.exercises)}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2">Cancelar</button>
                    <button onClick={handleSaveClick} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center disabled:bg-teal-300">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Salvando...' : 'Salvar Grupo'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default GroupFormModal;
