import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-green-50 border-green-500',
      text: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />
    },
    error: {
      bg: 'bg-red-50 border-red-500',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-600" />
    },
    info: {
      bg: 'bg-blue-50 border-blue-500',
      text: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600" />
    }
  };

  const style = styles[type];

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 animate-slide-in-right">
      <div className={`${style.bg} border-l-4 rounded-lg shadow-lg p-3 sm:p-4 max-w-md flex items-start gap-2 sm:gap-3`}>
        <span className="flex-shrink-0">{style.icon}</span>
        <p className={`${style.text} flex-1 font-medium text-sm sm:text-base`}>{message}</p>
        <button
          onClick={onClose}
          className={`${style.text} opacity-60 hover:opacity-100 transition-opacity flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
