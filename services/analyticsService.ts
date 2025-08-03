import { supabase } from './supabase/supabaseClient';

class AnalyticsService {
  async getPatientStatistics() {
    const { data, error } = await supabase.rpc('get_patient_statistics');

    if (error) {
      throw new Error(`Erro ao buscar estatísticas de pacientes: ${error.message}`);
    }

    return data;
  }

  async getPatientDemographics() {
    const { data, error } = await supabase.rpc('get_patient_demographics');

    if (error) {
      throw new Error(`Erro ao buscar dados demográficos de pacientes: ${error.message}`);
    }

    return data;
  }

  async getPatientChurnRisk() {
    // This would likely be a more complex calculation, maybe involving a machine learning model.
    // For now, we'll use a simple RPC call.
    const { data, error } = await supabase.rpc('get_patient_churn_risk');

    if (error) {
      throw new Error(`Erro ao buscar risco de churn de pacientes: ${error.message}`);
    }

    return data;
  }

  async getPatientSegments() {
    const { data, error } = await supabase.rpc('get_patient_segments');

    if (error) {
      throw new Error(`Erro ao buscar segmentos de pacientes: ${error.message}`);
    }

    return data;
  }

  async getMetricPredictions(metricId: string) {
    // return predictionService.getMetricPredictions(metricId);
    return []; // Placeholder until predictionService is implemented
  }
}

export const analyticsService = new AnalyticsService();