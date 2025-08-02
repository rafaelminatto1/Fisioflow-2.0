import { Patient } from '../types';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  trend: number;
  period: 'day' | 'week' | 'month' | 'year';
  calculatedAt: Date;
  filters?: Record<string, any>;
}

export interface PatientSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  patientCount: number;
  lastUpdated: Date;
}

export interface SegmentCriteria {
  ageRange?: [number, number];
  conditions?: string[];
  treatmentDuration?: [number, number];
  engagementLevel?: string[];
  customFilters?: Record<string, any>;
}

export interface DemographicData {
  ageDistribution: { range: string; count: number; percentage: number }[];
  genderDistribution: { gender: string; count: number; percentage: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  conditionDistribution: { condition: string; count: number; percentage: number }[];
}

export interface TrendData {
  period: string;
  newPatients: number;
  activePatients: number;
  dischargedPatients: number;
  totalAppointments: number;
}

export interface PredictiveMetrics {
  churnRisk: { patientId: string; score: number; factors: string[] }[];
  demandForecast: { period: string; predictedAppointments: number; confidence: number }[];
  lifetimeValuePrediction: { segment: string; averageLTV: number; confidence: number }[];
}

export interface PerformanceMetrics {
  patientRetentionRate: number;
  averageTreatmentDuration: number;
  appointmentShowRate: number;
  patientSatisfactionScore: number;
  revenuePerPatient: number;
}

class AnalyticsService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getBasicMetrics(): Promise<AnalyticsMetric[]> {
    const cacheKey = 'basic_metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { getPatients } = await import('./patientService');
    const patients = await getPatients();
    
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const metrics: AnalyticsMetric[] = [
      {
        id: 'total_patients',
        name: 'Total de Pacientes',
        value: patients.length,
        trend: this.calculateGrowthTrend(patients, 'registrationDate', lastMonth),
        period: 'month',
        calculatedAt: now
      },
      {
        id: 'active_patients',
        name: 'Pacientes Ativos',
        value: patients.filter(p => p.status === 'Ativo').length,
        trend: this.calculateStatusTrend(patients, 'Ativo', lastWeek),
        period: 'week',
        calculatedAt: now
      },
      {
        id: 'new_patients_month',
        name: 'Novos Pacientes (Mês)',
        value: patients.filter(p => 
          new Date(p.registrationDate || p.lastVisit) >= lastMonth
        ).length,
        trend: this.calculateNewPatientsTrend(patients, lastMonth),
        period: 'month',
        calculatedAt: now
      },
      {
        id: 'discharged_patients',
        name: 'Pacientes de Alta',
        value: patients.filter(p => p.status === 'Alta').length,
        trend: this.calculateStatusTrend(patients, 'Alta', lastMonth),
        period: 'month',
        calculatedAt: now
      },
      {
        id: 'avg_age',
        name: 'Idade Média',
        value: this.calculateAverageAge(patients),
        trend: 0, // Age doesn't have a meaningful trend
        period: 'month',
        calculatedAt: now
      }
    ];

    this.setCache(cacheKey, metrics);
    return metrics;
  }

  async getDemographicData(): Promise<DemographicData> {
    const cacheKey = 'demographic_data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { getPatients } = await import('./patientService');
    const patients = await getPatients();
    
    const demographics: DemographicData = {
      ageDistribution: this.calculateAgeDistribution(patients),
      genderDistribution: this.calculateGenderDistribution(patients),
      statusDistribution: this.calculateStatusDistribution(patients),
      conditionDistribution: this.calculateConditionDistribution(patients)
    };

    this.setCache(cacheKey, demographics);
    return demographics;
  }

