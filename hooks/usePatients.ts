// hooks/usePatients.ts
import { useState, useEffect, useCallback, useContext } from 'react';
import { Patient } from '../types';
import * as patientService from '../services/patientService';
import { useToast } from '../contexts/ToastContext';
import { AuthContext } from '../contexts/AuthContext';

interface UsePatientsResult {
  patients: Patient[];
  isLoading: boolean;
  error: Error | null;
  addPatient: (patientData: Omit<Patient, 'id' | 'lastVisit'>) => Promise<Patient | undefined>;
  updatePatient: (patientData: Patient, changes?: Record<string, any>) => Promise<Patient | undefined>;
}

export const usePatients = (): UsePatientsResult => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPatients = await patientService.getPatients();
      setPatients(fetchedPatients);
      setError(null);
    } catch (err) {
      setError(err as Error);
      showToast("Falha ao carregar pacientes.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>): Promise<Patient | undefined> => {
    if (!user) {
      showToast("Usuário não autenticado.", "error");
      return undefined;
    }

    try {
      const newPatient = await patientService.addPatientWithAudit(
        patientData,
        user.id,
        user.name
      );
      // Refetch to maintain the sorted order from the service
      await fetchPatients(); 
      showToast("Paciente adicionado com sucesso!", "success");
      return newPatient;
    } catch (err) {
      showToast("Falha ao adicionar paciente.", "error");
      return undefined;
    }
  };

  const updatePatient = async (patientData: Patient, changes?: Record<string, any>): Promise<Patient | undefined> => {
    if (!user) {
      showToast("Usuário não autenticado.", "error");
      return undefined;
    }

    try {
      const updatedPatient = await patientService.updatePatientWithAudit(
        patientData,
        user.id,
        user.name,
        changes
      );
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      showToast("Paciente atualizado com sucesso!", "success");
      return updatedPatient;
    } catch (err) {
      showToast("Falha ao atualizar paciente.", "error");
      return undefined;
    }
  };


  return { patients, isLoading, error, addPatient, updatePatient };
};
