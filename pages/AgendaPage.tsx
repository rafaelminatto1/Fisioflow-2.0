

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

const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM (20:00)

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
     <div className={`grid grid-cols-[60px_repeat(${cols.length},minmax(0,1fr))] sm:grid-cols-[80px_repeat(${cols.length},minmax(0,1fr))] gap-0`}>
        {/* Time column */}
        <div className="relative bg-slate-50 border-r border-slate-200">
            {hours.map(hour => (
                <div key={hour} className="h-12 sm:h-16 flex items-center justify-end pr-2 sm:pr-3 border-b border-slate-100">
                    <span className="text-xs sm:text-sm font-medium text-slate-600">
                        {hour.toString().padStart(2, '0')}:00
                    </span>
                </div>
            ))}
        </div>
        {cols.map(colRenderer)}
    </div>
  );

  const renderWeekView = () => renderGrid(weekDays, (day, dayIdx) => {
    const dayAppointments = appointments.filter(app => app.startTime.toDateString() === day.toDateString());
    const isToday = day.toDateString() === new Date().toDateString();
    
    return (
        <div key={day.toISOString()} className={`relative border-r border-slate-200 ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
            {/* Hour slots */}
            {hours.map((hour) => (
                <div 
                    key={hour} 
                    onClick={() => {
                        const newDate = new Date(day);
                        newDate.setHours(hour, 0, 0, 0);
                        handleOpenFormToCreate(newDate);
                    }}
                    className="h-12 sm:h-16 border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition-colors relative group"
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                    </div>
                </div>
            ))}
            
            {/* Current time indicator for today */}
            {isToday && (() => {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinutes = now.getMinutes();
                
                if (currentHour >= hours[0] && currentHour <= hours[hours.length - 1]) {
                    const cellHeight = window.innerWidth < 640 ? 48 : 64; // sm breakpoint
                    const topPosition = ((currentHour - hours[0]) * cellHeight) + (currentMinutes * cellHeight / 60);
                    return (
                        <div 
                            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                            style={{ top: `${topPosition}px` }}
                        >
                            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                    );
                }
                return null;
            })()}
            
            {/* Appointments */}
            {dayAppointments.map(app => (
                <AppointmentCard 
                    key={app.id} 
                    appointment={app} 
                    therapists={therapists} 
                    onSelect={() => handleSelectAppointment(app)}
                />
            ))}
        </div>
    );
  });

  const renderDayView = () => renderGrid(therapists, (therapist, therapistIdx) => {
    const dayAppointments = appointments.filter(app => 
        app.startTime.toDateString() === currentDate.toDateString() && 
        app.therapistId === therapist.id
    );
    
    return (
        <div key={therapist.id} className="relative border-r border-slate-200 bg-white">
            {/* Hour slots */}
            {hours.map((hour) => (
                <div 
                    key={hour} 
                    onClick={() => {
                        const newDate = new Date(currentDate);
                        newDate.setHours(hour, 0, 0, 0);
                        handleOpenFormToCreate(newDate, therapist.id);
                    }}
                    className="h-12 sm:h-16 border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition-colors relative group"
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                    </div>
                </div>
            ))}
            
            {/* Current time indicator for today */}
            {currentDate.toDateString() === new Date().toDateString() && (() => {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinutes = now.getMinutes();
                
                if (currentHour >= hours[0] && currentHour <= hours[hours.length - 1]) {
                    const cellHeight = window.innerWidth < 640 ? 48 : 64; // sm breakpoint
                    const topPosition = ((currentHour - hours[0]) * cellHeight) + (currentMinutes * cellHeight / 60);
                    return (
                        <div 
                            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                            style={{ top: `${topPosition}px` }}
                        >
                            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                    );
                }
                return null;
            })()}
            
            {/* Appointments */}
            {dayAppointments.map(app => (
                <AppointmentCard 
                    key={app.id} 
                    appointment={app} 
                    therapists={therapists} 
                    onSelect={() => handleSelectAppointment(app)}
                />
            ))}
        </div>
    );
  });
  
  const renderHeader = () => {
      const cols = viewMode === 'week' ? weekDays : therapists;

      return (
         <div className={`grid grid-cols-[60px_repeat(${cols.length},minmax(0,1fr))] sm:grid-cols-[80px_repeat(${cols.length},minmax(0,1fr))] gap-0 bg-white border-b border-slate-200`}>
            {/* Time header */}
            <div className="px-2 sm:px-4 py-3 bg-slate-50 border-r border-slate-200 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
            </div>
            
            {/* Column headers */}
            {viewMode === 'week' ?
                weekDays.map((day: Date) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                        <div key={day.toISOString()} className={`px-2 sm:px-4 py-3 text-center border-r border-slate-200 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                                {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                            </p>
                            <p className={`text-lg sm:text-xl font-bold ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                                {day.getDate()}
                            </p>
                            {isToday && (
                                <div className="mt-1">
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                </div>
                            )}
                        </div>
                    );
                }) :
                therapists.map((therapist: Therapist) => (
                    <div key={therapist.id} className="px-2 sm:px-4 py-3 text-center border-r border-slate-200 bg-white">
                        <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-${therapist.color}-100`}>
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-${therapist.color}-500`}></div>
                            <p className={`font-semibold text-xs sm:text-sm text-${therapist.color}-700 truncate`}>
                                {therapist.name.split(' ')[0]}
                            </p>
                        </div>
                    </div>
                ))
            }
        </div>
      );
  }

  return (
    <>
      <PageHeader title="Agenda" subtitle="Visualize e gerencie suas consultas.">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          {/* Navigation controls */}
          <div className="flex items-center rounded-lg bg-white p-1 border border-slate-200 shadow-sm">
            <button onClick={() => changeDate(-1)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-semibold text-slate-700 px-4 text-center min-w-0 flex-1 sm:w-52">
              {getHeaderTitle()}
            </h3>
            <button onClick={() => changeDate(1)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg bg-white p-1 border border-slate-200 shadow-sm sm:ml-2">
            <button 
              onClick={() => setViewMode('day')} 
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'day' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1 sm:mr-2"/>
              <span className="hidden sm:inline">Dia</span>
            </button>
            <button 
              onClick={() => setViewMode('week')} 
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1 sm:mr-2"/>
              <span className="hidden sm:inline">Semana</span>
            </button>
          </div>
          
          {/* Add appointment button */}
          <button 
            onClick={() => handleOpenFormToCreate()} 
            className="sm:ml-4 inline-flex items-center justify-center rounded-lg border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5"/>
            <span className="hidden sm:inline">Agendar</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>
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
            <div className="relative h-[calc(14*48px)] sm:h-[calc(14*64px)] overflow-auto">
                {viewMode === 'week' ? renderWeekView() : renderDayView()}
            </div>
        )}
      </div>
    </>
  );
};

export default AgendaPage;