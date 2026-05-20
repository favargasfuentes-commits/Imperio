import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  headerColor?: string;
  badge?: ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  headerColor = 'text-gray-800',
  badge
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover-lift">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <h2 className={`text-base sm:text-lg md:text-xl font-semibold ${headerColor} text-left truncate`}>
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
          {!isOpen && badge && (
            <div className="animate-fade-in">
              {badge}
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-6 pt-0 sm:pt-0 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
