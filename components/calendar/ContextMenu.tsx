import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Calendar,
  Clock,
  DollarSign,
  User,
  Phone,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../../types';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  appointment: Appointment | null;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
  onDuplicate: (appointment: Appointment) => void;
  onViewPatient?: (patientId: string) => void;
  onCall?: (patientId: string) => void;
  onAddNote?: (appointmentId: string) => void;
  allowedActions?: string[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  appointment,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  onViewPatient,
  onCall,
  onAddNote,
  allowedActions = []
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState(position);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // Adjust horizontal position if menu would overflow
      if (position.x + rect.width > viewportWidth) {
        newX = position.x - rect.width;
      }

      // Adjust vertical position if menu would overflow
      if (position.y + rect.height > viewportHeight) {
        newY = position.y - rect.height;
      }

      // Ensure menu doesn't go off-screen
      newX = Math.max(8, Math.min(newX, viewportWidth - rect.width - 8));
      newY = Math.max(8, Math.min(newY, viewportHeight - rect.height - 8));

      setMenuPosition({ x: newX, y: newY });
    }
  }, [isOpen, position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !appointment) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const isActionAllowed = (action: string) => {
    return allowedActions.length === 0 || allowedActions.includes(action);
  };

  const menuItems = [
    // Primary actions
    {
      id: 'edit',
      label: 'Editar consulta',
      icon: <Edit3 className="w-4 h-4" />,
      action: () => handleAction(() => onEdit(appointment)),
      shortcut: 'E',
      className: 'text-blue-600 hover:bg-blue-50'
    },
    {
      id: 'duplicate',
      label: 'Duplicar consulta',
      icon: <Copy className="w-4 h-4" />,
      action: () => handleAction(() => onDuplicate(appointment)),
      shortcut: 'D',
      className: 'text-slate-600 hover:bg-slate-50'
    },

    // Separator
    { id: 'separator-1', type: 'separator' },

    // Status actions
    ...(appointment.status !== AppointmentStatus.Completed ? [{
      id: 'complete',
      label: 'Marcar como concluída',
      icon: <CheckCircle className="w-4 h-4" />,
      action: () => handleAction(() => onStatusChange(appointment, AppointmentStatus.Completed)),
      shortcut: 'C',
      className: 'text-green-600 hover:bg-green-50'
    }] : []),

    ...(appointment.status === AppointmentStatus.Scheduled ? [{
      id: 'cancel',
      label: 'Cancelar consulta',
      icon: <XCircle className="w-4 h-4" />,
      action: () => handleAction(() => onStatusChange(appointment, AppointmentStatus.Canceled)),
      shortcut: 'X',
      className: 'text-orange-600 hover:bg-orange-50'
    }] : []),

    // Separator
    { id: 'separator-2', type: 'separator' },

    // Patient actions
    ...(onViewPatient ? [{
      id: 'view-patient',
      label: 'Ver ficha do paciente',
      icon: <User className="w-4 h-4" />,
      action: () => handleAction(() => onViewPatient!(appointment.patientId)),
      shortcut: 'P',
      className: 'text-slate-600 hover:bg-slate-50'
    }] : []),

    ...(onCall ? [{
      id: 'call-patient',
      label: 'Ligar para paciente',
      icon: <Phone className="w-4 h-4" />,
      action: () => handleAction(() => onCall!(appointment.patientId)),
      shortcut: 'T',
      className: 'text-slate-600 hover:bg-slate-50'
    }] : []),

    // Additional actions
    ...(onAddNote ? [{
      id: 'add-note',
      label: 'Adicionar observação',
      icon: <FileText className="w-4 h-4" />,
      action: () => handleAction(() => onAddNote!(appointment.id)),
      shortcut: 'N',
      className: 'text-slate-600 hover:bg-slate-50'
    }] : []),

    // Separator
    { id: 'separator-3', type: 'separator' },

    // Destructive actions
    {
      id: 'delete',
      label: 'Excluir consulta',
      icon: <Trash2 className="w-4 h-4" />,
      action: () => handleAction(() => onDelete(appointment.id)),
      shortcut: 'Del',
      className: 'text-red-600 hover:bg-red-50',
      dangerous: true
    }
  ].filter(item => item.type === 'separator' || isActionAllowed(item.id));

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-[60] min-w-[220px] backdrop-blur-sm"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
        animation: 'contextMenuFadeIn 0.15s ease-out'
      }}
    >
      {/* Header with appointment info */}
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span className="text-xs font-medium text-slate-600 truncate">
              {appointment.patientName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {appointment.startTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          {appointment.value && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>R$ {appointment.value.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1">
        {menuItems.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <div 
                key={item.id} 
                className="h-px bg-slate-200 my-1 mx-2" 
              />
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`
                w-full text-left px-4 py-2 text-sm font-medium transition-all duration-150
                flex items-center justify-between gap-3 group
                ${item.className}
                ${item.dangerous ? 'hover:text-red-700' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-current opacity-70 group-hover:opacity-100 transition-opacity">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              
              {item.shortcut && (
                <span className="text-xs text-slate-400 group-hover:text-current transition-colors bg-slate-100 group-hover:bg-slate-200 px-1.5 py-0.5 rounded font-mono">
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer with additional info */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-xl">
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>
            {appointment.type}
          </span>
          <span className="flex items-center gap-1">
            <span className={`
              inline-block w-2 h-2 rounded-full
              ${appointment.status === AppointmentStatus.Scheduled ? 'bg-blue-400' :
                appointment.status === AppointmentStatus.Completed ? 'bg-green-400' :
                appointment.status === AppointmentStatus.Canceled ? 'bg-red-400' :
                'bg-orange-400'}
            `} />
            {appointment.status === AppointmentStatus.Scheduled ? 'Agendado' :
             appointment.status === AppointmentStatus.Completed ? 'Concluído' :
             appointment.status === AppointmentStatus.Canceled ? 'Cancelado' :
             'Falta'}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes contextMenuFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Hook for managing context menu state
export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    appointment: Appointment | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    appointment: null
  });

  const openContextMenu = (event: React.MouseEvent, appointment: Appointment) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      appointment
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      appointment: null
    });
  };

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu
  };
};

export default ContextMenu;