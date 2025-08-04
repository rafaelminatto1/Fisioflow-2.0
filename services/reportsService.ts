import { Patient, Appointment, SoapNote } from '../types';

export interface AnalyticsMetrics {
  // Patient metrics
  totalPatients: number;
  newPatientsThisMonth: number;
  activePatients: number;
  patientsByAge: { ageGroup: string; count: number }[];
  patientsByCondition: { condition: string; count: number }[];
  patientRetentionRate: number;
  averageTreatmentDuration: number;
  
  // Appointment metrics
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  showRate: number;
  averageAppointmentDuration: number;
  appointmentsByType: { type: string; count: number }[];
  appointmentsByTherapist: { therapist: string; count: number }[];
  
  // Revenue metrics
  totalRevenue: number;
  monthlyRevenue: number;
  revenuePerPatient: number;
  revenueByService: { service: string; revenue: number }[];
  revenueByTherapist: { therapist: string; revenue: number }[];
  
  // Quality metrics
  averageSatisfactionScore: number;
  npsScore: number;
  treatmentSuccessRate: number;
  
  // Operational metrics
  roomUtilization: { room: string; utilization: number }[];
  therapistProductivity: { therapist: string; patientsPerDay: number }[];
  peakHours: { hour: number; appointmentCount: number }[];
}

export interface TrendData {
  period: string;
  value: number;
  change?: number;
  changePercent?: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }>;
}

export interface ReportFilter {
  startDate: Date;
  endDate: Date;
  therapistIds?: string[];
  patientIds?: string[];
  appointmentTypes?: string[];
  conditions?: string[];
}

export interface PerformanceKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  description: string;
  category: 'clinical' | 'financial' | 'operational' | 'satisfaction';
}

class AnalyticsService {
  // Mock data - in real app would come from database
  private patients: Patient[] = [];
  private appointments: Appointment[] = [];
  private soapNotes: SoapNote[] = [];

  // Core analytics calculation methods
  async calculateMetrics(filters: ReportFilter): Promise<AnalyticsMetrics> {
    const filteredAppointments = this.filterAppointments(filters);
    const filteredPatients = this.filterPatients(filters);

    return {
      // Patient metrics
      totalPatients: filteredPatients.length,
      newPatientsThisMonth: this.getNewPatientsCount(filters),
      activePatients: this.getActivePatients(filteredPatients).length,
      patientsByAge: this.getPatientsByAge(filteredPatients),
      patientsByCondition: this.getPatientsByCondition(filteredPatients),
      patientRetentionRate: this.calculateRetentionRate(filteredPatients),
      averageTreatmentDuration: this.calculateAverageTreatmentDuration(filteredPatients),
      
      // Appointment metrics
      totalAppointments: filteredAppointments.length,
      completedAppointments: filteredAppointments.filter(a => a.status === 'completed').length,
      cancelledAppointments: filteredAppointments.filter(a => a.status === 'cancelled').length,
      noShowAppointments: filteredAppointments.filter(a => a.status === 'no_show').length,
      showRate: this.calculateShowRate(filteredAppointments),
      averageAppointmentDuration: this.calculateAverageAppointmentDuration(filteredAppointments),
      appointmentsByType: this.getAppointmentsByType(filteredAppointments),
      appointmentsByTherapist: this.getAppointmentsByTherapist(filteredAppointments),
      
      // Revenue metrics
      totalRevenue: this.calculateTotalRevenue(filteredAppointments),
      monthlyRevenue: this.calculateMonthlyRevenue(filteredAppointments),
      revenuePerPatient: this.calculateRevenuePerPatient(filteredAppointments, filteredPatients),
      revenueByService: this.getRevenueByService(filteredAppointments),
      revenueByTherapist: this.getRevenueByTherapist(filteredAppointments),
      
      // Quality metrics
      averageSatisfactionScore: this.calculateAverageSatisfaction(),
      npsScore: this.calculateNPS(),
      treatmentSuccessRate: this.calculateTreatmentSuccessRate(),
      
      // Operational metrics
      roomUtilization: this.calculateRoomUtilization(filteredAppointments),
      therapistProductivity: this.calculateTherapistProductivity(filteredAppointments),
      peakHours: this.calculatePeakHours(filteredAppointments)
    };
  }

  // Trend analysis
  async getTrendData(metric: string, period: 'daily' | 'weekly' | 'monthly', filters: ReportFilter): Promise<TrendData[]> {
    // Mock implementation - would calculate actual trends from data
    const mockTrends: TrendData[] = [];
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    
    let currentDate = new Date(startDate);
    let previousValue = Math.floor(Math.random() * 100) + 50;
    
    while (currentDate <= endDate) {
      const value = previousValue + (Math.random() - 0.5) * 20;
      const change = value - previousValue;
      const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
      
      mockTrends.push({
        period: this.formatPeriod(currentDate, period),
        value: Math.round(value),
        change: Math.round(change * 10) / 10,
        changePercent: Math.round(changePercent * 10) / 10
      });
      
      previousValue = value;
      
      // Increment date based on period
      switch (period) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }
    
    return mockTrends;
  }

