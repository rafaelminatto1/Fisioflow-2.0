
import { supabase } from './supabase/supabaseClient';

class ReportingService {
  async getReport(reportId: string): Promise<any> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar relatório: ${error.message}`);
    }

    return data;
  }

  async generateReport(reportType: string, parameters: any): Promise<any> {
    const { data, error } = await supabase.rpc('generate_report', {
      report_type: reportType,
      parameters,
    });

    if (error) {
      throw new Error(`Erro ao gerar relatório: ${error.message}`);
    }

    return data;
  }
}

export const reportingService = new ReportingService();
