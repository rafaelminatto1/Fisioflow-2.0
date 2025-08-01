
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import * as treatmentService from '../../services/treatmentService';
import { TreatmentPlan } from '../../types';
import { Target } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';

const GoalTracker: React.FC = () => {
    const { user } = useAuth();
    const [plan, setPlan] = useState<TreatmentPlan | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            if (user?.patientId) {
                setIsLoading(true);
                const fetchedPlan = await treatmentService.getPlanByPatientId(user.patientId);
                setPlan(fetchedPlan);
                setIsLoading(false);
            }
        };
        fetchPlan();
    }, [user]);

    if (isLoading) {
        return (
             <div className="bg-white p-6 rounded-2xl shadow-sm">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                 <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-teal-500" />
                    Objetivos do Tratamento
                </h3>
                <p className="text-slate-500">Nenhum plano de tratamento ativo encontrado.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
             <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-teal-500" />
                Objetivos do Tratamento
            </h3>
            <p className="text-slate-600">{plan.treatmentGoals}</p>
        </div>
    );
};


const PatientDashboardPage: React.FC = () => {
    const { user } = useAuth();

    return (
         <>
            <PageHeader
                title={`Bem-vindo(a), ${user?.name.split(' ')[0]}!`}
                subtitle="Acompanhe seu progresso e mantenha-se em dia com seu tratamento."
            />
            <div className="space-y-6">
                <GoalTracker />
                 <div className="bg-white p-6 rounded-2xl shadow-sm">
                     <h3 className="text-lg font-semibold text-slate-800 mb-4">Próximos Passos</h3>
                     <p className="text-slate-600">Explore o seu Diário de Dor para registrar como você está se sentindo. Em breve, você poderá ver seus exercícios e próximas consultas aqui.</p>
                 </div>
            </div>
        </>
    );
};

export default PatientDashboardPage;