import { Patient, PatientAttachment } from '../types';
import { mockPatients } from '../data/mockData';

let patients: Patient[] = [...mockPatients];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getPatients = async (): Promise<Patient[]> => {
    await delay(500);
    return [...patients].sort((a,b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
};

export const getPatientById = async (id: string): Promise<Patient | undefined> => {
    await delay(300);
    return patients.find(p => p.id === id);
};

export const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>): Promise<Patient> => {
    await delay(400);
    const newPatient: Patient = {
        id: `patient_${Date.now()}`,
        ...patientData,
        lastVisit: new Date().toISOString(),
    };
    patients.unshift(newPatient);
    return newPatient;
};

export const updatePatient = async (updatedPatient: Patient): Promise<Patient> => {
    await delay(400);
    patients = patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    return updatedPatient;
};

export const addAttachment = async (patientId: string, file: File): Promise<PatientAttachment> => {
    await delay(600); // simulate upload
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) {
        throw new Error('Paciente não encontrado.');
    }

    const newAttachment: PatientAttachment = {
        name: file.name,
        url: '#', // In a real app, this would be the URL from blob storage
        type: file.type,
        size: file.size,
    };

    const patient = patients[patientIndex];
    const updatedAttachments = [...(patient.attachments || []), newAttachment];
    
    patients[patientIndex] = {
        ...patient,
        attachments: updatedAttachments,
    };
    
    return newAttachment;
};