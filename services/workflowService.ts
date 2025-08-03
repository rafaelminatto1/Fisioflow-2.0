
import { supabase } from './supabase/supabaseClient';

class WorkflowService {
  async getWorkflows(patientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('patient_id', patientId);

    if (error) {
      throw new Error(`Erro ao buscar workflows: ${error.message}`);
    }

    return data || [];
  }

  async updateWorkflowStatus(workflowId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .update({ status })
      .eq('id', workflowId);

    if (error) {
      throw new Error(`Erro ao atualizar status do workflow: ${error.message}`);
    }
  }

  async dischargePatient(patientId: string, dischargeReason: string): Promise<void> {
    const { error } = await supabase.rpc('discharge_patient', {
      p_patient_id: patientId,
      p_discharge_reason: dischargeReason,
    });

    if (error) {
      throw new Error(`Erro ao dar alta ao paciente: ${error.message}`);
    }
  }
}

export const workflowService = new WorkflowService();
