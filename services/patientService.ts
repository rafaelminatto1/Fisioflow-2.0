import { Patient, PatientAttachment } from '../types';
import { apiClient, ApiError } from './apiClient';
import { mockDataProvider } from './mockDataProvider';
import { searchService, SearchFilters } from './searchService';
import { complianceService, AuditAction } from './complianceService';

const USE_MOCK_DATA = process.env.NODE_ENV === 'development' || !process.env.REACT_APP_API_URL;

export const getPatients = async (): Promise<Patient[]> => {
    try {
        if (USE_MOCK_DATA) {
            const patients = await mockDataProvider.getPatients();
            return patients.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
        }

        const response = await apiClient.get<Patient[]>('/patients');
        return response.data.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
    } catch (error) {
        if (error instanceof ApiError) {
            throw new Error(`Erro ao buscar pacientes: ${error.message}`);
        }
        throw error;
    }
};

export const getPatientById = async (id: string): Promise<Patient | undefined> => {
    try {
        if (USE_MOCK_DATA) {
            return await mockDataProvider.getPatient(id) || undefined;
        }

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
};

export const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>): Promise<Patient> => {
    try {
        const newPatientData = {
            ...patientData,
            lastVisit: new Date().toISOString(),
        };

        if (USE_MOCK_DATA) {
            return await mockDataProvider.createPatient(newPatientData);
        }

        const response = await apiClient.post<Patient>('/patients', newPatientData);
        return response.data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw new Error(`Erro ao criar paciente: ${error.message}`);
        }
        throw error;
    }
};

export const updatePatient = async (updatedPatient: Patient): Promise<Patient> => {
    try {
        if (USE_MOCK_DATA) {
            const updated = await mockDataProvider.updatePatient(updatedPatient.id, updatedPatient);
            if (!updated) {
                throw new Error('Paciente não encontrado');
            }
            return updated;
        }

        const response = await apiClient.put<Patient>(`/patients/${updatedPatient.id}`, updatedPatient);
        return response.data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw new Error(`Erro ao atualizar paciente: ${error.message}`);
        }
        throw error;
    }
};

