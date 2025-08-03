
import { supabase } from './supabase/supabaseClient';
import { MetricTemplate } from '../types';

class MetricTemplateService {
  async getMetricTemplates(): Promise<MetricTemplate[]> {
    const { data, error } = await supabase.from('metric_templates').select('*');

    if (error) {
      throw new Error(`Erro ao buscar templates de métricas: ${error.message}`);
    }

    return data || [];
  }

  async createMetricTemplate(template: Omit<MetricTemplate, 'id'>): Promise<MetricTemplate> {
    const { data, error } = await supabase.from('metric_templates').insert([template]).single();

    if (error) {
      throw new Error(`Erro ao criar template de métrica: ${error.message}`);
    }

    return data;
  }
}

export const metricTemplateService = new MetricTemplateService();
