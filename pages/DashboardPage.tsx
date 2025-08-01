
import React, { useState } from 'react';
import { usePageData } from '../hooks/usePageData';
import { Appointment, Patient, Therapist } from '../types';
import * as appointmentService from '../services/appointmentService';
import * as patientService from '../services/patientService';
import * as therapistService from '../services/therapistService';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/ui/PageLoader';
import KPICards from '../components/dashboard/KPICards';
import RevenueChart from '../components/dashboard/RevenueChart';
import PatientFlowChart from '../components/dashboard/PatientFlowChart';
import TeamProductivityChart from '../components/dashboard/TeamProductivityChart';
import AppointmentHeatmap from '../components/dashboard/AppointmentHeatmap';
import { Activity, Users } from 'lucide-react';

const DashboardPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [therapists, setTherapists] = useState<Therapist[]>([]);

    const { isLoading, error } = usePageData([
        async () => setAppointments(await appointmentService.getAppointments()),
        async () => setPatients(await patientService.getPatients()),
        async () => setTherapists(await therapistService.getTherapists()),
    ], []);

    if (isLoading) return <PageLoader />;
    if (error) return <div className="text-center p-10 text-red-500">Falha ao carregar dados do dashboard.</div>;

    return (
        <>
            <PageHeader
                title="Dashboard Administrativo"
                subtitle="Visão 360° do negócio com métricas financeiras, operacionais e clínicas."
            />

            <KPICards appointments={appointments} patients={patients} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <RevenueChart appointments={appointments} />
                <PatientFlowChart patients={patients} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-teal-500" /> Mapa de Calor de Agendamentos
                    </h3>
                    <AppointmentHeatmap appointments={appointments} />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-teal-500" /> Produtividade da Equipe
                    </h3>
                    <TeamProductivityChart appointments={appointments} therapists={therapists} />
                </div>
            </div>
        </>
    );
};

export default DashboardPage;
