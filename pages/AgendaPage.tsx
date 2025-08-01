

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus, Users, Calendar } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Appointment, Patient, Therapist, AppointmentStatus } from '../types';
import AppointmentFormModal from '../components/AppointmentFormModal';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import AppointmentCard from '../components/AppointmentCard';
import Skeleton from '../components/ui/Skeleton';
import { useAppointments } from '../hooks/useAppointments';
import { usePatients } from '../hooks/usePatients';
import { useTherapists } from '../hooks/useTherapists';
import { generateRecurrences } from '../services/scheduling/recurrenceService';
import { useToast } from '../contexts/ToastContext';

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM (19:00)

const AgendaPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [modalInitialData, setModalInitialData] = useState<{ date: Date, therapistId?: string } | undefined>(undefined);

  const { appointments, isLoading: isLoadingAppointments, error: errorAppointments, saveAppointments, removeAppointment } = useAppointments();
  const { patients, isLoading: isLoadingPatients, error: errorPatients } = usePatients();
  const { therapists, isLoading: isLoadingTherapists, error: errorTherapists } = useTherapists();
  const { showToast } = useToast();

  const isLoading = isLoadingAppointments || isLoadingPatients || isLoadingTherapists;
  const error = errorAppointments || errorPatients || errorTherapists;

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const startOfWeek = useCallback((date: Date) => {
    const dt = new Date(date);
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1); // Start week on Monday
    return new Date(dt.setDate(diff));
  }, []);

  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(startOfWeek(currentDate), i)), [currentDate, startOfWeek]);

  const changeDate = (amount: number) => {
    const newDate = new Date(currentDate);
    if(viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (amount * 7));
    } else {
        newDate.setDate(newDate.getDate() + amount);
    }
    setCurrentDate(newDate);
  }
  
  const handleSelectAppointment = (appointment: Appointment) => {
      setSelectedAppointment(appointment);
      setIsDetailModalOpen(true);
  };
  
  const handleEditFromDetail = (appointment: Appointment) => {
    setIsDetailModalOpen(false);
    setSelectedAppointment(appointment);
    setModalInitialData(undefined);
    setIsFormModalOpen(true);
  };

  const handleOpenFormToCreate = (date?: Date, therapistId?: string) => {
    setSelectedAppointment(undefined);
    setModalInitialData({ date: date || new Date(), therapistId });
    setIsFormModalOpen(true);
  };

  const handleStatusChange = async (appointment: Appointment, newStatus: AppointmentStatus) => {
      const updatedAppointment = { ...appointment, status: newStatus };
      const success = await saveAppointments([updatedAppointment]);
      if (success) {
          showToast('Status atualizado com sucesso!', 'success');
          setSelectedAppointment(updatedAppointment);
      }
  };

  const handlePaymentStatusChange = async (appointment: Appointment, newPaymentStatus: 'paid' | 'pending') => {
      const updatedAppointment = { ...appointment, paymentStatus: newPaymentStatus };
      const success = await saveAppointments([updatedAppointment]);
      if (success) {
          showToast('Status de pagamento atualizado!', 'success');
          setSelectedAppointment(updatedAppointment);
      }
  };

  const handlePackagePayment = async (appointment: Appointment) => {
    const packageIdentifier = appointment.seriesId || `${appointment.patientId}-${appointment.totalSessions}`;
    
    const packageAppointments = appointments.filter(app => {
        if (appointment.seriesId) {
            return app.seriesId === appointment.seriesId;
        }
        // Fallback for non-recurring packages based on total sessions
        return app.patientId === appointment.patientId && app.totalSessions === appointment.totalSessions;
    });

    if (packageAppointments.length <= 1) {
        showToast('Nenhuma outra sessão de pacote encontrada para atualizar.', 'info');
        return;
    }

    const updatedAppointments = packageAppointments.map(app => ({
        ...app,
        paymentStatus: 'paid' as 'paid' | 'pending'
    }));

    const success = await saveAppointments(updatedAppointments);
    if (success) {
        showToast(`Pacote de ${updatedAppointments.length} sessões foi pago!`, 'success');
        setIsDetailModalOpen(false);
    }
  };

  const handleUpdateAppointmentValue = async (appointmentId: string, newValue: number) => {
    const appointmentToUpdate = appointments.find(app => app.id === appointmentId);
    if (!appointmentToUpdate) return;
    
    const updatedAppointment = { ...appointmentToUpdate, value: newValue };
    const success = await saveAppointments([updatedAppointment]);
    if (success) {
        showToast('Valor da consulta atualizado!', 'success');
        setSelectedAppointment(updatedAppointment); // Update the state for the modal
    }
  };


  const handleDeleteFromDetail = async (appointmentId: string) => {
    const success = await removeAppointment(appointmentId);
    if (success) {
      setIsDetailModalOpen(false);
    }
  };

  const handleSaveForm = async (appointmentData: Appointment): Promise<boolean> => {
    const appointmentsToSave = generateRecurrences(appointmentData);
    const success = await saveAppointments(appointmentsToSave);
    if (success) {
      setIsFormModalOpen(false);
    }
    return success;
  };

  const handleDeleteFromForm = async (appointmentId: string, seriesId?: string): Promise<boolean> => {
      if (!selectedAppointment) return false;
      const success = await removeAppointment(appointmentId, seriesId, selectedAppointment.startTime);
      if(success) {
        setIsFormModalOpen(false);
      }
      return success;
  };
  
  const getHeaderTitle = () => {
      if (viewMode === 'week') {
          return startOfWeek(currentDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      }
      return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  const renderGrid = (cols: any[], colRenderer: (col: any, colIdx: number) => React.ReactNode) => (
     <div className={`grid grid-cols-[auto_repeat(${cols.length},minmax(0,1fr))]`}>
        {/* Body */}
        <div className="relative col-start-1 col-end-2 row-start-1 row-end-auto">
            {hours.map(hour => <div key={hour} className="h-[60px] text-right pr-2 -mt-2.5 relative"><span className="absolute right-2 text-xs text-slate-400">{hour}:00</span></div>)}
        </div>
        {cols.map(colRenderer)}
    </div>
  );

  const renderWeekView = () => renderGrid(weekDays, (day, dayIdx) => {
    const dayAppointments = appointments.filter(app => app.startTime.toDateString() === day.toDateString());
    return (
        <div key={day.toISOString()} className="relative border-l border-slate-200">
            {hours.map((hour) => <div key={hour} onClick={() => handleOpenFormToCreate(new Date(day.setHours(hour,0,0,0)))} className="h-[60px] border-t border-slate-200 hover:bg-sky-50/50 cursor-pointer"></div>)}
            {dayAppointments.map(app => <AppointmentCard key={app.id} appointment={app} therapists={therapists} onSelect={() => handleSelectAppointment(app)}/>)}
        </div>
    );
  });

  const renderDayView = () => renderGrid(therapists, (therapist, therapistIdx) => {
    const dayAppointments = appointments.filter(app => app.startTime.toDateString() === currentDate.toDateString() && app.therapistId === therapist.id);
    return (
        <div key={therapist.id} className="relative border-l border-slate-200">
            {hours.map((hour) => <div key={hour} onClick={() => handleOpenFormToCreate(new Date(currentDate.setHours(hour,0,0,0)), therapist.id)} className="h-[60px] border-t border-slate-200 hover:bg-sky-50/50 cursor-pointer"></div>)}
            {dayAppointments.map(app => <AppointmentCard key={app.id} appointment={app} therapists={therapists} onSelect={() => handleSelectAppointment(app)}/>)}
        </div>
    );
  });
  
  const renderHeader = () => {
      const cols = viewMode === 'week' ? weekDays : therapists;

      return (
         <div className={`grid grid-cols-[auto_repeat(${cols.length},minmax(0,1fr))]`}>
            <div className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center justify-center"><Clock className="w-4 h-4" /></div>
            {viewMode === 'week' ?
                weekDays.map((day: Date) => (
                    <div key={day.toISOString()} className="p-4 text-center border-l border-slate-200">
                        <p className="text-xs font-medium text-slate-500 uppercase">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                        <p className="text-2xl font-bold text-slate-800">{day.getDate()}</p>
                    </div>
                )) :
                therapists.map((therapist: Therapist) => (
                    <div key={therapist.id} className="p-4 text-center border-l border-slate-200">
                        <p className={`font-bold text-sm text-${therapist.color}-600`}>{therapist.name}</p>
                    </div>
                ))
            }
        </div>
      );
  }

  return (
    <>
      <PageHeader title="Agenda" subtitle="Visualize e gerencie suas consultas.">
        <div className="flex items-center rounded-lg bg-white p-1 border border-slate-200 shadow-sm">
          <button onClick={() => changeDate(-1)} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md"><ChevronLeft className="h-5 w-5" /></button>
          <h3 className="text-sm font-semibold text-slate-700 px-4 text-center w-52">{getHeaderTitle()}</h3>
          <button onClick={() => changeDate(1)} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="flex items-center rounded-lg bg-white p-1 border border-slate-200 shadow-sm ml-2">
            <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${viewMode === 'day' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Users className="w-4 h-4 inline mr-2"/>Dia</button>
            <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${viewMode === 'week' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Calendar className="w-4 h-4 inline mr-2"/>Semana</button>
        </div>
        <button onClick={() => handleOpenFormToCreate()} className="ml-4 inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600"><Plus className="-ml-1 mr-2 h-5 w-5"/>Agendar</button>
      </PageHeader>
      
      {isDetailModalOpen && (
        <AppointmentDetailModal
            appointment={selectedAppointment}
            patient={patients.find(p => p.id === selectedAppointment?.patientId)}
            therapist={therapists.find(t => t.id === selectedAppointment?.therapistId)}
            onClose={() => setIsDetailModalOpen(false)}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteFromDetail}
            onStatusChange={handleStatusChange}
            onPaymentStatusChange={handlePaymentStatusChange}
            onPackagePayment={handlePackagePayment}
            onUpdateValue={handleUpdateAppointmentValue}
        />
      )}

      <AppointmentFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveForm}
        onDelete={handleDeleteFromForm}
        appointmentToEdit={selectedAppointment}
        initialData={modalInitialData}
        patients={patients}
        therapists={therapists}
        allAppointments={appointments}
      />

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {renderHeader()}
        {isLoading ? (
             <div className="relative h-[calc(12*60px)]">
                <Skeleton className="w-full h-full" />
             </div>
        ) : error ? (
            <div className="text-center p-10 text-red-500">{error.message}</div>
        ) : (
            <div className={`relative h-[calc(12*60px)]`}>
                {viewMode === 'week' ? renderWeekView() : renderDayView()}
            </div>
        )}
      </div>
    </>
  );
};

export default AgendaPage;