

import { Patient, PatientAttachment, SearchFilters, EnhancedPatient, PatientDocument, PatientTag, CustomField, PatientPreferences, ExportOptions } from '../types';

import { apiClient, ApiError } from './apiClient';
import { searchService } from './searchService';
import { complianceService, AuditAction } from './complianceService';
import { analyticsService } from './analyticsService';

class PatientService {
  async getPatients(): Promise<Patient[]> {
    try {
      const response = await apiClient.get<Patient[]>('/patients');
      return response.data.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Erro ao buscar pacientes: ${error.message}`);
      }
      throw error;
    }
  }

  async getPatientById(id: string): Promise<Patient | undefined> {
    try {
      const response = await apiClient.get<Patient>(`/patients/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return undefined;
      }
      if (error instanceof ApiError) {
        throw new Error(`Erro ao buscar paciente: ${error.message}`);
      }
      throw error;
    }
  }

  async addPatient(patientData: Omit<Patient, 'id' | 'lastVisit'>): Promise<Patient> {
    try {
      const newPatientData = {
        ...patientData,
        lastVisit: new Date().toISOString(),
      };
      const response = await apiClient.post<Patient>('/patients', newPatientData);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Erro ao criar paciente: ${error.message}`);
      }
      throw error;
    }
  }

  async updatePatient(updatedPatient: Patient): Promise<Patient> {
    try {
      const response = await apiClient.put<Patient>(`/patients/${updatedPatient.id}`, updatedPatient);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Erro ao atualizar paciente: ${error.message}`);
      }
      throw error;
    }
  }

  async deletePatient(id: string): Promise<void> {
    try {
      await apiClient.delete(`/patients/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Erro ao deletar paciente: ${error.message}`);
      }
      throw error;
    }
  }

  async addAttachment(patientId: string, file: File): Promise<PatientAttachment> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<PatientAttachment>(`/patients/${patientId}/attachments`, formData);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Erro ao adicionar anexo: ${error.message}`);
      }
      throw error;
    }
  }

  async removeAttachment(patientId: string, attachmentId: string): Promise<void> {
    try {
      await apiClient.delete(`/patients/${patientId}/attachments/${attachmentId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Erro ao remover anexo: ${error.message}`);
      }
      throw error;
    }
  }

  // Enhanced patient service methods with audit logging

  async searchPatients(
    filters: Partial<SearchFilters>,
    page: number = 1,
    pageSize: number = 50,
    userId?: string
  ): Promise<{ patients: Patient[]; totalCount: number; facets: any }> {
    if (userId) {
      await complianceService.logAction(
        userId,
        'User',
        AuditAction.VIEW_PATIENT,
        'patient',
        'search',
        { filters, page, pageSize }
      );
    }
    return searchService.searchPatients(filters, page, pageSize);
  }

  async getEnhancedPatients(): Promise<EnhancedPatient[]> {
    try {
      const patients = await this.getPatients();
      // Transform regular patients to enhanced patients with additional metadata
      return patients.map(patient => ({
        ...patient,
        totalAppointments: 0, // This would be calculated from appointments
        lastAppointmentDate: patient.lastVisit,
        upcomingAppointments: 0,
        treatmentProgress: 0,
        riskScore: 0,
        tags: [],
        customFields: [],
        preferences: {
          communicationMethod: 'email',
          reminderFrequency: 'daily',
          language: 'pt-BR'
        }
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Erro ao buscar pacientes aprimorados: ${error.message}`);
      }
      throw error;
    }
  }

  async getPatientWithAudit(
    id: string,
    userId: string,
    userName: string
  ): Promise<Patient | undefined> {
    await complianceService.logAction(
      userId,
      userName,
      AuditAction.VIEW_PATIENT,
      'patient',
      id,
      { accessTime: new Date() }
    );
    return this.getPatientById(id);
  }

  async addPatientWithAudit(
    patientData: Omit<Patient, 'id' | 'lastVisit'>,
    userId: string,
    userName: string
  ): Promise<Patient> {
    const newPatient = await this.addPatient(patientData);
    await complianceService.logAction(
      userId,
      userName,
      AuditAction.CREATE_PATIENT,
      'patient',
      newPatient.id,
      { patientData: { name: patientData.name, cpf: patientData.cpf } }
    );
    await complianceService.updateConsent(newPatient.id, 'dataProcessing', true, '1.0');
    return newPatient;
  }

  async updatePatientWithAudit(
    updatedPatient: Patient,
    userId: string,
    userName: string,
    changes?: Record<string, any>
  ): Promise<Patient> {
    const result = await this.updatePatient(updatedPatient);
    await complianceService.logAction(
      userId,
      userName,
      AuditAction.UPDATE_PATIENT,
      'patient',
      updatedPatient.id,
      { changes: changes || 'patient_data_updated' }
    );
    return result;
  }

    async deletePatientWithAudit(
    patientId: string,
    userId: string,
    userName: string,
    reason: string
  ): Promise<void> {
    await complianceService.logAction(
      userId,
      userName,
      AuditAction.DELETE_PATIENT,
      'patient',
      patientId,
      { reason, deletedAt: new Date() }
    );
    // In a real implementation, this would perform a soft delete.
    // For now, we just log and revoke consents.
    await complianceService.updateConsent(patientId, 'dataProcessing', false, '1.0');
  }

  async addAttachmentWithAudit(
    patientId: string,
    file: File,
    userId: string,
    userName: string
  ): Promise<PatientAttachment> {
    const attachment = await this.addAttachment(patientId, file);
    await complianceService.logAction(
      userId,
      userName,
      AuditAction.UPLOAD_DOCUMENT,
      'document',
      `${patientId}_${attachment.name}`,
      {
        fileName: attachment.name,
        fileSize: attachment.size,
        fileType: attachment.type
      }
    );
    return attachment;
  }

  // Analytics-related methods
  async getPatientStatistics() {
    return analyticsService.getPatientStatistics();
  }

  async getPatientDemographics() {
    return analyticsService.getPatientDemographics();
  }

  async getPatientChurnRisk() {
    return analyticsService.getPatientChurnRisk();
  }

  async exportPatients(options: ExportOptions, userId: string): Promise<Blob> {
    await complianceService.logAction(
      userId,
      'User',
      AuditAction.EXPORT_DATA,
      'patient',
      'batch_export',
      { options }
    );

    const { patients } = await this.searchPatients(options.filters || {});

    if (options.format === 'csv') {
      const csv = this.convertToCSV(patients);
      return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    } else if (options.format === 'pdf') {
      // PDF generation would be more complex, using a library like jsPDF
      // This is a placeholder
      const pdfContent = `Patients Report - ${new Date().toLocaleDateString()}\n\n` +
        patients.map(p => `${p.name} - ${p.cpf}`).join('\n');
      return new Blob([pdfContent], { type: 'application/pdf' });
    }

    throw new Error('Unsupported export format');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) {
      return '';
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(fieldName => JSON.stringify(row[fieldName])).join(',')
      )
    ];
    return csvRows.join('\r\n');
  }

  async importPatients(file: File, userId: string): Promise<{ success: number; errors: string[] }> {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      let success = 0;
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        try {
          const values = lines[i].split(',');
          const patientData: any = {};
          
          headers.forEach((header, index) => {
            patientData[header.trim()] = values[index]?.trim() || '';
          });
          
          await this.addPatientWithAudit(patientData, userId, 'Import User');
          success++;
        } catch (error) {
          errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }
      
      return { success, errors };
    } catch (error) {
      throw new Error(`Erro ao importar pacientes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async getPatientSuggestions(query: string): Promise<Patient[]> {
    if (!query) {
      return [];
    }
    const { data, success } = await apiClient.get<Patient[]>(`/patients?name_like=${query}`);
    if (!success) {
      return [];
    }
    return data || [];
  }

  async checkDuplicatePatient(cpf: string, name: string): Promise<Patient | null> {
    const { data, success } = await apiClient.get<Patient[]>(`/patients?cpf=${cpf}`);
    if (!success) {
      return null;
    }
    if (data && data.length > 0) {
      return data[0];
    }
    // In a real app, you might also check for similar names
    return null;
  }
}

// Create PatientService instance
const patientServiceInstance = new PatientService();

// Export individual functions to match namespace import pattern
export const getPatients = patientServiceInstance.getPatients.bind(patientServiceInstance);
export const getPatientById = patientServiceInstance.getPatientById.bind(patientServiceInstance);
export const addPatient = patientServiceInstance.addPatient.bind(patientServiceInstance);
export const updatePatient = patientServiceInstance.updatePatient.bind(patientServiceInstance);
export const deletePatient = patientServiceInstance.deletePatient.bind(patientServiceInstance);
export const addPatientWithAudit = patientServiceInstance.addPatientWithAudit.bind(patientServiceInstance);
export const updatePatientWithAudit = patientServiceInstance.updatePatientWithAudit.bind(patientServiceInstance);
export const addAttachment = patientServiceInstance.addAttachment.bind(patientServiceInstance);
export const removeAttachment = patientServiceInstance.removeAttachment.bind(patientServiceInstance);
export const searchPatients = patientServiceInstance.searchPatients.bind(patientServiceInstance);
export const getEnhancedPatients = patientServiceInstance.getEnhancedPatients.bind(patientServiceInstance);
export const exportPatients = patientServiceInstance.exportPatients.bind(patientServiceInstance);
export const importPatients = patientServiceInstance.importPatients.bind(patientServiceInstance);

// Also export the instance for backward compatibility
export const patientService = patientServiceInstance;
