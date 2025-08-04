import { useState, ReactNode } from 'react';
import { useDragDrop } from './DragDropProvider';

interface DropZoneProps {
  children: ReactNode;
  onDrop: (startTime: Date, endTime: Date) => void;
  getTimeFromPosition: (y: number) => Date;
  className?: string;
  date: Date;
}

const DropZone = ({ 
  children, 
  onDrop, 
  getTimeFromPosition, 
  className = '',
  date 
}: DropZoneProps) => {
  const { isDragging, draggedAppointment, onDrop: performDrop } = useDragDrop();
  const [isHovering, setIsHovering] = useState(false);
  const [dropPreview, setDropPreview] = useState<{
    top: number;
    height: number;
    visible: boolean;
  }>({ top: 0, height: 0, visible: false });

  const handleDragEnter = (event: React.DragEvent) => {
    if (!isDragging || !draggedAppointment) return;
    
    event.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    if (!isDragging || !draggedAppointment) return;
    
    // Only hide if leaving the dropzone entirely
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsHovering(false);
      setDropPreview(prev => ({ ...prev, visible: false }));
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (!isDragging || !draggedAppointment) return;
    
    event.preventDefault();
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const y = event.clientY - rect.top;
    
    const startTime = getTimeFromPosition(y);
    const duration = draggedAppointment.endTime.getTime() - draggedAppointment.startTime.getTime();
    const endTime = new Date(startTime.getTime() + duration);
    
    // Snap to 15-minute intervals
    const snapToInterval = (time: Date) => {
      const minutes = time.getMinutes();
      const snappedMinutes = Math.round(minutes / 15) * 15;
      const snappedTime = new Date(time);
      snappedTime.setMinutes(snappedMinutes, 0, 0);
      return snappedTime;
    };
    
    const snappedStartTime = snapToInterval(startTime);
    const snappedEndTime = new Date(snappedStartTime.getTime() + duration);
    
    // Calculate preview position
    const cellHeight = 64; // Should match the calendar cell height
    const startHour = snappedStartTime.getHours();
    const startMinutes = snappedStartTime.getMinutes();
    const appointmentDuration = (snappedEndTime.getTime() - snappedStartTime.getTime()) / (1000 * 60);
    
    const top = ((startHour - 7) * cellHeight) + (startMinutes * cellHeight / 60);
    const height = (appointmentDuration * cellHeight) / 60;
    
    setDropPreview({
      top,
      height,
      visible: true
    });
  };

  const handleDrop = (event: React.DragEvent) => {
    if (!isDragging || !draggedAppointment) return;
    
    event.preventDefault();
    setIsHovering(false);
    setDropPreview(prev => ({ ...prev, visible: false }));
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const y = event.clientY - rect.top;
    
    const startTime = getTimeFromPosition(y);
    const duration = draggedAppointment.endTime.getTime() - draggedAppointment.startTime.getTime();
    const endTime = new Date(startTime.getTime() + duration);
    
    // Snap to 15-minute intervals
    const snapToInterval = (time: Date) => {
      const minutes = time.getMinutes();
      const snappedMinutes = Math.round(minutes / 15) * 15;
      const snappedTime = new Date(time);
      snappedTime.setMinutes(snappedMinutes, 0, 0);
      return snappedTime;
    };
    
    const snappedStartTime = snapToInterval(startTime);
    // Set the correct date
    snappedStartTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    
    const snappedEndTime = new Date(snappedStartTime.getTime() + duration);
    
    // Validate the drop
    if (snappedStartTime.getHours() >= 7 && snappedEndTime.getHours() <= 19) {
      performDrop(draggedAppointment, snappedStartTime, snappedEndTime);
    }
  };

  // Handle mouse events for non-drag API drops
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !draggedAppointment) return;
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const y = event.clientY - rect.top;
    
    const startTime = getTimeFromPosition(y);
    const duration = draggedAppointment.endTime.getTime() - draggedAppointment.startTime.getTime();
    
    // Calculate preview position
    const cellHeight = 64;
    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const appointmentDuration = duration / (1000 * 60);
    
    const top = ((startHour - 7) * cellHeight) + (startMinutes * cellHeight / 60);
    const height = (appointmentDuration * cellHeight) / 60;
    
    setDropPreview({
      top,
      height,
      visible: true
    });
    
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setDropPreview(prev => ({ ...prev, visible: false }));
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (!isDragging || !draggedAppointment) return;
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const y = event.clientY - rect.top;
    
    const startTime = getTimeFromPosition(y);
    const duration = draggedAppointment.endTime.getTime() - draggedAppointment.startTime.getTime();
    const endTime = new Date(startTime.getTime() + duration);
    
    // Snap to 15-minute intervals
    const snapToInterval = (time: Date) => {
      const minutes = time.getMinutes();
      const snappedMinutes = Math.round(minutes / 15) * 15;
      const snappedTime = new Date(time);
      snappedTime.setMinutes(snappedMinutes, 0, 0);
      return snappedTime;
    };
    
    const snappedStartTime = snapToInterval(startTime);
    snappedStartTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    
    const snappedEndTime = new Date(snappedStartTime.getTime() + duration);
    
    // Validate the drop
    if (snappedStartTime.getHours() >= 7 && snappedEndTime.getHours() <= 19) {
      performDrop(draggedAppointment, snappedStartTime, snappedEndTime);
    }
    
    setIsHovering(false);
    setDropPreview(prev => ({ ...prev, visible: false }));
  };

  return (
    <div
      className={`
        relative
        ${className}
        ${isHovering && isDragging ? 'bg-blue-50 border-blue-200' : ''}
        transition-all duration-200
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
    >
      {children}
      
      {/* Drop preview */}
      {dropPreview.visible && isDragging && (
        <div
          className="absolute left-1 right-1 bg-blue-200 border-2 border-dashed border-blue-400 rounded-lg opacity-75 flex items-center justify-center z-20"
          style={{
            top: `${dropPreview.top}px`,
            height: `${dropPreview.height}px`,
          }}
        >
          <div className="text-blue-600 text-sm font-medium text-center px-2">
            Soltar aqui
          </div>
        </div>
      )}
      
      {/* Visual feedback overlay */}
      {isHovering && isDragging && (
        <div className="absolute inset-0 bg-blue-100/30 border-2 border-dashed border-blue-300 rounded-lg pointer-events-none z-10" />
      )}
    </div>
  );
};

export default DropZone;