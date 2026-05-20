import { useEffect } from 'react';
import { X, PartyPopper } from 'lucide-react';
import jousksaltaGif from '../../imports/jousksalta.gif';
import kishsaltoGif from '../../imports/kishsalto.gif';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalName: string;
  amount: number;
}

export function CelebrationModal({ isOpen, onClose, goalName, amount }: CelebrationModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative overflow-hidden animate-bounce-in">
        {/* Confetti effect background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
          <div className="absolute top-10 right-1/3 w-3 h-3 bg-pink-300 rounded-full animate-ping delay-100"></div>
          <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-blue-300 rounded-full animate-ping delay-200"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-purple-300 rounded-full animate-ping delay-300"></div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="text-center space-y-4 sm:space-y-6 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <PartyPopper className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">¡FELICIDADES!</h2>
            <PartyPopper className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300" />
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-white/30">
            <p className="text-base sm:text-lg md:text-xl text-white font-semibold mb-2">
              ¡Completaste tu meta!
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-200 mb-2 sm:mb-3 break-words">
              {goalName}
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              ₡{amount.toLocaleString('es-CR')}
            </p>
          </div>

          {/* Personajes saltando */}
          <div className="flex items-end justify-center gap-4 sm:gap-8 py-4 sm:py-6">
            <div className="animate-jump">
              <img
                src={jousksaltaGif}
                alt="Celebración"
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="animate-jump delay-150">
              <img
                src={kishsaltoGif}
                alt="Celebración"
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          <p className="text-white text-base sm:text-lg font-medium px-4">
            ¡Sigan así, controlando el imperio! 👑
          </p>

          <button
            onClick={onClose}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-emerald-600 font-bold rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors shadow-lg text-base sm:text-lg"
          >
            ¡Genial!
          </button>
        </div>
      </div>
    </div>
  );
}
