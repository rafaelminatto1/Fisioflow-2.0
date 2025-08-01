// hooks/usePatients.ts
import { useState, useEffect, useCallback } from 'react';
import { Patient } from '../types';
import * as patientService from '../services/patientService';
import { useToast } from '../contexts/ToastContext';

interface UsePatientsResult {
  patients: Patient[];
  isLoading: boolean;
  error: Error | null;
  addPatient: (patientData: Omit<Patient, 'id' | 'lastVisit'>) => Promise<Patient | undefined>;
  updatePatient: (patientData: Patient) => Promise<Patient | undefined>;
}

export const usePatients = (): UsePatientsResult => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();

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
    try {
      const newPatient = await patientService.addPatient(patientData);
      // Refetch to maintain the sorted order from the service
      await fetchPatients(); 
      showToast("Paciente adicionado com sucesso!", "success");
      return newPatient;
    } catch (err) {
      showToast("Falha ao adicionar paciente.", "error");
      return undefined;
    }
  };

  const updatePatient = async (patientData: Patient): Promise<Patient | undefined> => {
      try {
          const updatedPatient = await patientService.updatePatient(patientData);
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
