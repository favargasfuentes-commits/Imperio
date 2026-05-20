import { DollarSign, TrendingUp } from 'lucide-react';
import { OptimizedInput } from './OptimizedInput';

interface IncomeSectionProps {
  grossSalary: number;
  setGrossSalary: (value: number) => void;
  dollarRate: number;
  setDollarRate: (value: number) => void;
  personName: string;
}

export function IncomeSection({ grossSalary, setGrossSalary, dollarRate, setDollarRate, personName }: IncomeSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salario Bruto
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₡</span>
            <OptimizedInput
              type="number"
              min="0"
              value={grossSalary}
              onSave={(value) => setGrossSalary(value as number)}
              className="w-full pl-8 pr-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-lg transition-all"
              placeholder="Ingresa tu salario bruto"
              required
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Dólar (Opcional)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <OptimizedInput
              type="number"
              min="0"
              step="0.01"
              value={dollarRate}
              onSave={(value) => setDollarRate(value as number)}
              className="w-full pl-10 pr-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-lg"
              placeholder="Valor del dólar"
              inputMode="decimal"
            />
          </div>
          {dollarRate > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              ${(grossSalary / dollarRate).toFixed(2)}
            </p>
          )}
        </div>
      </div>
  );
}
