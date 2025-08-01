

import React, { useState, useEffect, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { User, Cake, Phone, Mail, Stethoscope, ChevronLeft, Edit, FileText, Plus, Target, Activity, ListChecks, Video, ShieldCheck, AlertTriangle, Frown, Meh, Smile, LineChart, ClipboardCopy, Stethoscope as SurgeryIcon, Paperclip, Upload, BarChart, Heart, X } from 'lucide-react';
import * as patientService from '../services/patientService';
import * as soapNoteService from '../services/soapNoteService';
import * as appointmentService from '../services/appointmentService';
import * as therapistService from '../services/therapistService';
import * as painLogService from '../services/painLogService';
import * as treatmentService from '../services/treatmentService';
import PageHeader from '../components/PageHeader';
import NewSoapNoteModal from '../components/NewSoapNoteModal';
import PatientFormModal from '../components/PatientFormModal';
import { SoapNote, Appointment, TreatmentPlan, ExercisePrescription, Patient, Therapist, PainLog, Surgery, PatientAttachment, TrackedMetric, Condition } from '../types';
import AppointmentFormModal from '../components/AppointmentFormModal';
import PageLoader from '../components/ui/PageLoader';
import { usePageData } from '../hooks/usePageData';
import InfoCard from '../components/ui/InfoCard';
import { useToast } from '../contexts/ToastContext';
import { generateRecurrences } from '../services/scheduling/recurrenceService';
import { findConflict } from '../services/scheduling/conflictDetection';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';
import MetricTrackerCard from '../components/MetricTrackerCard';
import MetricEvolutionChart from '../components/MetricEvolutionChart';
import ClinicalHistoryTimeline from '../components/ClinicalHistoryTimeline';

const InfoPill: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-100 rounded-lg text-slate-600">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <div className="text-sm font-semibold text-slate-800">{value}</div>
        </div>
    </div>
);

const calculateTimeSince = (dateString: string) => {
    const surgeryDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - surgeryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    return { days: diffDays, weeks: diffWeeks };
};

