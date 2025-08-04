import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Appointment } from '@/types';

interface DragDropContextValue {
  draggedAppointment: Appointment | null;
  isDragging: boolean;
  dragPreview: {
    x: number;
    y: number;
    visible: boolean;
  };
  startDrag: (appointment: Appointment, event: React.MouseEvent) => void;
  updateDragPosition: (x: number, y: number) => void;
  endDrag: () => void;
  onDrop: (appointment: Appointment, newStartTime: Date, newEndTime: Date) => void;
  setOnDrop: (handler: (appointment: Appointment, newStartTime: Date, newEndTime: Date) => void) => void;
}

const DragDropContext = createContext<DragDropContextValue | null>(null);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

interface DragDropProviderProps {
  children: ReactNode;
}

export const DragDropProvider = ({ children }: DragDropProviderProps) => {
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [dragPreview, setDragPreview] = useState({
    x: 0,
    y: 0,
    visible: false
  });
  const [onDropHandler, setOnDropHandler] = useState<(appointment: Appointment, newStartTime: Date, newEndTime: Date) => void>(() => () => {});

  const startDrag = useCallback((appointment: Appointment, event: React.MouseEvent) => {
    setDraggedAppointment(appointment);
    setDragPreview({
      x: event.clientX,
      y: event.clientY,
      visible: true
    });

    // Add global mouse move and mouse up listeners
    const handleMouseMove = (e: MouseEvent) => {
      setDragPreview(prev => ({
        ...prev,
        x: e.clientX,
        y: e.clientY
      }));
    };

    const handleMouseUp = () => {
      endDrag();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const updateDragPosition = useCallback((x: number, y: number) => {
    setDragPreview(prev => ({
      ...prev,
      x,
      y
    }));
  }, []);

  const endDrag = useCallback(() => {
    setDraggedAppointment(null);
    setDragPreview(prev => ({
      ...prev,
      visible: false
    }));
  }, []);

  const onDrop = useCallback((appointment: Appointment, newStartTime: Date, newEndTime: Date) => {
    onDropHandler(appointment, newStartTime, newEndTime);
    endDrag();
  }, [onDropHandler, endDrag]);

  const setOnDrop = useCallback((handler: (appointment: Appointment, newStartTime: Date, newEndTime: Date) => void) => {
    setOnDropHandler(() => handler);
  }, []);

  const value: DragDropContextValue = {
    draggedAppointment,
    isDragging: draggedAppointment !== null,
    dragPreview,
    startDrag,
    updateDragPosition,
    endDrag,
    onDrop,
    setOnDrop
  };

  return (
    <DragDropContext.Provider value={value}>
      {children}
      
      {/* Drag preview */}
      {dragPreview.visible && draggedAppointment && (
        <div
          className="fixed pointer-events-none z-[1000] transition-none"
          style={{
            left: dragPreview.x - 100,
            top: dragPreview.y - 30,
            transform: 'rotate(2deg) scale(1.05)',
          }}
        >
          <div className="bg-white border-2 border-blue-400 rounded-lg shadow-2xl p-3 opacity-90 min-w-[200px]">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>{draggedAppointment.patientName}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {draggedAppointment.startTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })} - {draggedAppointment.endTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {draggedAppointment.type}
            </div>
          </div>
        </div>
      )}
    </DragDropContext.Provider>
  );
};

export default DragDropProvider;