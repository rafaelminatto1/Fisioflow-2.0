import { Appointment, Therapist } from '@/types';
import AppointmentCard from '@/components/AppointmentCard';
import { useDragDrop } from './DragDropProvider';

interface DraggableAppointmentProps {
  appointment: Appointment;
  therapists: Therapist[];
  onSelect: () => void;
  onResize?: (appointment: Appointment, newStartTime: Date, newEndTime: Date) => void;
}

const DraggableAppointment = ({ 
  appointment, 
  therapists, 
  onSelect,
  onResize 
}: DraggableAppointmentProps) => {
  const { startDrag, isDragging, draggedAppointment } = useDragDrop();

  const isBeingDragged = isDragging && draggedAppointment?.id === appointment.id;

  const handleMouseDown = (event: React.MouseEvent) => {
    // Only start drag if not clicking on resize handles
    const target = event.target as HTMLElement;
    if (target.classList.contains('resize-handle') || target.closest('.resize-handle')) {
      return;
    }

    event.preventDefault();
    startDrag(appointment, event);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`
        ${isBeingDragged ? 'opacity-30' : 'opacity-100'}
        transition-opacity duration-200
      `}
      style={{
        cursor: isBeingDragged ? 'grabbing' : 'grab'
      }}
    >
      <AppointmentCard
        appointment={appointment}
        therapists={therapists}
        onSelect={onSelect}
        isDragging={isBeingDragged}
        showTooltip={!isDragging}
      />
      
      {/* Resize handles */}
      {!isBeingDragged && onResize && (
        <>
          {/* Top resize handle */}
          <div
            className="resize-handle absolute top-0 left-0 right-0 h-2 cursor-n-resize opacity-0 hover:opacity-100 bg-blue-400/30 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          
          {/* Bottom resize handle */}
          <div
            className="resize-handle absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 hover:opacity-100 bg-blue-400/30 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
        </>
      )}
    </div>
  );

  function handleResizeStart(event: React.MouseEvent, direction: 'top' | 'bottom') {
    event.preventDefault();
    event.stopPropagation();

    const startY = event.clientY;
    const originalStartTime = new Date(appointment.startTime);
    const originalEndTime = new Date(appointment.endTime);

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const minutesDelta = Math.round(deltaY / 2); // Adjust sensitivity

      let newStartTime = new Date(originalStartTime);
      let newEndTime = new Date(originalEndTime);

      if (direction === 'top') {
        newStartTime = new Date(originalStartTime.getTime() + (minutesDelta * 60000));
        // Ensure minimum duration of 15 minutes
        if (newEndTime.getTime() - newStartTime.getTime() < 15 * 60000) {
          newStartTime = new Date(newEndTime.getTime() - 15 * 60000);
        }
      } else {
        newEndTime = new Date(originalEndTime.getTime() + (minutesDelta * 60000));
        // Ensure minimum duration of 15 minutes
        if (newEndTime.getTime() - newStartTime.getTime() < 15 * 60000) {
          newEndTime = new Date(newStartTime.getTime() + 15 * 60000);
        }
      }

      // Snap to 15-minute intervals
      const snapToInterval = (date: Date) => {
        const minutes = date.getMinutes();
        const snappedMinutes = Math.round(minutes / 15) * 15;
        const snappedDate = new Date(date);
        snappedDate.setMinutes(snappedMinutes, 0, 0);
        return snappedDate;
      };

      newStartTime = snapToInterval(newStartTime);
      newEndTime = snapToInterval(newEndTime);

      if (onResize) {
        onResize(appointment, newStartTime, newEndTime);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
};

export default DraggableAppointment;