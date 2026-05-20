import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning'
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: 'from-red-500 to-rose-600',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      bg: 'from-amber-500 to-orange-600',
      button: 'bg-amber-600 hover:bg-amber-700'
    },
    info: {
      bg: 'from-blue-500 to-indigo-600',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className={`bg-gradient-to-r ${colors[variant].bg} p-4 text-white`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 text-lg mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-3 text-white font-semibold rounded-lg transition-colors ${colors[variant].button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
