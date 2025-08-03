import { supabase } from './supabase/supabaseClient';
import { ConsentRecord, DataDeletionRequest } from '../types';

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE_PATIENT = 'create_patient',
  VIEW_PATIENT = 'view_patient',
  UPDATE_PATIENT = 'update_patient',
  DELETE_PATIENT = 'delete_patient',
  EXPORT_DATA = 'export_data',
  UPLOAD_DOCUMENT = 'upload_document',
  DELETE_DOCUMENT = 'delete_document',
}

class ComplianceService {
  async logAction(
    userId: string,
    userName: string,
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    details: Record<string, any>
  ) {
    const { error } = await supabase.from('audit_log').insert([
      {
        user_id: userId,
        user_name: userName,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
      },
    ]);

    if (error) {
      console.error('Error logging action:', error);
    }
  }

  async updateConsent(
    patientId: string,
    consentType: string,
    granted: boolean,
    version: string
  ): Promise<void> {
    const { error } = await supabase.from('consents').upsert(
      {
        patient_id: patientId,
        consent_type: consentType,
        granted,
        version,
        updated_at: new Date(),
      },
      { onConflict: 'patient_id,consent_type' }
    );

    if (error) {
      throw new Error(`Erro ao atualizar consentimento: ${error.message}`);
    }
  }

  async validateConsent(
    patientId: string,
    requiredConsents: string[]
  ): Promise<{ valid: boolean; missingConsents: string[] }> {
    const { data, error } = await supabase
      .from('consents')
      .select('consent_type,granted')
      .eq('patient_id', patientId)
      .in('consent_type', requiredConsents);

    if (error) {
      throw new Error(`Erro ao validar consentimento: ${error.message}`);
    }

    const grantedConsents = data?.filter(c => c.granted).map(c => c.consent_type) || [];
    const missingConsents = requiredConsents.filter(rc => !grantedConsents.includes(rc));

    return { valid: missingConsents.length === 0, missingConsents };
  }

  async exportPatientData(patientId: string, userId: string, format: 'json' | 'pdf') {
    // In a real app, this would generate a file and return a URL
    // For now, we just log the action and return the patient data
    await this.logAction(userId, 'User', AuditAction.EXPORT_DATA, 'patient', patientId, { format });
    const { data } = await supabase.from('patients').select('*').eq('id', patientId).single();
    return data;
  }

  async requestDataDeletion(patientId: string, requestedBy: string, reason: string) {
    const { data, error } = await supabase.from('data_deletion_requests').insert([
      {
        patient_id: patientId,
        requested_by: requestedBy,
        reason,
        status: 'pending',
      },
    ]);

    if (error) {
      throw new Error(`Erro ao solicitar exclusão de dados: ${error.message}`);
    }

    return data;
  }

  async getAuditLogs(filters: any, page: number = 1, pageSize: number = 50) {
    let query = supabase.from('audit_log').select('*', { count: 'exact' });

    if (filters.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }

    const { data, error, count } = await query
      .order('timestamp', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      throw new Error(`Erro ao buscar logs de auditoria: ${error.message}`);
    }

    return { logs: data || [], totalCount: count || 0 };
  }
}

export const complianceService = new ComplianceService();