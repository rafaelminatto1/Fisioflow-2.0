// pages/FinancialDashboardPage.tsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useFinancialData, { TimePeriod } from '../hooks/useFinancialData';
import MetricCard from '../components/MetricCard';
import PageLoader from '../components/ui/PageLoader';
import { PlusCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const FinancialDashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('this_month');
  const { data, isLoading } = useFinancialData(period);

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  if (isLoading || !data) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel Financeiro"
        subtitle="Visão geral da saúde financeira da sua clínica."
      >
         <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <select value={period} onChange={(e) => setPeriod(e.target.value as TimePeriod)} className="rounded-lg border-slate-300 bg-white shadow-sm focus:ring-teal-500 focus:border-teal-500">
            <option value="this_month">Este Mês</option>
            <option value="last_3_months">Últimos 3 Meses</option>
            <option value="this_year">Este Ano</option>
          </select>
          <button className="hidden sm:flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm">
            <PlusCircle size={20} className="mr-2"/> Receita
          </button>
          <button className="hidden sm:flex items-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm">
            <PlusCircle size={20} className="mr-2"/> Despesa
          </button>
        </div>
      </PageHeader>
      
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        <MetricCard title="Faturamento Bruto" value={formatCurrency(data.kpis.grossRevenue)} />
        <MetricCard title="Despesas (Est.)" value={formatCurrency(data.kpis.totalExpenses)} />
        <MetricCard title="Lucro Líquido (Est.)" value={formatCurrency(data.kpis.netProfit)} />
        <MetricCard title="Pacientes Ativos" value={data.kpis.activePatients.toString()} />
        <MetricCard title="Ticket Médio" value={formatCurrency(data.kpis.averageTicket)} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Fluxo de Caixa</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(value: number) => `R$${value/1000}k`}/>
              <Tooltip formatter={(value: number) => formatCurrency(value)}/>
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita"/>
              <Line type="monotone" dataKey="despesa" stroke="#f43f5e" strokeWidth={2} name="Despesa (Est.)"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Origem das Receitas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.revenueBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} label>
                {data.revenueBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)}/>
               <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Accounts */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">Contas a Pagar e Receber (Mês Atual)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-red-600 mb-2">Contas a Pagar (Exemplo)</h3>
            <ul className="space-y-2">
              {data.accounts.payable.map(item => (
                  <li key={item.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md text-sm">
                      <div>
                          <p className="font-medium text-slate-800">{item.description}</p>
                          <p className="text-xs text-slate-500">Vence em: {item.dueDate}</p>
                      </div>
                      <p className="font-semibold text-red-500">- {formatCurrency(item.amount)}</p>
                  </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-green-600 mb-2">Contas a Receber</h3>
              <ul className="space-y-2">
                  {data.accounts.receivable.length > 0 ? data.accounts.receivable.map(item => (
                      <li key={item.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md text-sm">
                          <div>
                              <p className="font-medium text-slate-800">{item.description}</p>
                              <p className="text-xs text-slate-500">Paciente: {item.patientName}</p>
                          </div>
                          <p className="font-semibold text-green-500">+ {formatCurrency(item.amount)}</p>
                      </li>
                  )) : <p className="text-sm text-slate-500 p-2">Nenhuma conta a receber.</p>}
              </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FinancialDashboardPage;
