import { Patient, PatientAttachment } from '../types';
import { apiClient, ApiError } from './apiClient';
import { mockDataProvider } from './mockDataProvider';

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