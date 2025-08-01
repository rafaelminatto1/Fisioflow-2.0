
// components/dashboard/KPICards.tsx
import React, { useMemo } from 'react';
import { DollarSign, Users, BarChart3, Star } from 'lucide-react';
import { Appointment, Patient, AppointmentStatus } from '../../types';
import StatCard from './StatCard';

interface KPICardsProps {
    appointments: Appointment[];
    patients: Patient[];
}

const KPICards: React.FC<KPICardsProps> = ({ appointments, patients }) => {
    const stats = useMemo(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const monthlyRevenue = appointments
            .filter(a => a.startTime >= startOfMonth && a.status === 'Realizado')
            .reduce((sum, a) => sum + a.value, 0);

        const activePatients = patients.filter(p => p.status === 'Active').length;

        // Simplified occupancy rate calculation
        const completedThisMonth = appointments.filter(a => a.startTime >= startOfMonth && a.status === 'Realizado').length;
        const totalSlots = 8 * 22 * 3; // 8 hours/day * 22 workdays * 3 therapists
        const occupancyRate = totalSlots > 0 ? Math.round((completedThisMonth / totalSlots) * 100) : 0;

        return {
            monthlyRevenue: `R$${(monthlyRevenue / 1000).toFixed(1)}k`,
            activePatients: activePatients.toString(),
            occupancyRate: `${occupancyRate}%`,
            satisfaction: '9.2/10' // Mocked NPS/Satisfaction
        };
    }, [appointments, patients]);

    const kpiData = [
        { title: 'Faturamento do Mês', value: stats.monthlyRevenue, icon: <DollarSign /> },
        { title: 'Pacientes Ativos', value: stats.activePatients, icon: <Users /> },
        { title: 'Taxa de Ocupação', value: stats.occupancyRate, icon: <BarChart3 /> },
        { title: 'Satisfação (NPS)', value: stats.satisfaction, icon: <Star /> },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map(kpi => (
                <StatCard key={kpi.title} {...kpi} />
            ))}
        </div>
    );
};

export default KPICards;