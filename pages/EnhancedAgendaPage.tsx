import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Users, Calendar, Grid3X3, BarChart3, Filter } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Appointment, Patient, Therapist, AppointmentStatus } from '../types';
import AppointmentFormModal from '../components/AppointmentFormModal';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import EnhancedAppointmentCard from '../components/calendar/EnhancedAppointmentCard';
import MonthView from '../components/calendar/MonthView';
import DateNavigator from '../components/calendar/DateNavigator';
import QuickCreateModal from '../components/calendar/QuickCreateModal';
import FilterPanel, { FilterOptions } from '../components/calendar/FilterPanel';
import ContextMenu, { useContextMenu } from '../components/calendar/ContextMenu';
import AvailabilityIndicator from '../components/calendar/AvailabilityIndicator';
import Skeleton from '../components/ui/Skeleton';
import { useAppointments } from '../hooks/useAppointments';
import { usePatients } from '../hooks/usePatients';
import { useTherapists } from '../hooks/useTherapists';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useAppointmentResize } from '../hooks/useAppointmentResize';
import { generateRecurrences } from '../services/scheduling/recurrenceService';
import { useToast } from '../contexts/ToastContext';

const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM (20:00)

type ViewMode = 'day' | 'week' | 'month';

const EnhancedAgendaPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showAvailabilityIndicator, setShowAvailabilityIndicator] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [modalInitialData, setModalInitialData] = useState<{ date: Date, therapistId?: string } | undefined>(undefined);

  const { appointments, isLoading: isLoadingAppointments, error: errorAppointments, saveAppointments, removeAppointment } = useAppointments();
  const { patients, isLoading: isLoadingPatients, error: errorPatients } = usePatients();
  const { therapists, isLoading: isLoadingTherapists, error: errorTherapists } = useTherapists();
  const { showToast } = useToast();

  const isLoading = isLoadingAppointments || isLoadingPatients || isLoadingTherapists;
  const error = errorAppointments || errorPatients || errorTherapists;

  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();

  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    therapists: [],
    types: [],
    statuses: [],
    dateRange: { start: null, end: null },
    paymentStatus: [],
    showRecurring: null
  });

  // Filter appointments based on current filters
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.patientName.toLowerCase().includes(searchTerm) ||
        apt.title?.toLowerCase().includes(searchTerm) ||
        apt.type.toLowerCase().includes(searchTerm) ||
        therapists.find(t => t.id === apt.therapistId)?.name.toLowerCase().includes(searchTerm)
      );
    }

    // Therapist filter
    if (filters.therapists.length > 0) {
      filtered = filtered.filter(apt => filters.therapists.includes(apt.therapistId));
    }

    // Type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(apt => filters.types.includes(apt.type as any));
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(apt => filters.statuses.includes(apt.status));
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(apt => {
        const aptDate = apt.startTime;
        if (filters.dateRange.start && aptDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && aptDate > filters.dateRange.end) return false;
        return true;
      });
    }

    // Payment status filter
    if (filters.paymentStatus.length > 0) {
      filtered = filtered.filter(apt => apt.paymentStatus && filters.paymentStatus.includes(apt.paymentStatus));
    }

    // Recurring filter
    if (filters.showRecurring !== null) {
      filtered = filtered.filter(apt => 
        filters.showRecurring ? !!apt.seriesId : !apt.seriesId
      );
    }

    return filtered;
  }, [appointments, filters, therapists]);

  // Drag and drop functionality
  const {
    dragState,
    handlers: dragHandlers,
    DragPreview
  } = useDragAndDrop({
    appointments: filteredAppointments,
    onAppointmentUpdate: async (appointment) => {
      const success = await saveAppointments([appointment]);
      return success;
    },
    onConflictDetected: (conflicts) => {
      showToast(`Conflito detectado com ${conflicts.length} consulta${conflicts.length > 1 ? 's' : ''}. A operação foi cancelada.`, 'error');
    }
  });

  // Resize functionality
  const {
    resizeState,
    handlers: resizeHandlers,
    getResizeHandleProps,
    getAppointmentProps
  } = useAppointmentResize({
    appointments: filteredAppointments,
    onAppointmentUpdate: async (appointment) => {
      const success = await saveAppointments([appointment]);
      return success;
    },
    onConflictDetected: (conflicts) => {
      showToast(`Conflito detectado com ${conflicts.length} consulta${conflicts.length > 1 ? 's' : ''}. Redimensionamento cancelado.`, 'error');
    }
  });

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
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (amount * 7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + amount);
    } else {
      newDate.setDate(newDate.getDate() + amount);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const setSpecificDate = (date: Date) => {
    setCurrentDate(date);
  };

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

  const handleOpenQuickCreate = (date?: Date, therapistId?: string) => {
    setModalInitialData({ date: date || new Date(), therapistId });
    setIsQuickCreateOpen(true);
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

  const handleSaveQuickCreate = async (appointmentData: Partial<Appointment>): Promise<boolean> => {
    const fullAppointment = {
      id: `apt_${Date.now()}`,
      ...appointmentData
    } as Appointment;
    
    const success = await saveAppointments([fullAppointment]);
    if (success) {
      setIsQuickCreateOpen(false);
    }
    return success;
  };

  const handleDuplicateAppointment = (appointment: Appointment) => {
    const newDate = new Date(appointment.startTime);
    newDate.setDate(newDate.getDate() + 1); // Next day by default
    
    setModalInitialData({ 
      date: newDate, 
      therapistId: appointment.therapistId 
    });
    setSelectedAppointment({
      ...appointment,
      id: `apt_${Date.now()}`,
      startTime: newDate,
      endTime: new Date(newDate.getTime() + (appointment.endTime.getTime() - appointment.startTime.getTime()))
    });
    setIsFormModalOpen(true);
  };

  // Context menu handlers
  const handleContextMenuEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsFormModalOpen(true);
  };

  const handleContextMenuDelete = async (appointmentId: string) => {
    await removeAppointment(appointmentId);
  };

  const handleContextMenuStatusChange = async (appointment: Appointment, status: AppointmentStatus) => {
    await handleStatusChange(appointment, status);
  };

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
    const dayAppointments = filteredAppointments.filter(app => app.startTime.toDateString() === day.toDateString());
    const isToday = day.toDateString() === new Date().toDateString();
    
    return (
      <div 
        key={day.toISOString()} 
        className={`relative border-r border-slate-200 ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}
        onDragOver={(e) => dragHandlers.onDragOver(e, day)}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={() => dragHandlers.onDrop(day)}
      >
        {/* Hour slots */}
        {hours.map((hour) => (
          <div 
            key={hour} 
            onClick={() => {
              const newDate = new Date(day);
              newDate.setHours(hour, 0, 0, 0);
              handleOpenQuickCreate(newDate);
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
            const cellHeight = window.innerWidth < 640 ? 48 : 64;
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
          <EnhancedAppointmentCard 
            key={app.id} 
            appointment={app} 
            therapists={therapists} 
            onSelect={() => handleSelectAppointment(app)}
            isDragging={dragState.draggedAppointment?.id === app.id}
            isResizing={resizeState.resizingAppointment?.id === app.id}
            enableDragAndDrop={true}
            enableResize={true}
            onDragStart={dragHandlers.onDragStart}
            onResizeStart={resizeHandlers.onResizeStart}
            resizeHandleProps={{
              top: getResizeHandleProps(app, 'top'),
              bottom: getResizeHandleProps(app, 'bottom')
            }}
            {...getAppointmentProps(app)}
            onContextMenu={(e) => openContextMenu(e, app)}
          />
        ))}
      </div>
    );
  });

  const renderDayView = () => renderGrid(therapists, (therapist, therapistIdx) => {
    const dayAppointments = filteredAppointments.filter(app => 
      app.startTime.toDateString() === currentDate.toDateString() && 
      app.therapistId === therapist.id
    );
    
    return (
      <div 
        key={therapist.id} 
        className="relative border-r border-slate-200 bg-white"
        onDragOver={(e) => dragHandlers.onDragOver(e, currentDate, therapist.id)}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={() => dragHandlers.onDrop(currentDate, therapist.id)}
      >
        {/* Hour slots */}
        {hours.map((hour) => (
          <div 
            key={hour} 
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setHours(hour, 0, 0, 0);
              handleOpenQuickCreate(newDate, therapist.id);
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
            const cellHeight = window.innerWidth < 640 ? 48 : 64;
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
          <EnhancedAppointmentCard 
            key={app.id} 
            appointment={app} 
            therapists={therapists} 
            onSelect={() => handleSelectAppointment(app)}
            isDragging={dragState.draggedAppointment?.id === app.id}
            isResizing={resizeState.resizingAppointment?.id === app.id}
            enableDragAndDrop={true}
            enableResize={true}
            onDragStart={dragHandlers.onDragStart}
            onResizeStart={resizeHandlers.onResizeStart}
            resizeHandleProps={{
              top: getResizeHandleProps(app, 'top'),
              bottom: getResizeHandleProps(app, 'bottom')
            }}
            {...getAppointmentProps(app)}
            onContextMenu={(e) => openContextMenu(e, app)}
          />
        ))}
      </div>
    );
  });
  
  const renderHeader = () => {
    const cols = viewMode === 'week' ? weekDays : therapists;

    return (
      <div className={`grid grid-cols-[60px_repeat(${cols.length},minmax(0,1fr))] sm:grid-cols-[80px_repeat(${cols.length},minmax(0,1fr))] gap-0 bg-white border-b border-slate-200`}>
        <div className="px-2 sm:px-4 py-3 bg-slate-50 border-r border-slate-200 flex items-center justify-center">
          <div className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
        </div>
        
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
  };

  // Create suggestions for quick create
  const quickCreateSuggestions = useMemo(() => {
    const recentPatients = patients
      .filter(p => appointments.some(a => a.patientId === p.id))
      .slice(0, 5);
    
    const appointmentTypes = appointments.reduce((acc, apt) => {
      acc[apt.type] = (acc[apt.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const frequentTypes = Object.entries(appointmentTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    return {
      recentPatients,
      frequentAppointmentTypes: frequentTypes,
      suggestedTimes: [] // Could add logic for suggesting optimal times
    };
  }, [patients, appointments]);

  return (
    <>
      <PageHeader title="Agenda Avançada" subtitle="Visualize e gerencie suas consultas com funcionalidades avançadas.">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Date navigation */}
          <DateNavigator
            currentDate={currentDate}
            viewMode={viewMode}
            onDateChange={changeDate}
            onDateSet={setSpecificDate}
            onTodayClick={goToToday}
          />
          
          {/* View mode toggle */}
          <div className="flex items-center rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => setViewMode('day')} 
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                viewMode === 'day' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2"/>
              <span className="hidden sm:inline">Dia</span>
            </button>
            <button 
              onClick={() => setViewMode('week')} 
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                viewMode === 'week' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2"/>
              <span className="hidden sm:inline">Semana</span>
            </button>
            <button 
              onClick={() => setViewMode('month')} 
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                viewMode === 'month' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Grid3X3 className="w-4 h-4 inline mr-2"/>
              <span className="hidden sm:inline">Mês</span>
            </button>
          </div>

          {/* Filter panel */}
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            therapists={therapists}
            appointments={appointments}
            isVisible={showFilterPanel}
            onToggleVisibility={() => setShowFilterPanel(!showFilterPanel)}
          />

          {/* Additional controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAvailabilityIndicator(!showAvailabilityIndicator)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                showAvailabilityIndicator
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
              title="Mostrar/ocultar indicador de disponibilidade"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            <button 
              onClick={() => handleOpenFormToCreate()} 
              className="inline-flex items-center justify-center rounded-xl border border-transparent bg-blue-500 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-600 transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2"/>
              <span className="hidden sm:inline">Agendar</span>
              <span className="sm:hidden">Nova</span>
            </button>
          </div>
        </div>
      </PageHeader>

      {/* Availability Indicator */}
      {showAvailabilityIndicator && (
        <div className="mb-6">
          <AvailabilityIndicator
            date={currentDate}
            appointments={filteredAppointments}
            therapists={therapists}
            viewMode={viewMode}
            showHeatmap={true}
            showConflicts={true}
            showBlockedTimes={true}
          />
        </div>
      )}

      {/* Modals */}
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
          onPackagePayment={async (appointment) => {
            // Implementation for package payment
          }}
          onUpdateValue={async (appointmentId: string, newValue: number) => {
            const appointment = appointments.find(a => a.id === appointmentId);
            if (appointment) {
              const updated = { ...appointment, value: newValue };
              await saveAppointments([updated]);
            }
          }}
        />
      )}

      <AppointmentFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveForm}
        onDelete={async (appointmentId: string, seriesId?: string) => {
          const success = await removeAppointment(appointmentId, seriesId);
          if (success) setIsFormModalOpen(false);
          return success;
        }}
        appointmentToEdit={selectedAppointment}
        initialData={modalInitialData}
        patients={patients}
        therapists={therapists}
        allAppointments={appointments}
      />

      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSave={handleSaveQuickCreate}
        initialDate={modalInitialData?.date}
        initialTherapistId={modalInitialData?.therapistId}
        patients={patients}
        therapists={therapists}
        suggestions={quickCreateSuggestions}
      />

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        appointment={contextMenu.appointment}
        onClose={closeContextMenu}
        onEdit={handleContextMenuEdit}
        onDelete={handleContextMenuDelete}
        onStatusChange={handleContextMenuStatusChange}
        onDuplicate={handleDuplicateAppointment}
      />

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
        {viewMode === 'month' ? (
          <MonthView
            currentDate={currentDate}
            appointments={filteredAppointments}
            therapists={therapists}
            onDateSelect={setCurrentDate}
            onAppointmentSelect={handleSelectAppointment}
            onDateChange={changeDate}
            onCreateAppointment={handleOpenQuickCreate}
          />
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Drag Preview */}
      {DragPreview}
    </>
  );
};

export default EnhancedAgendaPage;