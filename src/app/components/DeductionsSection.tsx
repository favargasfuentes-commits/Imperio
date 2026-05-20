import { MinusCircle, Percent } from 'lucide-react';
import { Deduction } from '../App';
import { OptimizedInput } from './OptimizedInput';

interface DeductionsSectionProps {
  deductions: Deduction[];
  setDeductions: (deductions: Deduction[]) => void;
  grossSalary: number;
  personName: string;
}

export function DeductionsSection({ deductions, setDeductions, grossSalary, personName }: DeductionsSectionProps) {
  const calculateDeduction = (deduction: Deduction) => {
    if (deduction.isPercentage) {
      return grossSalary * (deduction.percentage / 100);
    }
    return deduction.amount;
  };

  const totalDeductions = deductions.reduce((sum, d) => sum + calculateDeduction(d), 0);
  const totalPercentage = (totalDeductions / grossSalary) * 100;

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {deductions.map((deduction, index) => (
          <div key={deduction.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover-lift">
            <div className="flex-1">
              <OptimizedInput
                type="text"
                value={deduction.name}
                onSave={(value) => {
                  const newDeductions = [...deductions];
                  newDeductions[index].name = value as string;
                  setDeductions(newDeductions);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nombre de la deducción"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newDeductions = [...deductions];
                  newDeductions[index].isPercentage = !newDeductions[index].isPercentage;
                  setDeductions(newDeductions);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  deduction.isPercentage
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
                title={deduction.isPercentage ? 'Porcentaje' : 'Monto fijo'}
              >
                <Percent className="w-4 h-4" />
              </button>
            </div>

            {deduction.isPercentage ? (
              <div className="w-32">
                <OptimizedInput
                  type="number"
                  step="0.01"
                  value={deduction.percentage}
                  onSave={(value) => {
                    const newDeductions = [...deductions];
                    newDeductions[index].percentage = value as number;
                    setDeductions(newDeductions);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="%"
                />
              </div>
            ) : (
              <div className="w-40">
                <OptimizedInput
                  type="number"
                  value={deduction.amount}
                  onSave={(value) => {
                    const newDeductions = [...deductions];
                    newDeductions[index].amount = value as number;
                    setDeductions(newDeductions);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="₡ Monto"
                />
              </div>
            )}

            <div className="w-40 text-right">
              <p className="font-semibold text-gray-800">
                ₡{calculateDeduction(deduction).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <button
              onClick={() => {
                setDeductions(deductions.filter(d => d.id !== deduction.id));
              }}
              className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-xl font-bold"
              aria-label="Eliminar"
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={() => {
            setDeductions([
              ...deductions,
              {
                id: Date.now().toString(),
                name: '',
                amount: 0,
                percentage: 0,
                isPercentage: false
              }
            ]);
          }}
          className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          + Agregar Deducción
        </button>
      </div>
    </>
  );
}
