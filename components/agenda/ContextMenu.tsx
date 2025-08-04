import { useState, useEffect, useRef } from 'react';
import { 
  Edit3, 
  Trash2, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  MessageSquare,
  DollarSign,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '@/types';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  appointment: Appointment | null;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  onDuplicate: (appointment: Appointment) => void;
  onChangeStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onViewPatient: (appointment: Appointment) => void;
  onAddNote: (appointment: Appointment) => void;
  onMarkPaid: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
}

const ContextMenu = ({
  isOpen,
  position,
  appointment,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onChangeStatus,
  onViewPatient,
  onAddNote,
  onMarkPaid,
  onReschedule
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let newX = position.x;
      let newY = position.y;

      // Adjust horizontal position if menu goes off screen
      if (position.x + rect.width > viewport.width) {
        newX = position.x - rect.width;
      }

      // Adjust vertical position if menu goes off screen
      if (position.y + rect.height > viewport.height) {
        newY = position.y - rect.height;
      }

      // Ensure menu stays within viewport
      newX = Math.max(0, Math.min(newX, viewport.width - rect.width));
      newY = Math.max(0, Math.min(newY, viewport.height - rect.height));

      setAdjustedPosition({ x: newX, y: newY });
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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !appointment) return null;

  const getStatusActions = (): ContextMenuAction[] => {
    const actions: ContextMenuAction[] = [];
    
    if (appointment.status !== AppointmentStatus.Confirmed) {
      actions.push({
        id: 'confirm',
        label: 'Confirmar',
        icon: <CheckCircle className="w-4 h-4" />,
        onClick: () => onChangeStatus(appointment, AppointmentStatus.Confirmed)
      });
    }

    if (appointment.status !== AppointmentStatus.Completed) {
      actions.push({
        id: 'complete',
        label: 'Marcar como Concluída',
        icon: <CheckCircle className="w-4 h-4" />,
        onClick: () => onChangeStatus(appointment, AppointmentStatus.Completed)
      });
    }

    if (appointment.status !== AppointmentStatus.Canceled) {
      actions.push({
        id: 'cancel',
        label: 'Cancelar',
        icon: <XCircle className="w-4 h-4" />,
        onClick: () => onChangeStatus(appointment, AppointmentStatus.Canceled),
        danger: true
      });
    }

    return actions;
  };

  const menuActions: ContextMenuAction[] = [
    {
      id: 'edit',
      label: 'Editar Agendamento',
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => onEdit(appointment)
    },
    {
      id: 'reschedule',
      label: 'Reagendar',
      icon: <Calendar className="w-4 h-4" />,
      onClick: () => onReschedule(appointment)
    },
    {
      id: 'duplicate',
      label: 'Duplicar',
      icon: <Copy className="w-4 h-4" />,
      onClick: () => onDuplicate(appointment)
    },
    {
      id: 'separator1',
      label: '',
      icon: null,
      onClick: () => {},
      separator: true
    },
    ...getStatusActions(),
    {
      id: 'separator2',
      label: '',
      icon: null,
      onClick: () => {},
      separator: true
    },
    {
      id: 'viewPatient',
      label: 'Ver Perfil do Paciente',
      icon: <User className="w-4 h-4" />,
      onClick: () => onViewPatient(appointment)
    },
    {
      id: 'addNote',
      label: 'Adicionar Observação',
      icon: <MessageSquare className="w-4 h-4" />,
      onClick: () => onAddNote(appointment)
    },
    {
      id: 'markPaid',
      label: appointment.paymentStatus === 'paid' ? 'Marcar como Não Pago' : 'Marcar como Pago',
      icon: <DollarSign className="w-4 h-4" />,
      onClick: () => onMarkPaid(appointment),
      disabled: !appointment.value
    },
    {
      id: 'separator3',
      label: '',
      icon: null,
      onClick: () => {},
      separator: true
    },
    {
      id: 'delete',
      label: 'Excluir Agendamento',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => onDelete(appointment),
      danger: true
    }
  ];

  const handleActionClick = (action: ContextMenuAction) => {
    if (!action.disabled && !action.separator) {
      action.onClick();
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] scale-in"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {/* Menu header with appointment info */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
          <div>
            <div className="font-medium text-sm text-gray-900 truncate">
              {appointment.patientName}
            </div>
            <div className="text-xs text-gray-500">
              {appointment.startTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })} - {appointment.type}
            </div>
          </div>
        </div>
      </div>

      {/* Menu actions */}
      <div className="py-1">
        {menuActions.map((action) => {
          if (action.separator) {
            return (
              <div key={action.id} className="h-px bg-gray-200 my-1 mx-2" />
            );
          }

          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors
                ${action.disabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : action.danger 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <span className="flex-shrink-0">
                {action.icon}
              </span>
              <span className="flex-1 truncate">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick keyboard shortcuts hint */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <MoreHorizontal className="w-3 h-3" />
          <span>Clique direito para mais opções</span>
        </div>
      </div>
    </div>
  );
};

export default ContextMenu;