import { useState, useCallback, useRef } from 'react';
import { Appointment } from '../types';
import { useToast } from '../contexts/ToastContext';

interface DragState {
  isDragging: boolean;
  draggedAppointment: Appointment | null;
  dragPreview: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  dropZone: {
    date: Date;
    therapistId?: string;
    time: { hour: number; minute: number };
  } | null;
  conflicts: Appointment[];
}

interface DragHandlers {
  onDragStart: (appointment: Appointment, event: React.MouseEvent) => void;
  onDragEnd: () => void;
  onDrop: (newDate: Date, newTherapistId?: string) => Promise<boolean>;
  onDragOver: (event: React.DragEvent, date: Date, therapistId?: string) => void;
  onDragLeave: () => void;
}

interface UseDragAndDropProps {
  appointments: Appointment[];
  onAppointmentUpdate: (appointment: Appointment) => Promise<boolean>;
  onConflictDetected?: (conflicts: Appointment[]) => void;
  validateDrop?: (appointment: Appointment, newDate: Date, newTherapistId?: string) => boolean;
}

export const useDragAndDrop = ({
  appointments,
  onAppointmentUpdate,
  onConflictDetected,
  validateDrop
}: UseDragAndDropProps) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedAppointment: null,
    dragPreview: null,
    dropZone: null,
    conflicts: []
  });

  const { showToast } = useToast();
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragThresholdReached = useRef(false);

  const detectConflicts = useCallback((
    appointment: Appointment,
    newStartTime: Date,
    newEndTime: Date,
    newTherapistId?: string
  ): Appointment[] => {
    const targetTherapistId = newTherapistId || appointment.therapistId;
    
    return appointments.filter(existing => {
      // Skip the appointment being moved
      if (existing.id === appointment.id) return false;
      
      // Only check conflicts with same therapist
      if (existing.therapistId !== targetTherapistId) return false;
      
      // Check if times overlap
      const existingStart = existing.startTime.getTime();
      const existingEnd = existing.endTime.getTime();
      const newStart = newStartTime.getTime();
      const newEnd = newEndTime.getTime();
      
      return (
        (newStart < existingEnd && newEnd > existingStart) ||
        (existingStart < newEnd && existingEnd > newStart)
      );
    });
  }, [appointments]);

  const calculateNewTimes = useCallback((
    originalStart: Date,
    originalEnd: Date,
    dropTime: { hour: number; minute: number },
    dropDate: Date
  ) => {
    const duration = originalEnd.getTime() - originalStart.getTime();
    
    const newStartTime = new Date(dropDate);
    newStartTime.setHours(dropTime.hour, dropTime.minute, 0, 0);
    
    const newEndTime = new Date(newStartTime.getTime() + duration);
    
    return { newStartTime, newEndTime };
  }, []);

  const getTimeFromPosition = useCallback((y: number, containerTop: number): { hour: number; minute: number } => {
    const cellHeight = window.innerWidth < 640 ? 48 : 64; // Responsive cell height
    const relativeY = y - containerTop;
    const hourIndex = Math.floor(relativeY / cellHeight);
    const minuteOffset = (relativeY % cellHeight) / cellHeight * 60;
    
    const hour = Math.max(7, Math.min(20, 7 + hourIndex)); // 7 AM to 8 PM
    const minute = Math.round(minuteOffset / 15) * 15; // Snap to 15-minute intervals
    
    return { hour, minute: Math.min(45, minute) };
  }, []);

  const handlers: DragHandlers = {
    onDragStart: useCallback((appointment: Appointment, event: React.MouseEvent) => {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      
      dragStartPos.current = { x: event.clientX, y: event.clientY };
      isDragThresholdReached.current = false;
      
      setDragState(prev => ({
        ...prev,
        draggedAppointment: appointment,
        dragPreview: {
          x: event.clientX,
          y: event.clientY,
          width: rect.width,
          height: rect.height
        }
      }));

      // Add global mouse move and up listeners
      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5 && !isDragThresholdReached.current) {
          isDragThresholdReached.current = true;
          setDragState(prev => ({
            ...prev,
            isDragging: true
          }));
        }
        
        if (isDragThresholdReached.current) {
          setDragState(prev => ({
            ...prev,
            dragPreview: prev.dragPreview ? {
              ...prev.dragPreview,
              x: e.clientX,
              y: e.clientY
            } : null
          }));
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        if (!isDragThresholdReached.current) {
          // It was just a click, not a drag
          handlers.onDragEnd();
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, []),

    onDragEnd: useCallback(() => {
      setDragState({
        isDragging: false,
        draggedAppointment: null,
        dragPreview: null,
        dropZone: null,
        conflicts: []
      });
      isDragThresholdReached.current = false;
    }, []),

    onDrop: useCallback(async (newDate: Date, newTherapistId?: string) => {
      if (!dragState.draggedAppointment || !dragState.dropZone) {
        handlers.onDragEnd();
        return false;
      }

      const appointment = dragState.draggedAppointment;
      const dropTime = dragState.dropZone.time;
      
      // Validate drop if validator is provided
      if (validateDrop && !validateDrop(appointment, newDate, newTherapistId)) {
        showToast('Não é possível mover a consulta para este horário', 'error');
        handlers.onDragEnd();
        return false;
      }

      const { newStartTime, newEndTime } = calculateNewTimes(
        appointment.startTime,
        appointment.endTime,
        dropTime,
        newDate
      );

      // Check for conflicts
      const conflicts = detectConflicts(appointment, newStartTime, newEndTime, newTherapistId);
      
      if (conflicts.length > 0) {
        if (onConflictDetected) {
          onConflictDetected(conflicts);
        } else {
          showToast(
            `Conflito detectado com ${conflicts.length} consulta${conflicts.length > 1 ? 's' : ''}. A operação foi cancelada.`,
            'error'
          );
        }
        handlers.onDragEnd();
        return false;
      }

      // Update appointment
      const updatedAppointment: Appointment = {
        ...appointment,
        startTime: newStartTime,
        endTime: newEndTime,
        therapistId: newTherapistId || appointment.therapistId,
        updatedAt: new Date()
      };

      try {
        const success = await onAppointmentUpdate(updatedAppointment);
        
        if (success) {
          showToast(
            `Consulta movida para ${newStartTime.toLocaleDateString('pt-BR')} às ${newStartTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
            'success'
          );
          handlers.onDragEnd();
          return true;
        } else {
          showToast('Erro ao mover a consulta. Tente novamente.', 'error');
          handlers.onDragEnd();
          return false;
        }
      } catch (error) {
        console.error('Error updating appointment:', error);
        showToast('Erro ao mover a consulta. Tente novamente.', 'error');
        handlers.onDragEnd();
        return false;
      }
    }, [dragState, calculateNewTimes, detectConflicts, onAppointmentUpdate, onConflictDetected, validateDrop, showToast]),

    onDragOver: useCallback((event: React.DragEvent, date: Date, therapistId?: string) => {
      if (!dragState.isDragging || !dragState.draggedAppointment) return;

      event.preventDefault();
      
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const time = getTimeFromPosition(event.clientY, rect.top);
      
      const { newStartTime, newEndTime } = calculateNewTimes(
        dragState.draggedAppointment.startTime,
        dragState.draggedAppointment.endTime,
        time,
        date
      );

      // Detect potential conflicts
      const conflicts = detectConflicts(
        dragState.draggedAppointment, 
        newStartTime, 
        newEndTime, 
        therapistId
      );

      setDragState(prev => ({
        ...prev,
        dropZone: { date, therapistId, time },
        conflicts
      }));
    }, [dragState.isDragging, dragState.draggedAppointment, getTimeFromPosition, calculateNewTimes, detectConflicts]),

    onDragLeave: useCallback(() => {
      setDragState(prev => ({
        ...prev,
        dropZone: null,
        conflicts: []
      }));
    }, [])
  };

  // Create drag preview component
  const DragPreview = dragState.dragPreview && dragState.draggedAppointment ? React.createElement('div', {
    style: {
      position: 'fixed',
      left: dragState.dragPreview.x - dragState.dragPreview.width / 2,
      top: dragState.dragPreview.y - 10,
      width: dragState.dragPreview.width,
      height: dragState.dragPreview.height,
      pointerEvents: 'none',
      zIndex: 1000,
      transform: 'rotate(2deg) scale(1.02)',
      transition: 'transform 0.2s ease-out'
    },
    className: "bg-white border-2 border-blue-400 rounded-xl shadow-2xl opacity-90 p-3"
  }, [
    React.createElement('div', {
      key: 'name',
      className: "text-sm font-semibold text-slate-800 truncate"
    }, dragState.draggedAppointment.patientName),
    React.createElement('div', {
      key: 'type',
      className: "text-xs text-slate-600 truncate"
    }, dragState.draggedAppointment.type),
    React.createElement('div', {
      key: 'time',
      className: "text-xs text-slate-500 truncate"
    }, `${dragState.draggedAppointment.startTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${dragState.draggedAppointment.endTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`)
  ]) : null;

  return {
    dragState,
    handlers,
    DragPreview,
    isDragging: dragState.isDragging,
    draggedAppointment: dragState.draggedAppointment,
    dropZone: dragState.dropZone,
    conflicts: dragState.conflicts
  };
};