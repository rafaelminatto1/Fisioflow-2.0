import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import * as soapNoteService from '../../services/soapNoteService';
import { generatePatientProgressSummary, PatientProgressData } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';
import Skeleton from '../../components/ui/Skeleton';
import { Frown, Meh, Smile, Laugh, TrendingUp } from 'lucide-react';
import MarkdownRenderer from '../../components/ui/MarkdownRenderer';

const LoadingSkeleton = () => (
    <div className="bg-white p-8 rounded-2xl shadow-sm animate-pulse">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6 mt-2" />
        <hr className="my-6 border-slate-200" />
        <Skeleton className="h-7 w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <Skeleton className="h-5 w-1/4 mb-2"/>
                <Skeleton className="h-4 w-full mb-1"/>
                <Skeleton className="h-4 w-full mb-1"/>
                <Skeleton className="h-6 w-3/4 mt-1"/>
            </div>
             <div>
                <Skeleton className="h-5 w-1/4 mb-2"/>
                <Skeleton className="h-4 w-full mb-1"/>
                <Skeleton className="h-4 w-full mb-1"/>
            </div>
        </div>
         <Skeleton className="h-7 w-1/2 mt-8 mb-4" />
         <Skeleton className="h-12 w-full" />
    </div>
);

const PatientProgressPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState('');
    const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndGenerateSummary = async () => {
            if (!user?.patientId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const notes = await soapNoteService.getNotesByPatientId(user.patientId);
                
                if (notes.length < 2) {
                    setSummary("## Olá!\n\nVocê precisa de pelo menos uma avaliação inicial e uma sessão de acompanhamento para ver seu progresso. Continue com seu tratamento e em breve seus resultados aparecerão aqui!");
                    setIsLoading(false);
                    return;
                }

                const initialNote = notes[notes.length - 1];
                const latestNote = notes[0];

                const data: PatientProgressData = {
                    nome_paciente: user.name.split(' ')[0],
                    dor_inicial: initialNote.painScale?.toString() || 'N/A',
                    dor_atual: latestNote.painScale?.toString() || 'N/A',
                    limitacao_inicial: initialNote.subjective,
                    status_atual: latestNote.assessment,
                    conquista_recente: latestNote.subjective,
                    nome_fisio: latestNote.therapist,
                };

                const generatedSummary = await generatePatientProgressSummary(data);
                setSummary(generatedSummary);

            } catch (error) {
                console.error(error);
                showToast("Não foi possível gerar seu resumo de progresso.", 'error');
                setSummary("Ocorreu um erro ao buscar seus dados. Por favor, tente novamente mais tarde.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndGenerateSummary();
    }, [user, showToast]);
    
    const handleFeedbackClick = (feedback: string) => {
        setSelectedFeedback(feedback);
        showToast('Obrigado pelo seu feedback!', 'success');
    }

    return (
        <>
            <PageHeader
                title="Meu Progresso"
                subtitle="Veja sua jornada de recuperação de forma clara e motivadora."
            />
            
            {isLoading ? <LoadingSkeleton /> : (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
                    {summary ? <MarkdownRenderer content={summary} className="text-md" /> : (
                        <div className="text-center py-12">
                             <TrendingUp className="w-16 h-16 mx-auto text-slate-300" />
                             <h3 className="mt-4 text-lg font-semibold text-slate-700">Acompanhamento Indisponível</h3>
                             <p className="mt-1 text-slate-500">Não foi possível carregar seu resumo de progresso.</p>
                        </div>
                    )}

                    <hr className="my-8 border-slate-200" />
                    
                    <div className="text-center">
                        <h4 className="text-lg font-semibold text-slate-800">Como você se sente sobre sua evolução?</h4>
                        <div className="mt-4 flex justify-center items-center space-x-2 md:space-x-4">
                             <button onClick={() => handleFeedbackClick('😞')} className={`p-3 md:p-4 rounded-full transition-transform transform hover:scale-110 ${selectedFeedback === '😞' ? 'bg-red-200 ring-2 ring-red-400' : 'bg-slate-100 hover:bg-slate-200'}`}><Frown className="w-8 h-8 md:w-10 md:h-10 text-red-500" /></button>
                             <button onClick={() => handleFeedbackClick('😐')} className={`p-3 md:p-4 rounded-full transition-transform transform hover:scale-110 ${selectedFeedback === '😐' ? 'bg-amber-200 ring-2 ring-amber-400' : 'bg-slate-100 hover:bg-slate-200'}`}><Meh className="w-8 h-8 md:w-10 md:h-10 text-amber-500" /></button>
                             <button onClick={() => handleFeedbackClick('😊')} className={`p-3 md:p-4 rounded-full transition-transform transform hover:scale-110 ${selectedFeedback === '😊' ? 'bg-sky-200 ring-2 ring-sky-400' : 'bg-slate-100 hover:bg-slate-200'}`}><Smile className="w-8 h-8 md:w-10 md:h-10 text-sky-500" /></button>
                             <button onClick={() => handleFeedbackClick('😄')} className={`p-3 md:p-4 rounded-full transition-transform transform hover:scale-110 ${selectedFeedback === '😄' ? 'bg-green-200 ring-2 ring-green-400' : 'bg-slate-100 hover:bg-slate-200'}`}><Laugh className="w-8 h-8 md:w-10 md:h-10 text-green-500" /></button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PatientProgressPage;