  // Chart data generation
  async getChartData(chartType: string, filters: ReportFilter): Promise<ChartData> {
    switch (chartType) {
      case 'patients_by_age':
        return this.getPatientsAgeChart(filters);
      case 'appointments_by_status':
        return this.getAppointmentsStatusChart(filters);
      case 'revenue_trend':
        return this.getRevenueTrendChart(filters);
      case 'therapist_performance':
        return this.getTherapistPerformanceChart(filters);
      default:
        throw new Error(`Chart type ${chartType} not supported`);
    }
  }

  // KPI calculations
  async getKPIs(filters: ReportFilter): Promise<PerformanceKPI[]> {
    const metrics = await this.calculateMetrics(filters);
    
    return [
      {
        id: 'patient_retention',
        name: 'Taxa de Retenção',
        value: metrics.patientRetentionRate,
        target: 85,
        unit: '%',
        trend: metrics.patientRetentionRate >= 85 ? 'up' : 'down',
        trendValue: 2.3,
        description: 'Porcentagem de pacientes que continuam o tratamento',
        category: 'clinical'
      },
      {
        id: 'show_rate',
        name: 'Taxa de Comparecimento',
        value: metrics.showRate,
        target: 90,
        unit: '%',
        trend: 'stable',
        trendValue: 0.8,
        description: 'Porcentagem de consultas com comparecimento',
        category: 'operational'
      },
      {
        id: 'revenue_per_patient',
        name: 'Receita por Paciente',
        value: metrics.revenuePerPatient,
        target: 800,
        unit: 'R$',
        trend: 'up',
        trendValue: 5.2,
        description: 'Receita média gerada por paciente',
        category: 'financial'
      },
      {
        id: 'satisfaction_score',
        name: 'Satisfação Média',
        value: metrics.averageSatisfactionScore,
        target: 4.5,
        unit: '/5',
        trend: 'up',
        trendValue: 0.3,
        description: 'Score médio de satisfação dos pacientes',
        category: 'satisfaction'
      }
    ];
  }

