import { useState, useCallback, useRef } from 'react';
import { Appointment } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ResizeState {
  isResizing: boolean;
  resizingAppointment: Appointment | null;
  resizeDirection: 'top' | 'bottom' | null;
  originalBounds: {
    startTime: Date;
    endTime: Date;
    height: number;
    top: number;
  } | null;
  previewBounds: {
    startTime: Date;
    endTime: Date;
    height: number;
    top: number;
  } | null;
  conflicts: Appointment[];
}

interface ResizeHandlers {
  onResizeStart: (
    appointment: Appointment, 
    direction: 'top' | 'bottom', 
    event: React.MouseEvent
  ) => void;
  onResizeEnd: () => void;
  onResizeCommit: () => Promise<boolean>;
  onResizeCancel: () => void;
}

interface UseAppointmentResizeProps {
  appointments: Appointment[];
  onAppointmentUpdate: (appointment: Appointment) => Promise<boolean>;
  onConflictDetected?: (conflicts: Appointment[]) => void;
  minDuration?: number; // in minutes
  maxDuration?: number; // in minutes
  snapToInterval?: number; // in minutes
}

export const useAppointmentResize = ({
  appointments,
  onAppointmentUpdate,
  onConflictDetected,
  minDuration = 15,
  maxDuration = 240,
  snapToInterval = 15
}: UseAppointmentResizeProps) => {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizingAppointment: null,
    resizeDirection: null,
    originalBounds: null,
    previewBounds: null,
    conflicts: []
  });

  const { showToast } = useToast();
  const resizeStartY = useRef<number>(0);
  const originalMouseY = useRef<number>(0);

  const getCellHeight = useCallback(() => {
    return window.innerWidth < 640 ? 48 : 64; // Responsive cell height
  }, []);

  const snapTimeToInterval = useCallback((time: Date): Date => {
    const snappedTime = new Date(time);
    const minutes = snappedTime.getMinutes();
    const snappedMinutes = Math.round(minutes / snapToInterval) * snapToInterval;
    snappedTime.setMinutes(snappedMinutes, 0, 0);
    return snappedTime;
  }, [snapToInterval]);

  const detectConflicts = useCallback((
    appointment: Appointment,
    newStartTime: Date,
    newEndTime: Date
  ): Appointment[] => {
    return appointments.filter(existing => {
      // Skip the appointment being resized
      if (existing.id === appointment.id) return false;
      
      // Only check conflicts with same therapist
      if (existing.therapistId !== appointment.therapistId) return false;
      
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

  const calculateResizedBounds = useCallback((
    appointment: Appointment,
    direction: 'top' | 'bottom',
    deltaY: number
  ) => {
    const cellHeight = getCellHeight();
    const timeChangeMs = (deltaY / cellHeight) * 60 * 60 * 1000; // Convert pixels to milliseconds
    
    let newStartTime = new Date(appointment.startTime);
    let newEndTime = new Date(appointment.endTime);
    
    if (direction === 'top') {
      // Resizing from top - change start time
      newStartTime = new Date(appointment.startTime.getTime() + timeChangeMs);
      newStartTime = snapTimeToInterval(newStartTime);
      
      // Ensure minimum duration
      const minEndTime = new Date(newStartTime.getTime() + minDuration * 60 * 1000);
      if (newEndTime < minEndTime) {
        newEndTime = minEndTime;
      }
      
      // Ensure we don't go before business hours (7 AM)
      const businessStart = new Date(newStartTime);
      businessStart.setHours(7, 0, 0, 0);
      if (newStartTime < businessStart) {
        newStartTime = businessStart;
      }
    } else {
      // Resizing from bottom - change end time
      newEndTime = new Date(appointment.endTime.getTime() + timeChangeMs);
      newEndTime = snapTimeToInterval(newEndTime);
      
      // Ensure minimum duration
      const minEndTime = new Date(newStartTime.getTime() + minDuration * 60 * 1000);
      if (newEndTime < minEndTime) {
        newEndTime = minEndTime;
      }
      
      // Ensure we don't go after business hours (8 PM)
      const businessEnd = new Date(newEndTime);
      businessEnd.setHours(20, 0, 0, 0);
      if (newEndTime > businessEnd) {
        newEndTime = businessEnd;
      }
    }
    
    // Ensure maximum duration
    const duration = (newEndTime.getTime() - newStartTime.getTime()) / (60 * 1000);
    if (duration > maxDuration) {
      if (direction === 'top') {
        newStartTime = new Date(newEndTime.getTime() - maxDuration * 60 * 1000);
      } else {
        newEndTime = new Date(newStartTime.getTime() + maxDuration * 60 * 1000);
      }
    }
    
    // Calculate visual properties
    const startHour = newStartTime.getHours();
    const startMinutes = newStartTime.getMinutes();
    const endHour = newEndTime.getHours();
    const endMinutes = newEndTime.getMinutes();
    
    const durationMinutes = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
    const top = ((startHour - 7) * cellHeight) + (startMinutes * cellHeight / 60);
    const height = (durationMinutes * cellHeight) / 60;
    
    return {
      startTime: newStartTime,
      endTime: newEndTime,
      height: Math.max(height, cellHeight * 0.5),
      top
    };
  }, [getCellHeight, snapTimeToInterval, minDuration, maxDuration]);

  const handlers: ResizeHandlers = {
    onResizeStart: useCallback((
      appointment: Appointment, 
      direction: 'top' | 'bottom', 
      event: React.MouseEvent
    ) => {
      event.stopPropagation();
      event.preventDefault();
      
      const cellHeight = getCellHeight();
      const startHour = appointment.startTime.getHours();
      const startMinutes = appointment.startTime.getMinutes();
      const endHour = appointment.endTime.getHours();
      const endMinutes = appointment.endTime.getMinutes();
      
      const durationMinutes = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
      const top = ((startHour - 7) * cellHeight) + (startMinutes * cellHeight / 60);
      const height = (durationMinutes * cellHeight) / 60;
      
      const originalBounds = {
        startTime: new Date(appointment.startTime),
        endTime: new Date(appointment.endTime),
        height,
        top
      };
      
      resizeStartY.current = event.clientY;
      originalMouseY.current = event.clientY;
      
      setResizeState({
        isResizing: true,
        resizingAppointment: appointment,
        resizeDirection: direction,
        originalBounds,
        previewBounds: originalBounds,
        conflicts: []
      });

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - resizeStartY.current;
        const newBounds = calculateResizedBounds(appointment, direction, deltaY);
        
        // Detect conflicts
        const conflicts = detectConflicts(appointment, newBounds.startTime, newBounds.endTime);
        
        setResizeState(prev => ({
          ...prev,
          previewBounds: newBounds,
          conflicts
        }));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, [getCellHeight, calculateResizedBounds, detectConflicts]),

    onResizeEnd: useCallback(() => {
      setResizeState({
        isResizing: false,
        resizingAppointment: null,
        resizeDirection: null,
        originalBounds: null,
        previewBounds: null,
        conflicts: []
      });
    }, []),

    onResizeCommit: useCallback(async () => {
      if (!resizeState.resizingAppointment || !resizeState.previewBounds) {
        handlers.onResizeEnd();
        return false;
      }

      const appointment = resizeState.resizingAppointment;
      const newBounds = resizeState.previewBounds;

      // Check for conflicts
      if (resizeState.conflicts.length > 0) {
        if (onConflictDetected) {
          onConflictDetected(resizeState.conflicts);
        } else {
          showToast(
            `Conflito detectado com ${resizeState.conflicts.length} consulta${resizeState.conflicts.length > 1 ? 's' : ''}. A operação foi cancelada.`,
            'error'
          );
        }
        handlers.onResizeEnd();
        return false;
      }

      // Validate duration
      const newDuration = (newBounds.endTime.getTime() - newBounds.startTime.getTime()) / (60 * 1000);
      if (newDuration < minDuration) {
        showToast(`A duração mínima da consulta é de ${minDuration} minutos.`, 'error');
        handlers.onResizeEnd();
        return false;
      }

      if (newDuration > maxDuration) {
        showToast(`A duração máxima da consulta é de ${maxDuration} minutos.`, 'error');
        handlers.onResizeEnd();
        return false;
      }

      // Update appointment
      const updatedAppointment: Appointment = {
        ...appointment,
        startTime: newBounds.startTime,
        endTime: newBounds.endTime,
        updatedAt: new Date()
      };

      try {
        const success = await onAppointmentUpdate(updatedAppointment);
        
        if (success) {
          const durationText = `${Math.round(newDuration)} minutos`;
          showToast(
            `Consulta redimensionada para ${durationText} (${newBounds.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${newBounds.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`,
            'success'
          );
          handlers.onResizeEnd();
          return true;
        } else {
          showToast('Erro ao redimensionar a consulta. Tente novamente.', 'error');
          handlers.onResizeEnd();
          return false;
        }
      } catch (error) {
        console.error('Error updating appointment:', error);
        showToast('Erro ao redimensionar a consulta. Tente novamente.', 'error');
        handlers.onResizeEnd();
        return false;
      }
    }, [resizeState, onAppointmentUpdate, onConflictDetected, minDuration, maxDuration, showToast]),

    onResizeCancel: useCallback(() => {
      handlers.onResizeEnd();
    }, [])
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!resizeState.isResizing) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        handlers.onResizeCommit();
        break;
      case 'Escape':
        event.preventDefault();
        handlers.onResizeCancel();
        break;
    }
  }, [resizeState.isResizing, handlers]);

  // Add keyboard event listeners
  React.useEffect(() => {
    if (resizeState.isResizing) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [resizeState.isResizing, handleKeyDown]);

  return {
    resizeState,
    handlers,
    isResizing: resizeState.isResizing,
    resizingAppointment: resizeState.resizingAppointment,
    previewBounds: resizeState.previewBounds,
    conflicts: resizeState.conflicts,
    
    // Helper functions for rendering
    getResizeHandleProps: useCallback((appointment: Appointment, direction: 'top' | 'bottom') => ({
      onMouseDown: (e: React.MouseEvent) => handlers.onResizeStart(appointment, direction, e),
      className: `
        absolute left-0 right-0 h-2 cursor-${direction === 'top' ? 'n' : 's'}-resize 
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        ${direction === 'top' ? 'top-0 -mt-1' : 'bottom-0 -mb-1'}
        bg-blue-500/50 hover:bg-blue-500/70
        ${direction === 'top' ? 'rounded-t-lg' : 'rounded-b-lg'}
      `,
      style: {
        zIndex: 15
      }
    }), [handlers]),

    getAppointmentProps: useCallback((appointment: Appointment) => {
      const isCurrentlyResizing = resizeState.resizingAppointment?.id === appointment.id;
      const bounds = isCurrentlyResizing ? resizeState.previewBounds : null;
      const hasConflicts = isCurrentlyResizing && resizeState.conflicts.length > 0;
      
      return {
        style: bounds ? {
          height: `${bounds.height}px`,
          top: `${bounds.top}px`,
          transition: 'none' // Disable transitions during resize
        } : undefined,
        className: isCurrentlyResizing ? `
          ring-2 ${hasConflicts ? 'ring-red-500' : 'ring-blue-500'} ring-opacity-50
          ${hasConflicts ? 'bg-red-50' : ''}
        ` : ''
      };
    }, [resizeState])
  };
};