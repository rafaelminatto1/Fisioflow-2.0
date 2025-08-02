
import { useEffect, useState } from 'react';
import { ToastMessage } from '../../contexts/ToastContext';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const ToastIcons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
};

const ToastColors = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
  warning: 'border-amber-200 bg-amber-50',
};

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const Toast = ({ toast, onRemove }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-remove if not persistent
    let exitTimer: NodeJS.Timeout;
    if (!toast.persistent && toast.duration) {
      exitTimer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
    }

    return () => {
      clearTimeout(enterTimer);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, [toast.duration, toast.persistent]);
  
  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const handleActionClick = () => {
    if (toast.action?.onClick) {
      toast.action.onClick();
    }
    handleRemove();
  };

  return (
    <div 
      className={`
        flex items-start p-4 w-full max-w-sm shadow-lg rounded-lg pointer-events-auto border
        transition-all duration-300 ease-in-out
        ${ToastColors[toast.type]}
        ${isVisible && !isExiting 
          ? 'opacity-100 transform translate-x-0' 
          : 'opacity-0 transform translate-x-full'
        }
      `}
    >
      <div className="flex-shrink-0">
        {ToastIcons[toast.type]}
      </div>
      
      <div className="ml-3 w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">
          {toast.message}
        </p>
        
        {toast.action && (
          <div className="mt-2">
            <button
              onClick={handleActionClick}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>
      
      <div className="ml-4 flex-shrink-0 flex">
        <button 
          onClick={handleRemove} 
          className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
        >
          <span className="sr-only">Fechar</span>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
