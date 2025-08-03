
import { supabase } from './supabase/supabaseClient';

class PredictionService {
  async getMetricPredictions(metricId: string): Promise<any[]> {
    // This would involve a machine learning model or complex statistical analysis.
    // For now, we'll use a placeholder RPC call.
    const { data, error } = await supabase.rpc('get_metric_predictions', { metric_id: metricId });

    if (error) {
      throw new Error(`Erro ao buscar previsões de métricas: ${error.message}`);
    }

    return data || [];
  }
}

export const predictionService = new PredictionService();
