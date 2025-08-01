// hooks/useFinancialData.ts
import { useState, useEffect } from 'react';
import { Appointment, Patient, AppointmentStatus, AppointmentType } from '../types';
import { mockAppointments, mockPatients } from '../data/mockData';

export type TimePeriod = 'this_month' | 'last_3_months' | 'this_year';

interface AccountItem {
    id: string;
    description: string;
    amount: number;
    dueDate?: string;
    patientName?: string;
}

export interface FinancialData {
  kpis: {
    grossRevenue: number;
    totalExpenses: number;
    netProfit: number;
    activePatients: number;
    averageTicket: number;
  };
  cashFlowData: { date: string; receita: number; despesa: number }[];
  revenueBreakdown: { name: string; value: number }[];
  accounts: {
      payable: AccountItem[];
      receivable: AccountItem[];
  }
}

// Mocking an API call
const getFinancials = async (period: TimePeriod): Promise<Appointment[]> => {
    await new Promise(res => setTimeout(res, 500));
    
    const now = new Date();
    let startDate: Date;

    if (period === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'last_3_months') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else { // this_year
        startDate = new Date(now.getFullYear(), 0, 1);
    }
    
    return mockAppointments.filter(app => new Date(app.startTime) >= startDate);
};

const useFinancialData = (period: TimePeriod) => {
  const [data, setData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const rawAppointments = await getFinancials(period);
        const completedAppointments = rawAppointments.filter(a => a.status === AppointmentStatus.Completed);

        // Process KPIs
        const grossRevenue = completedAppointments.reduce((sum, t) => sum + t.value, 0);
        const totalExpenses = grossRevenue * 0.45; // Mock expenses
        const netProfit = grossRevenue - totalExpenses;
        const activePatients = mockPatients.filter(p => p.status === 'Active').length;
        const averageTicket = completedAppointments.length > 0 ? grossRevenue / completedAppointments.length : 0;

        // Process Cash Flow Data
        const cashFlowMap = new Map<string, { receita: number; despesa: number }>();
        const allAppointmentsInPeriod = rawAppointments.filter(a => a.status !== AppointmentStatus.Canceled);

        completedAppointments.forEach(app => {
            const dateKey = new Date(app.startTime).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
            const entry = cashFlowMap.get(dateKey) || { receita: 0, despesa: 0 };
            entry.receita += app.value;
            cashFlowMap.set(dateKey, entry);
        });

        allAppointmentsInPeriod.forEach(app => {
            const dateKey = new Date(app.startTime).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
            const entry = cashFlowMap.get(dateKey) || { receita: 0, despesa: 0 };
            entry.despesa += app.value * 0.45; // Mock expense per appointment
            cashFlowMap.set(dateKey, entry);
        });
        
        const cashFlowData = Array.from(cashFlowMap.entries()).map(([date, values]) => ({ date, ...values })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Process Revenue Breakdown
        const breakdownMap = new Map<string, number>();
        completedAppointments.forEach(app => {
            const current = breakdownMap.get(app.type) || 0;
            breakdownMap.set(app.type, current + app.value);
        });
        const revenueBreakdown = Array.from(breakdownMap.entries()).map(([name, value]) => ({ name, value }));

        // Process Accounts
        const receivable: AccountItem[] = mockAppointments
            .filter(a => a.paymentStatus === 'pending' && new Date(a.startTime) < new Date())
            .map(a => ({
                id: a.id,
                description: a.type,
                amount: a.value,
                patientName: a.patientName
            }));

        const payable: AccountItem[] = [
            { id: 'pay1', description: 'Aluguel', amount: 2500, dueDate: '30/07/2024'},
            { id: 'pay2', description: 'Energia Elétrica', amount: 350.75, dueDate: '25/07/2024'},
        ];

        setData({
          kpis: { grossRevenue, totalExpenses, netProfit, activePatients, averageTicket },
          cashFlowData,
          revenueBreakdown,
          accounts: { payable, receivable }
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return { data, isLoading, error };
};

export default useFinancialData;