export const addAttachment = async (patientId: string, file: File): Promise<PatientAttachment> => {
    try {
        const newAttachment: PatientAttachment = {
            name: file.name,
            url: '#', // In a real app, this would be the URL from blob storage
            type: file.type,
            size: file.size,
        };

        if (USE_MOCK_DATA) {
            const patient = await mockDataProvider.getPatient(patientId);
            if (!patient) {
                throw new Error('Paciente não encontrado.');
            }

            const updatedAttachments = [...(patient.attachments || []), newAttachment];
            await mockDataProvider.updatePatient(patientId, {
                attachments: updatedAttachments,
            });

            return newAttachment;
        }

        // For real API, you would upload the file first
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
};

// Enhanced patient service methods

export const searchPatients = async (
    filters: Partial<SearchFilters>,
    page: number = 1,
    pageSize: number = 50,
    userId?: string
): Promise<{ patients: Patient[]; totalCount: number; facets: any }> => {
    // Log search action for audit
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
    
    return await searchService.searchPatients(filters, page, pageSize);
};

export const getPatientWithAudit = async (
    id: string,
    userId: string,
    userName: string
): Promise<Patient | undefined> => {
    // Log patient access for compliance
    await complianceService.logAction(
        userId,
        userName,
        AuditAction.VIEW_PATIENT,
        'patient',
        id,
        { accessTime: new Date() }
    );
    
    return await getPatientById(id);
};

export const addPatientWithAudit = async (
    patientData: Omit<Patient, 'id' | 'lastVisit'>,
    userId: string,
    userName: string
): Promise<Patient> => {
    const newPatient = await addPatient(patientData);
    
    // Log patient creation
    await complianceService.logAction(
        userId,
        userName,
        AuditAction.CREATE_PATIENT,
        'patient',
        newPatient.id,
        { patientData: { name: patientData.name, cpf: patientData.cpf } }
    );
    
    // Initialize default consent status
    await complianceService.updateConsent(newPatient.id, 'dataProcessing', true, '1.0');
    
    return newPatient;
};

export const updatePatientWithAudit = async (
    updatedPatient: Patient,
    userId: string,
    userName: string,
    changes?: Record<string, any>
): Promise<Patient> => {
    const result = await updatePatient(updatedPatient);
    
    // Log patient update
    await complianceService.logAction(
        userId,
        userName,
        AuditAction.UPDATE_PATIENT,
        'patient',
        updatedPatient.id,
        { changes: changes || 'patient_data_updated' }
    );
    
    return result;
};

export const deletePatientWithAudit = async (
    patientId: string,
    userId: string,
    userName: string,
    reason: string
): Promise<void> => {
    // In a real implementation, this would perform soft delete or data archival
    // For now, we'll just log the action
    await complianceService.logAction(
        userId,
        userName,
        AuditAction.DELETE_PATIENT,
        'patient',
        patientId,
        { reason, deletedAt: new Date() }
    );
    
    // Revoke all consents
    await complianceService.updateConsent(patientId, 'dataProcessing', false, '1.0');
    await complianceService.updateConsent(patientId, 'dataSharing', false, '1.0');
    await complianceService.updateConsent(patientId, 'marketing', false, '1.0');
    await complianceService.updateConsent(patientId, 'research', false, '1.0');
};

export const addAttachmentWithAudit = async (
    patientId: string,
    file: File,
    userId: string,
    userName: string
): Promise<PatientAttachment> => {
    const attachment = await addAttachment(patientId, file);
    
    // Log document upload
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
};

export const validatePatientConsent = async (
    patientId: string,
    requiredConsents: string[]
): Promise<{ valid: boolean; missingConsents: string[] }> => {
    return await complianceService.validateConsent(
        patientId,
        requiredConsents as any
    );
};

export const exportPatientData = async (
    patientId: string,
    userId: string,
    format: 'json' | 'pdf' = 'json'
): Promise<any> => {
    return await complianceService.exportPatientData(patientId, userId, format);
};

export const requestPatientDataDeletion = async (
    patientId: string,
    requestedBy: string,
    reason: string
) => {
    return await complianceService.requestDataDeletion(patientId, requestedBy, reason);
};

export const getPatientAuditLog = async (
    patientId: string,
    page: number = 1,
    pageSize: number = 50
) => {
    return await complianceService.getAuditLogs(
        { resourceType: 'patient' },
        page,
        pageSize
    );
};

export const checkPatientExists = async (cpf: string): Promise<boolean> => {
    try {
        const patients = await getPatients();
        return patients.some(patient => patient.cpf === cpf);
    } catch (error) {
        console.error('Error checking patient existence:', error);
        return false;
    }
};

export const getPatientsByStatus = async (status: string): Promise<Patient[]> => {
    try {
        const patients = await getPatients();
        return patients.filter(patient => patient.status === status);
    } catch (error) {
        console.error('Error filtering patients by status:', error);
        return [];
    }
};

export const getPatientsByTherapist = async (therapistId: string): Promise<Patient[]> => {
    try {
        const patients = await getPatients();
        return patients.filter(patient => patient.therapistId === therapistId);
    } catch (error) {
        console.error('Error filtering patients by therapist:', error);
        return [];
    }
};

export const getPatientsByCondition = async (condition: string): Promise<Patient[]> => {
    try {
        const patients = await getPatients();
        return patients.filter(patient => 
            patient.conditions?.some(c => 
                c.toLowerCase().includes(condition.toLowerCase())
            )
        );
    } catch (error) {
        console.error('Error filtering patients by condition:', error);
        return [];
    }
};

export const getRecentPatients = async (days: number = 30): Promise<Patient[]> => {
    try {
        const patients = await getPatients();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return patients.filter(patient => 
            new Date(patient.lastVisit) >= cutoffDate
        );
    } catch (error) {
        console.error('Error getting recent patients:', error);
        return [];
    }
};

export const getPatientStatistics = async () => {
    try {
        const patients = await getPatients();
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        return {
            total: patients.length,
            active: patients.filter(p => p.status === 'Ativo').length,
            inactive: patients.filter(p => p.status === 'Inativo').length,
            discharged: patients.filter(p => p.status === 'Alta').length,
            newThisMonth: patients.filter(p => 
                new Date(p.registrationDate || p.lastVisit) >= lastMonth
            ).length,
            averageAge: patients.length > 0 ? 
                Math.round(patients.reduce((sum, p) => {
                    const age = calculateAge(p.birthDate);
                    return sum + age;
                }, 0) / patients.length) : 0
        };
    } catch (error) {
        console.error('Error calculating patient statistics:', error);
        return {
            total: 0,
            active: 0,
            inactive: 0,
            discharged: 0,
            newThisMonth: 0,
            averageAge: 0
        };
    }
};

// Helper function to calculate age
const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
};