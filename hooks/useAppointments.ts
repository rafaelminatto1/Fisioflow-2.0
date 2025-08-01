// hooks/useAppointments.ts
import { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../types';
import * as appointmentService from '../services/appointmentService';
import { useToast } from '../contexts/ToastContext';
import { generateRecurrences } from '../services/scheduling/recurrenceService';
import { findConflict } from '../services/scheduling/conflictDetection';

interface UseAppointmentsResult {
  appointments: Appointment[];
  isLoading: boolean;
  error: Error | null;
  saveAppointments: (appointmentsToSave: Appointment[]) => Promise<boolean>;
  removeAppointment: (id: string, seriesId?: string, fromDate?: Date) => Promise<boolean>;
  refetch: () => void;
}

export const useAppointments = (): UseAppointmentsResult => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await appointmentService.getAppointments();
      setAppointments(response);
      setError(null);
    } catch (err) {
      setError(err as Error);
      showToast("Erro ao carregar agendamentos.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveAppointments = async (appointmentsToSave: Appointment[]): Promise<boolean> => {
    const isEditing = !!appointmentsToSave[0]?.id && appointments.some(a => a.id === appointmentsToSave[0].id);
    const conflict = findConflict(appointmentsToSave, appointments, isEditing ? appointmentsToSave[0].id : undefined);

    if (conflict) {
      showToast(`Conflito detectado com a consulta de ${conflict.patientName}.`, "error");
      return false;
    }

    try {
      await Promise.all(appointmentsToSave.map(app => appointmentService.saveAppointment(app)));
      showToast('Consulta(s) salva(s) com sucesso!', 'success');
      fetchData(); // Re-fetch for consistency
      return true;
    } catch (err) {
      console.error("Failed to save appointments:", err);
      showToast("Falha ao salvar consulta(s).", "error");
      return false;
    }
  };

  const removeAppointment = async (id: string, seriesId?: string, fromDate?: Date): Promise<boolean> => {
    try {
      if (seriesId && fromDate) {
        await appointmentService.deleteAppointmentSeries(seriesId, fromDate);
      } else {
        await appointmentService.deleteAppointment(id);
      }
      showToast("Agendamento(s) removido(s) com sucesso.", "success");
      fetchData(); // Re-fetch
      return true;
    } catch (err) {
      console.error("Failed to remove appointment(s):", err);
      showToast("Falha ao remover agendamento(s).", "error");
      return false;
    }
  };


  return { 
    appointments, 
    isLoading, 
    error, 
    saveAppointments,
    removeAppointment,
    refetch: fetchData 
  };
};
