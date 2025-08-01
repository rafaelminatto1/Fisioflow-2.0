// pages/patient-portal/MyAppointmentsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/PageHeader';
import { Appointment, Therapist } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import * as appointmentService from '../../services/appointmentService';
import * as therapistService from '../../services/therapistService';
import { useToast } from '../../contexts/ToastContext';
import Skeleton from '../../components/ui/Skeleton';
import { Calendar } from 'lucide-react';
import AppointmentCard from '../../components/patient-portal/AppointmentCard';

const MyAppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.patientId) return;
            setIsLoading(true);
            try {
                const [appData, therData] = await Promise.all([
                    appointmentService.getAppointmentsByPatientId(user.patientId),
                    therapistService.getTherapists()
                ]);
                setAppointments(appData);
                setTherapists(therData);
            } catch {
                showToast("Erro ao carregar seus agendamentos.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user, showToast]);

    const { upcoming, past } = useMemo(() => {
        const now = new Date();
        const upcoming = appointments
            .filter(a => a.startTime >= now)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        const past = appointments
            .filter(a => a.startTime < now)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        return { upcoming, past };
    }, [appointments]);

    const renderList = (apps: Appointment[]) => (
        <div className="space-y-4">
            {apps.map(app => (
                <AppointmentCard 
                    key={app.id} 
                    appointment={app} 
                    therapistName={therapists.find(t => t.id === app.therapistId)?.name || 'N/A'} 
                />
            ))}
        </div>
    );

    return (
        <>
            <PageHeader
                title="Meus Agendamentos"
                subtitle="Acompanhe suas próximas consultas e seu histórico de atendimentos."
            />
            {isLoading ? (
                <Skeleton className="h-96 w-full rounded-2xl" />
            ) : appointments.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl shadow-sm">
                    <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">Nenhum agendamento encontrado</h3>
                    <p className="text-slate-500 mt-1">Você ainda não possui consultas agendadas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Próximas Consultas</h2>
                        {upcoming.length > 0 ? renderList(upcoming) : <p className="text-slate-500">Nenhuma consulta futura.</p>}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Histórico de Consultas</h2>
                        {past.length > 0 ? renderList(past) : <p className="text-slate-500">Nenhum histórico ainda.</p>}
                    </div>
                </div>
            )}
        </>
    );
};

export default MyAppointmentsPage;