  // Export methods
  async exportToCSV(data: any[], filename: string): Promise<Blob> {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  async exportToExcel(data: any[], filename: string): Promise<Blob> {
    // Mock Excel export - in real app would use library like xlsx
    const csvBlob = await this.exportToCSV(data, filename);
    return new Blob([csvBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Predictive analytics (mock implementation)
  async getPredictiveInsights(filters: ReportFilter): Promise<{
    churnRisk: Array<{ patientId: string; patientName: string; riskScore: number; factors: string[] }>;
    demandForecast: Array<{ period: string; predictedAppointments: number; confidence: number }>;
    revenueProjection: Array<{ month: string; projectedRevenue: number; confidence: number }>;
  }> {
    // Mock predictive data
    return {
      churnRisk: [
        {
          patientId: '1',
          patientName: 'João Silva',
          riskScore: 0.85,
          factors: ['Faltas frequentes', 'Baixa satisfação', 'Atraso nos pagamentos']
        },
        {
          patientId: '2',
          patientName: 'Maria Santos',
          riskScore: 0.72,
          factors: ['Não comparecimento nas últimas 2 consultas', 'Reclamações']
        }
      ],
      demandForecast: [
        { period: '2024-02', predictedAppointments: 1280, confidence: 0.87 },
        { period: '2024-03', predictedAppointments: 1350, confidence: 0.82 },
        { period: '2024-04', predictedAppointments: 1420, confidence: 0.78 }
      ],
      revenueProjection: [
        { month: '2024-02', projectedRevenue: 58500, confidence: 0.89 },
        { month: '2024-03', projectedRevenue: 62000, confidence: 0.85 },
        { month: '2024-04', projectedRevenue: 65500, confidence: 0.80 }
      ]
    };
  }

  // Real-time analytics
  async getRealTimeMetrics(): Promise<{
    todayAppointments: number;
    currentWaitingRoom: number;
    runningLate: number;
    availableSlots: number;
    roomOccupancy: Array<{ room: string; occupied: boolean; nextAvailable: string }>;
  }> {
    return {
      todayAppointments: 24,
      currentWaitingRoom: 3,
      runningLate: 1,
      availableSlots: 8,
      roomOccupancy: [
        { room: 'Sala 1', occupied: true, nextAvailable: '14:30' },
        { room: 'Sala 2', occupied: false, nextAvailable: '13:00' },
        { room: 'Sala 3', occupied: true, nextAvailable: '15:00' },
        { room: 'Ginásio', occupied: false, nextAvailable: '13:30' }
      ]
    };
  }

  // Private helper methods
  private filterAppointments(filters: ReportFilter): Appointment[] {
    return this.appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate >= filters.startDate && 
             appointmentDate <= filters.endDate &&
             (!filters.therapistIds || filters.therapistIds.includes(appointment.therapistId)) &&
             (!filters.appointmentTypes || filters.appointmentTypes.includes(appointment.type));
    });
  }

  private filterPatients(filters: ReportFilter): Patient[] {
    return this.patients.filter(patient => {
      // Add patient filtering logic based on registration date, conditions, etc.
      return true; // Simplified for mock
    });
  }

  private getNewPatientsCount(filters: ReportFilter): number {
    const currentMonth = new Date().getMonth();
    return this.patients.filter(patient => {
      // Mock implementation - would check registration date
      return Math.random() > 0.8; // ~20% are "new"
    }).length;
  }

  private getActivePatients(patients: Patient[]): Patient[] {
    return patients.filter(patient => patient.status === 'active');
  }

  private getPatientsByAge(patients: Patient[]): Array<{ ageGroup: string; count: number }> {
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    };

    patients.forEach(patient => {
      const age = this.calculateAge(patient.birthDate);
      if (age <= 25) ageGroups['18-25']++;
      else if (age <= 35) ageGroups['26-35']++;
      else if (age <= 45) ageGroups['36-45']++;
      else if (age <= 55) ageGroups['46-55']++;
      else if (age <= 65) ageGroups['56-65']++;
      else ageGroups['65+']++;
    });

    return Object.entries(ageGroups).map(([ageGroup, count]) => ({ ageGroup, count }));
  }

  private getPatientsByCondition(patients: Patient[]): Array<{ condition: string; count: number }> {
    const conditionCounts: Record<string, number> = {};
    
    patients.forEach(patient => {
      patient.conditions?.forEach(condition => {
        conditionCounts[condition.name] = (conditionCounts[condition.name] || 0) + 1;
      });
    });

    return Object.entries(conditionCounts)
      .map(([condition, count]) => ({ condition, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 conditions
  }

  private calculateRetentionRate(patients: Patient[]): number {
    // Mock calculation - would check actual retention logic
    return 82.5;
  }

  private calculateAverageTreatmentDuration(patients: Patient[]): number {
    // Mock calculation - would calculate from appointment data
    return 45; // days
  }

  private calculateShowRate(appointments: Appointment[]): number {
    const total = appointments.length;
    const showed = appointments.filter(a => a.status === 'completed' || a.status === 'confirmed').length;
    return total > 0 ? (showed / total) * 100 : 0;
  }

  private calculateAverageAppointmentDuration(appointments: Appointment[]): number {
    if (appointments.length === 0) return 0;
    
    const totalMinutes = appointments.reduce((sum, appointment) => {
      const duration = new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime();
      return sum + (duration / (1000 * 60)); // Convert to minutes
    }, 0);
    
    return totalMinutes / appointments.length;
  }

  private getAppointmentsByType(appointments: Appointment[]): Array<{ type: string; count: number }> {
    const typeCounts: Record<string, number> = {};
    
    appointments.forEach(appointment => {
      typeCounts[appointment.type] = (typeCounts[appointment.type] || 0) + 1;
    });

    return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
  }

  private getAppointmentsByTherapist(appointments: Appointment[]): Array<{ therapist: string; count: number }> {
    const therapistCounts: Record<string, number> = {};
    
    appointments.forEach(appointment => {
      // Would map therapistId to therapist name in real implementation
      const therapistName = `Terapeuta ${appointment.therapistId}`;
      therapistCounts[therapistName] = (therapistCounts[therapistName] || 0) + 1;
    });

    return Object.entries(therapistCounts).map(([therapist, count]) => ({ therapist, count }));
  }

  private calculateTotalRevenue(appointments: Appointment[]): number {
    // Mock revenue calculation - would use actual pricing data
    return appointments.filter(a => a.status === 'completed').length * 120; // R$ 120 per appointment
  }

  private calculateMonthlyRevenue(appointments: Appointment[]): number {
    const currentMonth = new Date().getMonth();
    const monthlyAppointments = appointments.filter(appointment => {
      return new Date(appointment.startTime).getMonth() === currentMonth && 
             appointment.status === 'completed';
    });
    return monthlyAppointments.length * 120;
  }

  private calculateRevenuePerPatient(appointments: Appointment[], patients: Patient[]): number {
    const totalRevenue = this.calculateTotalRevenue(appointments);
    return patients.length > 0 ? totalRevenue / patients.length : 0;
  }

  private getRevenueByService(appointments: Appointment[]): Array<{ service: string; revenue: number }> {
    const serviceRevenue: Record<string, number> = {};
    
    appointments.filter(a => a.status === 'completed').forEach(appointment => {
      const revenue = this.getServicePrice(appointment.type);
      serviceRevenue[appointment.type] = (serviceRevenue[appointment.type] || 0) + revenue;
    });

    return Object.entries(serviceRevenue).map(([service, revenue]) => ({ service, revenue }));
  }

  private getRevenueByTherapist(appointments: Appointment[]): Array<{ therapist: string; revenue: number }> {
    const therapistRevenue: Record<string, number> = {};
    
    appointments.filter(a => a.status === 'completed').forEach(appointment => {
      const therapistName = `Terapeuta ${appointment.therapistId}`;
      const revenue = this.getServicePrice(appointment.type);
      therapistRevenue[therapistName] = (therapistRevenue[therapistName] || 0) + revenue;
    });

    return Object.entries(therapistRevenue).map(([therapist, revenue]) => ({ therapist, revenue }));
  }

  private calculateAverageSatisfaction(): number {
    // Mock satisfaction score
    return 4.7;
  }

  private calculateNPS(): number {
    // Mock NPS score
    return 72;
  }

  private calculateTreatmentSuccessRate(): number {
    // Mock success rate
    return 89.3;
  }

  private calculateRoomUtilization(appointments: Appointment[]): Array<{ room: string; utilization: number }> {
    // Mock room utilization
    return [
      { room: 'Sala 1', utilization: 85 },
      { room: 'Sala 2', utilization: 78 },
      { room: 'Sala 3', utilization: 92 },
      { room: 'Ginásio', utilization: 65 }
    ];
  }

  private calculateTherapistProductivity(appointments: Appointment[]): Array<{ therapist: string; patientsPerDay: number }> {
    // Mock productivity data
    return [
      { therapist: 'Dr. João Silva', patientsPerDay: 8.5 },
      { therapist: 'Dra. Maria Santos', patientsPerDay: 7.2 },
      { therapist: 'Dr. Pedro Oliveira', patientsPerDay: 9.1 }
    ];
  }

  private calculatePeakHours(appointments: Appointment[]): Array<{ hour: number; appointmentCount: number }> {
    const hourCounts: Record<number, number> = {};
    
    appointments.forEach(appointment => {
      const hour = new Date(appointment.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), appointmentCount: count }))
      .sort((a, b) => a.hour - b.hour);
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  private getServicePrice(serviceType: string): number {
    // Mock pricing
    const prices: Record<string, number> = {
      'Avaliação': 150,
      'Sessão': 120,
      'Retorno': 100,
      'Grupo': 80
    };
    return prices[serviceType] || 120;
  }

  private formatPeriod(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
    switch (period) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `Semana ${weekStart.toISOString().split('T')[0]}`;
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  // Chart data generation methods
  private async getPatientsAgeChart(filters: ReportFilter): Promise<ChartData> {
    const patients = this.filterPatients(filters);
    const ageData = this.getPatientsByAge(patients);
    
    return {
      labels: ageData.map(d => d.ageGroup),
      datasets: [{
        label: 'Pacientes por Faixa Etária',
        data: ageData.map(d => d.count),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
        ]
      }]
    };
  }

  private async getAppointmentsStatusChart(filters: ReportFilter): Promise<ChartData> {
    const appointments = this.filterAppointments(filters);
    const statusCounts = {
      'Realizadas': appointments.filter(a => a.status === 'completed').length,
      'Canceladas': appointments.filter(a => a.status === 'cancelled').length,
      'Faltas': appointments.filter(a => a.status === 'no_show').length,
      'Agendadas': appointments.filter(a => a.status === 'scheduled').length
    };

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: 'Status das Consultas',
        data: Object.values(statusCounts),
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#3B82F6']
      }]
    };
  }

  private async getRevenueTrendChart(filters: ReportFilter): Promise<ChartData> {
    const trendData = await this.getTrendData('revenue', 'monthly', filters);
    
    return {
      labels: trendData.map(d => d.period),
      datasets: [{
        label: 'Receita Mensal',
        data: trendData.map(d => d.value),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true
      }]
    };
  }

  private async getTherapistPerformanceChart(filters: ReportFilter): Promise<ChartData> {
    const appointments = this.filterAppointments(filters);
    const therapistData = this.getAppointmentsByTherapist(appointments);
    
    return {
      labels: therapistData.map(d => d.therapist),
      datasets: [{
        label: 'Consultas por Terapeuta',
        data: therapistData.map(d => d.count),
        backgroundColor: '#3B82F6'
      }]
    };
  }
}

export const reportsService = new AnalyticsService();
export default reportsService;