const TreatmentPlanCard: React.FC<{ plan: TreatmentPlan }> = ({ plan }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="border-b border-slate-200 pb-4 mb-4">
            <h4 className="font-bold text-lg text-slate-800">Plano de Tratamento</h4>
            <p className="text-sm text-slate-500">Diagnóstico COFFITO: {plan.coffitoDiagnosisCodes}</p>
        </div>
        <div className="space-y-4 text-sm">
            <div>
                <h5 className="font-semibold text-sky-600 flex items-center mb-2"><Target className="w-4 h-4 mr-2" /> Objetivos Principais</h5>
                <p className="text-slate-600 pl-6">{plan.treatmentGoals}</p>
            </div>
             <div>
                <h5 className="font-semibold text-sky-600 flex items-center mb-2"><ListChecks className="w-4 h-4 mr-2" /> Exercícios Prescritos</h5>
                <div className="flex flex-wrap gap-2 pl-6">
                    {(plan.exercises || []).map(ex => 
                        <span key={ex.id} className="px-3 py-1 text-sm bg-slate-100 text-slate-800 rounded-md shadow-sm">
                           {ex.exerciseName} ({ex.sets}x{ex.repetitions})
                        </span>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const SoapNoteDetailModal: React.FC<{ note: SoapNote | null, onClose: () => void, onDuplicate: (note: SoapNote) => void }> = ({ note, onClose, onDuplicate }) => {
    if (!note) return null;

    const getPainInfo = (score: number) => {
        if (score >= 7) return { color: 'text-red-600', bgColor: 'bg-red-100', icon: <Frown className="w-4 h-4" /> };
        if (score >= 4) return { color: 'text-amber-600', bgColor: 'bg-amber-100', icon: <Meh className="w-4 h-4" /> };
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: <Smile className="w-4 h-4" /> };
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-start p-4 border-b">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Sessão #{note.sessionNumber} - {note.date}</h3>
                        <p className="text-sm text-slate-500">Por: {note.therapist}</p>
                    </div>
                     <div className="flex items-center space-x-2">
                        {note.painScale !== undefined && (
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${getPainInfo(note.painScale).bgColor} ${getPainInfo(note.painScale).color}`}>
                                {getPainInfo(note.painScale).icon}
                                <span>Dor: {note.painScale}/10</span>
                            </div>
                        )}
                        <button onClick={() => { onDuplicate(note); onClose(); }} title="Duplicar esta sessão" className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-sky-600">
                            <ClipboardCopy className="w-5 h-5" />
                        </button>
                         <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-4">
                     <div><strong className="font-semibold text-sky-600 block mb-1">S (Subjetivo):</strong> <MarkdownRenderer content={note.subjective || '*N/A*'} /></div>
                    <div><strong className="font-semibold text-sky-600 block mb-1">O (Objetivo):</strong> <MarkdownRenderer content={note.objective} /></div>
                    <div><strong className="font-semibold text-sky-600 block mb-1">A (Avaliação):</strong> <MarkdownRenderer content={note.assessment} /></div>
                    <div><strong className="font-semibold text-sky-600 block mb-1">P (Plano):</strong> <MarkdownRenderer content={note.plan} /></div>
                </main>
            </div>
        </div>
    );
};


const PatientDetailPage: React.FC = () => {
    const { id } = ReactRouterDOM.useParams<{ id: string }>();
    const [pageError, setPageError] = useState<string | null>(null);

    const [currentPatient, setCurrentPatient] = useState<Patient | undefined>(undefined);
    const [patientNotes, setPatientNotes] = useState<SoapNote[]>([]);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | undefined>(undefined);
    
    const [isSoapModalOpen, setIsSoapModalOpen] = useState(false);
    const [noteToDuplicate, setNoteToDuplicate] = useState<SoapNote | null>(null);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [noteForDetail, setNoteForDetail] = useState<SoapNote | null>(null);
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { showToast } = useToast();

    const fetchPageData = useCallback(async () => {
        if (!id) return;
        try {
            const [patientData, notesData, therapistsData, planData] = await Promise.all([
                patientService.getPatientById(id),
                soapNoteService.getNotesByPatientId(id),
                therapistService.getTherapists(),
                treatmentService.getPlanByPatientId(id),
            ]);

            setCurrentPatient(patientData);
            setPatientNotes(notesData);
            setTherapists(therapistsData);
            setTreatmentPlan(planData);
            
        } catch (err) {
            setPageError("Falha ao carregar dados do paciente.");
            console.error(err);
        }
    }, [id]);

    const { isLoading, error, refetch } = usePageData([fetchPageData], [id]);
    
    const handleSaveNote = async (newNoteData: Omit<SoapNote, 'id' | 'patientId' | 'therapist'>) => {
        if (!currentPatient) return;
        const newNote = await soapNoteService.addNote(currentPatient.id, newNoteData);
        setPatientNotes(prevNotes => [newNote, ...prevNotes].sort((a,b) => (b.sessionNumber || 0) - (a.sessionNumber || 0)));
        setIsSoapModalOpen(false);
    };
    
    const handleDuplicateNote = (note: SoapNote) => {
        setNoteToDuplicate(note);
        setIsSoapModalOpen(true);
    };
    
    const handleCloseSoapModal = () => {
        setIsSoapModalOpen(false);
        setNoteToDuplicate(null);
    }

    const handleSavePatient = async (updatedData: Omit<Patient, 'id' | 'lastVisit'>) => {
        if (!currentPatient) return;
        const updatedPatient = await patientService.updatePatient({ ...currentPatient, ...updatedData });
        setCurrentPatient(updatedPatient);
        setIsPatientModalOpen(false);
    };
    
    const handleMetricsUpdate = async (newMetrics: TrackedMetric[]) => {
        if (!currentPatient) return;
        try {
            const updatedPatient = await patientService.updatePatient({ ...currentPatient, trackedMetrics: newMetrics });
            setCurrentPatient(updatedPatient);
            showToast('Métricas de acompanhamento atualizadas!', 'success');
        } catch (error) {
            showToast('Falha ao atualizar métricas.', 'error');
        }
    };
    
    const handleFileUpload = async () => {
        if (!selectedFile || !currentPatient) return;
        try {
            const newAttachment = await patientService.addAttachment(currentPatient.id, selectedFile);
            setCurrentPatient(prev => prev ? { ...prev, attachments: [...(prev.attachments || []), newAttachment] } : undefined);
            showToast('Arquivo anexado com sucesso!', 'success');
            setSelectedFile(null);
        } catch (error) {
            showToast('Falha ao anexar arquivo.', 'error');
        }
    };

    if (isLoading) return <PageLoader />;
    if (error || pageError) return <div className="text-center p-10 text-red-500">{error?.message || pageError}</div>;
    if (!currentPatient) return <div className="text-center p-10">Paciente não encontrado.</div>;
    
    const birthDate = new Date(currentPatient.birthDate);
    const formattedBirthDate = !isNaN(birthDate.getTime()) ? birthDate.toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A';

    return (
        <>
            <PageHeader
                title={currentPatient.name}
                subtitle={`Detalhes do prontuário, histórico e agendamentos.`}
            >
                <ReactRouterDOM.Link to="/patients" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 mr-3">
                    <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
                    Voltar
                </ReactRouterDOM.Link>
                 <button onClick={() => setIsPatientModalOpen(true)} className="inline-flex items-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600">
                    <Edit className="-ml-1 mr-2 h-5 w-5" />
                    Editar Cadastro
                </button>
            </PageHeader>
            
            <NewSoapNoteModal isOpen={isSoapModalOpen} onClose={handleCloseSoapModal} onSave={handleSaveNote} noteToDuplicate={noteToDuplicate} />
            <PatientFormModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={handleSavePatient} patientToEdit={currentPatient} />
            <SoapNoteDetailModal note={noteForDetail} onClose={() => setNoteForDetail(null)} onDuplicate={handleDuplicateNote} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Patient Info */}
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="Informações Pessoais" icon={<User />}>
                        <div className="space-y-4">
                            <InfoPill icon={<Cake className="w-5 h-5"/>} label="Data de Nascimento" value={formattedBirthDate} />
                            <InfoPill icon={<Phone className="w-5 h-5"/>} label="Telefone" value={currentPatient.phone} />
                            <InfoPill icon={<Mail className="w-5 h-5"/>} label="Email" value={currentPatient.email} />
                        </div>
                    </InfoCard>
                    
                    {currentPatient.conditions && currentPatient.conditions.length > 0 && (
                        <InfoCard title="Condições / Queixas" icon={<Heart />}>
                            <ul className="space-y-3">
                                {currentPatient.conditions.map((condition, index) => {
                                    const timeSince = calculateTimeSince(condition.date);
                                    return (
                                    <li key={index} className="p-3 bg-slate-50 rounded-lg">
                                        <p className="font-semibold text-slate-800">{condition.name}</p>
                                        <div className="text-xs text-slate-500 mt-1">
                                            <span>Início: {new Date(condition.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                            <span className="mx-1">•</span>
                                            <span>{timeSince.days} dias</span>
                                        </div>
                                    </li>
                                )})}
                            </ul>
                        </InfoCard>
                    )}

                    {currentPatient.surgeries && currentPatient.surgeries.length > 0 && (
                        <InfoCard title="Histórico Cirúrgico" icon={<SurgeryIcon />}>
                            <ul className="space-y-3">
                                {currentPatient.surgeries.map((surgery, index) => {
                                    const timeSince = calculateTimeSince(surgery.date);
                                    return (
                                    <li key={index} className="p-3 bg-slate-50 rounded-lg">
                                        <p className="font-semibold text-slate-800">{surgery.name}</p>
                                        <div className="text-xs text-slate-500 mt-1">
                                            <span>{new Date(surgery.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                            <span className="mx-1">•</span>
                                            <span>{timeSince.days} dias</span>
                                            <span className="mx-1">•</span>
                                            <span>{timeSince.weeks} semanas</span>
                                        </div>
                                    </li>
                                )})}
                            </ul>
                        </InfoCard>
                    )}
                    
                    <InfoCard title="Anexos do Paciente" icon={<Paperclip />}>
                         <div className="space-y-3 mb-4">
                            {(currentPatient.attachments || []).map((file, index) => (
                                <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 bg-slate-50 rounded-lg hover:bg-slate-100">
                                    <FileText className="w-5 h-5 text-slate-500 mr-3" />
                                    <span className="text-sm text-slate-700 font-medium truncate">{file.name}</span>
                                    <span className="text-xs text-slate-500 ml-auto">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </a>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                             <input type="file" id="file-upload" className="hidden" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                             <label htmlFor="file-upload" className="w-full text-center px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer truncate">
                                {selectedFile ? selectedFile.name : 'Escolher arquivo...'}
                            </label>
                            <button onClick={handleFileUpload} disabled={!selectedFile} className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-slate-300">
                                <Upload className="w-5 h-5" />
                            </button>
                        </div>
                    </InfoCard>

                </div>

                {/* Right Column - Clinical Info */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {treatmentPlan ? (
                        <TreatmentPlanCard plan={treatmentPlan} />
                    ) : (
                         <InfoCard title="Plano de Tratamento" icon={<FileText />}>
                            <div className="text-center py-8">
                                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                                <h3 className="mt-2 text-sm font-medium text-slate-900">Nenhum plano de tratamento ativo</h3>
                            </div>
                        </InfoCard>
                    )}

                     <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900">Histórico Clínico</h3>
                         <button onClick={() => setIsSoapModalOpen(true)} className="inline-flex items-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600">
                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                            Nova Anotação
                        </button>
                    </div>

                    <ClinicalHistoryTimeline notes={patientNotes} onViewNote={setNoteForDetail} />

                    <MetricTrackerCard
                        metrics={currentPatient.trackedMetrics || []}
                        onUpdateMetrics={handleMetricsUpdate}
                    />

                    {(currentPatient.trackedMetrics || []).filter(m => m.isActive).map(metric => (
                        <MetricEvolutionChart
                            key={metric.id}
                            metric={metric}
                            notes={patientNotes}
                        />
                    ))}
                    
                </div>
            </div>
        </>
    );
};

export default PatientDetailPage;