  async getTrendData(period: 'week' | 'month' | 'quarter' | 'year'): Promise<TrendData[]> {
    const cacheKey = `trend_data_${period}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { getPatients } = await import('./patientService');
    const patients = await getPatients();
    
    const trends = this.calculateTrendData(patients, period);
    
    this.setCache(cacheKey, trends);
    return trends;
  }

  async getPatientSegments(): Promise<PatientSegment[]> {
    const cacheKey = 'patient_segments';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { getPatients } = await import('./patientService');
    const patients = await getPatients();
    
    const segments: PatientSegment[] = [
      {
        id: 'young_adults',
        name: 'Adultos Jovens',
        criteria: { ageRange: [18, 35] },
        patientCount: patients.filter(p => {
          const age = this.calculateAge(p.birthDate);
          return age >= 18 && age <= 35;
        }).length,
        lastUpdated: new Date()
      },
      {
        id: 'middle_aged',
        name: 'Meia Idade',
        criteria: { ageRange: [36, 60] },
        patientCount: patients.filter(p => {
          const age = this.calculateAge(p.birthDate);
          return age >= 36 && age <= 60;
        }).length,
        lastUpdated: new Date()
      },
      {
        id: 'seniors',
        name: 'Idosos',
        criteria: { ageRange: [61, 120] },
        patientCount: patients.filter(p => {
          const age = this.calculateAge(p.birthDate);
          return age >= 61;
        }).length,
        lastUpdated: new Date()
      },
      {
        id: 'chronic_conditions',
        name: 'Condições Crônicas',
        criteria: { 
          conditions: ['artrite', 'fibromialgia', 'artrose', 'diabetes'] 
        },
        patientCount: patients.filter(p => 
          p.conditions?.some(condition => 
            ['artrite', 'fibromialgia', 'artrose', 'diabetes'].some(chronic =>
              condition.toLowerCase().includes(chronic)
            )
          )
        ).length,
        lastUpdated: new Date()
      },
      {
        id: 'sports_injuries',
        name: 'Lesões Esportivas',
        criteria: { 
          conditions: ['lesão', 'entorse', 'distensão', 'ruptura'] 
        },
        patientCount: patients.filter(p => 
          p.conditions?.some(condition => 
            ['lesão', 'entorse', 'distensão', 'ruptura'].some(sports =>
              condition.toLowerCase().includes(sports)
            )
          )
        ).length,
        lastUpdated: new Date()
      }
    ];

    this.setCache(cacheKey, segments);
    return segments;
  }

  async getPredictiveMetrics(): Promise<PredictiveMetrics> {
    const cacheKey = 'predictive_metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { getPatients } = await import('./patientService');
    const patients = await getPatients();
    
    const predictive: PredictiveMetrics = {
      churnRisk: this.calculateChurnRisk(patients),
      demandForecast: this.calculateDemandForecast(patients),
      lifetimeValuePrediction: this.calculateLifetimeValuePrediction(patients)
    };

    this.setCache(cacheKey, predictive);
    return predictive;
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const cacheKey = 'performance_metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { getPatients } = await import('./patientService');
    const patients = await getPatients();
    
    const performance: PerformanceMetrics = {
      patientRetentionRate: this.calculateRetentionRate(patients),
      averageTreatmentDuration: this.calculateAverageTreatmentDuration(patients),
      appointmentShowRate: 0.85, // Would come from appointment service
      patientSatisfactionScore: 4.2, // Would come from feedback service
      revenuePerPatient: this.calculateRevenuePerPatient(patients)
    };

    this.setCache(cacheKey, performance);
    return performance;
  }

  async createCustomSegment(criteria: SegmentCriteria): Promise<PatientSegment> {
    const { getPatients } = await import('./patientService');
    const patients = await getPatients();
    
    let filteredPatients = patients;

    if (criteria.ageRange) {
      const [minAge, maxAge] = criteria.ageRange;
      filteredPatients = filteredPatients.filter(p => {
        const age = this.calculateAge(p.birthDate);
        return age >= minAge && age <= maxAge;
      });
    }

    if (criteria.conditions) {
      filteredPatients = filteredPatients.filter(p =>
        p.conditions?.some(condition =>
          criteria.conditions!.some(filterCondition =>
            condition.toLowerCase().includes(filterCondition.toLowerCase())
          )
        )
      );
    }

    return {
      id: `custom_${Date.now()}`,
      name: 'Segmento Personalizado',
      criteria,
      patientCount: filteredPatients.length,
      lastUpdated: new Date()
    };
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

  private calculateAverageAge(patients: Patient[]): number {
    if (patients.length === 0) return 0;
    
    const totalAge = patients.reduce((sum, patient) => {
      return sum + this.calculateAge(patient.birthDate);
    }, 0);
    
    return Math.round(totalAge / patients.length);
  }

  private calculateGrowthTrend(patients: Patient[], dateField: keyof Patient, compareDate: Date): number {
    const beforeCount = patients.filter(p => {
      const patientDate = new Date(p[dateField] as string || p.lastVisit);
      return patientDate < compareDate;
    }).length;
    
    const afterCount = patients.filter(p => {
      const patientDate = new Date(p[dateField] as string || p.lastVisit);
      return patientDate >= compareDate;
    }).length;
    
    if (beforeCount === 0) return afterCount > 0 ? 100 : 0;
    return Math.round(((afterCount - beforeCount) / beforeCount) * 100);
  }

  private calculateStatusTrend(patients: Patient[], status: string, compareDate: Date): number {
    const recentStatusCount = patients.filter(p => 
      p.status === status && new Date(p.lastVisit) >= compareDate
    ).length;
    
    const olderStatusCount = patients.filter(p => 
      p.status === status && new Date(p.lastVisit) < compareDate
    ).length;
    
    if (olderStatusCount === 0) return recentStatusCount > 0 ? 100 : 0;
    return Math.round(((recentStatusCount - olderStatusCount) / olderStatusCount) * 100);
  }

  private calculateNewPatientsTrend(patients: Patient[], compareDate: Date): number {
    const thisMonth = patients.filter(p => 
      new Date(p.registrationDate || p.lastVisit) >= compareDate
    ).length;
    
    const lastMonthStart = new Date(compareDate);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const lastMonth = patients.filter(p => {
      const regDate = new Date(p.registrationDate || p.lastVisit);
      return regDate >= lastMonthStart && regDate < compareDate;
    }).length;
    
    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  }

  private calculateAgeDistribution(patients: Patient[]): { range: string; count: number; percentage: number }[] {
    const ageGroups = {
      '0-17': 0, '18-29': 0, '30-44': 0, '45-59': 0, '60-74': 0, '75+': 0
    };
    
    patients.forEach(patient => {
      const age = this.calculateAge(patient.birthDate);
      if (age < 18) ageGroups['0-17']++;
      else if (age < 30) ageGroups['18-29']++;
      else if (age < 45) ageGroups['30-44']++;
      else if (age < 60) ageGroups['45-59']++;
      else if (age < 75) ageGroups['60-74']++;
      else ageGroups['75+']++;
    });
    
    const total = patients.length;
    return Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  private calculateGenderDistribution(patients: Patient[]): { gender: string; count: number; percentage: number }[] {
    const genderCounts = new Map<string, number>();
    
    patients.forEach(patient => {
      const gender = patient.gender || 'Não informado';
      genderCounts.set(gender, (genderCounts.get(gender) || 0) + 1);
    });
    
    const total = patients.length;
    return Array.from(genderCounts.entries()).map(([gender, count]) => ({
      gender,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  private calculateStatusDistribution(patients: Patient[]): { status: string; count: number; percentage: number }[] {
    const statusCounts = new Map<string, number>();
    
    patients.forEach(patient => {
      statusCounts.set(patient.status, (statusCounts.get(patient.status) || 0) + 1);
    });
    
    const total = patients.length;
    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  private calculateConditionDistribution(patients: Patient[]): { condition: string; count: number; percentage: number }[] {
    const conditionCounts = new Map<string, number>();
    
    patients.forEach(patient => {
      patient.conditions?.forEach(condition => {
        conditionCounts.set(condition, (conditionCounts.get(condition) || 0) + 1);
      });
    });
    
    const total = patients.length;
    return Array.from(conditionCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 conditions
      .map(([condition, count]) => ({
        condition,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }));
  }

  private calculateTrendData(patients: Patient[], period: 'week' | 'month' | 'quarter' | 'year'): TrendData[] {
    const now = new Date();
    const periods: TrendData[] = [];
    
    let periodCount = 12; // Default to 12 periods
    let periodLength: number;
    
    switch (period) {
      case 'week':
        periodLength = 7 * 24 * 60 * 60 * 1000;
        periodCount = 12; // 12 weeks
        break;
      case 'month':
        periodLength = 30 * 24 * 60 * 60 * 1000;
        periodCount = 12; // 12 months
        break;
      case 'quarter':
        periodLength = 90 * 24 * 60 * 60 * 1000;
        periodCount = 8; // 8 quarters
        break;
      case 'year':
        periodLength = 365 * 24 * 60 * 60 * 1000;
        periodCount = 5; // 5 years
        break;
    }
    
    for (let i = periodCount - 1; i >= 0; i--) {
      const periodEnd = new Date(now.getTime() - (i * periodLength));
      const periodStart = new Date(periodEnd.getTime() - periodLength);
      
      const newPatients = patients.filter(p => {
        const regDate = new Date(p.registrationDate || p.lastVisit);
        return regDate >= periodStart && regDate < periodEnd;
      }).length;
      
      const activePatients = patients.filter(p => {
        const lastVisit = new Date(p.lastVisit);
        return lastVisit >= periodStart && lastVisit < periodEnd && p.status === 'Ativo';
      }).length;
      
      const dischargedPatients = patients.filter(p => {
        const lastVisit = new Date(p.lastVisit);
        return lastVisit >= periodStart && lastVisit < periodEnd && p.status === 'Alta';
      }).length;
      
      periods.push({
        period: this.formatPeriod(periodStart, period),
        newPatients,
        activePatients,
        dischargedPatients,
        totalAppointments: Math.floor(activePatients * 2.5) // Estimated based on active patients
      });
    }
    
    return periods;
  }

  private formatPeriod(date: Date, period: string): string {
    switch (period) {
      case 'week':
        return `Sem ${this.getWeekNumber(date)}/${date.getFullYear()}`;
      case 'month':
        return `${date.toLocaleDateString('pt-BR', { month: 'short' })}/${date.getFullYear()}`;
      case 'quarter':
        return `Q${Math.ceil((date.getMonth() + 1) / 3)}/${date.getFullYear()}`;
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString('pt-BR');
    }
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private calculateChurnRisk(patients: Patient[]): { patientId: string; score: number; factors: string[] }[] {
    return patients
      .filter(p => p.status === 'Ativo')
      .map(patient => {
        const daysSinceLastVisit = Math.floor(
          (Date.now() - new Date(patient.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        let score = 0;
        const factors: string[] = [];
        
        if (daysSinceLastVisit > 30) {
          score += 30;
          factors.push('Sem consulta há mais de 30 dias');
        }
        
        if (daysSinceLastVisit > 60) {
          score += 40;
          factors.push('Sem consulta há mais de 60 dias');
        }
        
        const age = this.calculateAge(patient.birthDate);
        if (age < 25 || age > 70) {
          score += 15;
          factors.push('Faixa etária de maior risco');
        }
        
        if (patient.conditions && patient.conditions.length > 3) {
          score += 10;
          factors.push('Múltiplas condições');
        }
        
        return {
          patientId: patient.id,
          score: Math.min(score, 100),
          factors
        };
      })
      .filter(item => item.score > 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Top 20 at-risk patients
  }

  private calculateDemandForecast(patients: Patient[]): { period: string; predictedAppointments: number; confidence: number }[] {
    const activePatients = patients.filter(p => p.status === 'Ativo').length;
    const avgAppointmentsPerPatient = 2.3; // Historical average
    
    const forecast = [];
    const baseLoad = Math.round(activePatients * avgAppointmentsPerPatient);
    
    for (let i = 1; i <= 12; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      
      // Add seasonal variation
      const seasonalFactor = 1 + (Math.sin((futureDate.getMonth() + 1) * Math.PI / 6) * 0.1);
      const predicted = Math.round(baseLoad * seasonalFactor);
      
      forecast.push({
        period: futureDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        predictedAppointments: predicted,
        confidence: Math.max(0.6, 0.9 - (i * 0.05)) // Decreasing confidence over time
      });
    }
    
    return forecast;
  }

  private calculateLifetimeValuePrediction(patients: Patient[]): { segment: string; averageLTV: number; confidence: number }[] {
    const avgMonthlyRevenue = 120; // Average revenue per patient per month
    
    return [
      { segment: 'Adultos Jovens', averageLTV: avgMonthlyRevenue * 18, confidence: 0.75 },
      { segment: 'Meia Idade', averageLTV: avgMonthlyRevenue * 24, confidence: 0.85 },
      { segment: 'Idosos', averageLTV: avgMonthlyRevenue * 36, confidence: 0.80 },
      { segment: 'Condições Crônicas', averageLTV: avgMonthlyRevenue * 48, confidence: 0.90 },
      { segment: 'Lesões Esportivas', averageLTV: avgMonthlyRevenue * 8, confidence: 0.70 }
    ];
  }

  private calculateRetentionRate(patients: Patient[]): number {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const patientsFromSixMonthsAgo = patients.filter(p => 
      new Date(p.registrationDate || p.lastVisit) <= sixMonthsAgo
    );
    
    if (patientsFromSixMonthsAgo.length === 0) return 0;
    
    const stillActive = patientsFromSixMonthsAgo.filter(p => p.status === 'Ativo').length;
    
    return Math.round((stillActive / patientsFromSixMonthsAgo.length) * 100) / 100;
  }

  private calculateAverageTreatmentDuration(patients: Patient[]): number {
    const completedTreatments = patients.filter(p => p.status === 'Alta');
    
    if (completedTreatments.length === 0) return 0;
    
    const totalDuration = completedTreatments.reduce((sum, patient) => {
      const start = new Date(patient.registrationDate || patient.lastVisit);
      const end = new Date(patient.lastVisit);
      const durationInDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + durationInDays;
    }, 0);
    
    return Math.round(totalDuration / completedTreatments.length);
  }

  private calculateRevenuePerPatient(patients: Patient[]): number {
    // This would typically come from a billing/payment service
    // For now, we'll estimate based on treatment duration and average session cost
    const avgSessionCost = 80;
    const avgSessionsPerMonth = 8;
    const avgTreatmentDurationMonths = 3;
    
    return avgSessionCost * avgSessionsPerMonth * avgTreatmentDurationMonths;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

export const analyticsService = new AnalyticsService();