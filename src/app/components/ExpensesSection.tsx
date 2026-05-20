import { ShoppingCart, Users, User, Copy, RefreshCw } from 'lucide-react';
import { Expense } from '../App';
import { OptimizedInput } from './OptimizedInput';

const EXPENSE_PRESETS = [
  { value: 'custom', label: 'Personalizado' },
  { value: 'Uber', label: 'Uber' },
  { value: 'Gasolina', label: 'Gasolina' },
  { value: 'Salidita', label: 'Salidita' },
  { value: 'Ropa', label: 'Ropa' },
  { value: 'Felicidad', label: 'Felicidad' },
];

interface ExpensesSectionProps {
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  person1Name: string;
  person2Name: string;
  activeTab: 'person1' | 'person2';
  onCopyFromPreviousMonth?: () => void;
  hasPreviousMonth?: boolean;
}

export function ExpensesSection({ expenses, setExpenses, person1Name, person2Name, activeTab, onCopyFromPreviousMonth, hasPreviousMonth }: ExpensesSectionProps) {
  // Filtrar gastos: mostrar compartidos + individuales de la persona activa
  const visibleExpenses = expenses.filter(e =>
    e.shared || e.owner === activeTab
  );

  const totalExpenses = visibleExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      {hasPreviousMonth && expenses.length === 0 && (
        <div className="mb-4">
          <button
            onClick={onCopyFromPreviousMonth}
            className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm hover-lift"
          >
            <Copy className="w-4 h-4" />
            Copiar mes anterior
          </button>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {visibleExpenses.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No hay gastos registrados este mes</p>
            <p className="text-gray-400 text-sm">Agrega tu primer gasto para comenzar a controlar tus finanzas</p>
          </div>
        )}
        {visibleExpenses.map((expense) => {
          const globalIndex = expenses.findIndex(e => e.id === expense.id);
          return (
          <div key={expense.id} className="p-4 bg-gray-50 rounded-lg space-y-3 hover-lift">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <OptimizedInput
                  type="text"
                  list={`expense-suggestions-${expense.id}`}
                  value={expense.name}
                  onSave={(value) => {
                    const newExpenses = [...expenses];
                    newExpenses[globalIndex].name = value as string;
                    setExpenses(newExpenses);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nombre del gasto (o selecciona una opción)"
                />
                <datalist id={`expense-suggestions-${expense.id}`}>
                  {EXPENSE_PRESETS.filter(p => p.value !== 'custom').map(preset => (
                    <option key={preset.value} value={preset.value} />
                  ))}
                </datalist>
              </div>

              <OptimizedInput
                type="number"
                min="0"
                value={expense.amount}
                onSave={(value) => {
                  const newExpenses = [...expenses];
                  newExpenses[globalIndex].amount = value as number;
                  setExpenses(newExpenses);
                }}
                className="px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                placeholder="Monto del gasto"
                required
                inputMode="numeric"
              />

              <select
                value={expense.quincena}
                onChange={(e) => {
                  const newExpenses = [...expenses];
                  newExpenses[globalIndex].quincena = e.target.value as 1 | 2 | 'both';
                  setExpenses(newExpenses);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="1">Quincena 1</option>
                <option value="2">Quincena 2</option>
                <option value="both">Ambas</option>
              </select>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <button
                onClick={() => {
                  const newExpenses = [...expenses];
                  newExpenses[globalIndex].shared = !newExpenses[globalIndex].shared;
                  if (newExpenses[globalIndex].shared) {
                    newExpenses[globalIndex].splitType = 'percentage';
                    newExpenses[globalIndex].splitPercentageP1 = 50;
                    newExpenses[globalIndex].owner = undefined;
                  } else {
                    newExpenses[globalIndex].owner = activeTab;
                  }
                  setExpenses(newExpenses);
                }}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap ${
                  expense.shared
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {expense.shared ? <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> : <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
                <span className="truncate">{expense.shared ? 'Compartido' : `Individual`}</span>
              </button>

              <button
                onClick={() => {
                  const newExpenses = [...expenses];
                  newExpenses[globalIndex].isRecurring = !newExpenses[globalIndex].isRecurring;
                  setExpenses(newExpenses);
                }}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap ${
                  expense.isRecurring
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
                title={expense.isRecurring ? 'Gasto recurrente - se copiará al siguiente mes' : 'Marcar como recurrente'}
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Recurrente</span>
              </button>

              {expense.shared && (
                <div className="flex items-center gap-3 flex-1">
                  <select
                    value={expense.splitType || 'percentage'}
                    onChange={(e) => {
                      const newExpenses = [...expenses];
                      newExpenses[globalIndex].splitType = e.target.value as 'percentage' | 'amount';
                      if (e.target.value === 'percentage' && !newExpenses[globalIndex].splitPercentageP1) {
                        newExpenses[globalIndex].splitPercentageP1 = 50;
                      }
                      setExpenses(newExpenses);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="percentage">%</option>
                    <option value="amount">₡</option>
                  </select>

                  {expense.splitType === 'amount' ? (
                    <>
                      <span className="text-sm text-gray-600">{person1Name}:</span>
                      <OptimizedInput
                        type="number"
                        min="0"
                        value={expense.splitAmountP1 || 0}
                        onSave={(value) => {
                          const newExpenses = [...expenses];
                          newExpenses[globalIndex].splitAmountP1 = value as number;
                          setExpenses(newExpenses);
                        }}
                        className="w-28 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="₡"
                      />
                      <span className="text-sm text-gray-600">{person2Name}: ₡{(expense.amount - (expense.splitAmountP1 || 0)).toLocaleString('es-CR')}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-gray-600">{person1Name}:</span>
                      <OptimizedInput
                        type="number"
                        min="0"
                        max="100"
                        value={expense.splitPercentageP1 || 50}
                        onSave={(value) => {
                          const newExpenses = [...expenses];
                          newExpenses[globalIndex].splitPercentageP1 = value as number;
                          setExpenses(newExpenses);
                        }}
                        className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-600">%</span>
                      <span className="text-sm text-gray-600 ml-4">{person2Name}: {100 - (expense.splitPercentageP1 || 50)}%</span>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setExpenses(expenses.filter(e => e.id !== expense.id));
                }}
                className="ml-auto p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-xl font-bold"
                aria-label="Eliminar"
              >
                ×
              </button>
            </div>
          </div>
        );
        })}

        <button
          onClick={() => {
            setExpenses([
              ...expenses,
              {
                id: Date.now().toString(),
                name: '',
                amount: 0,
                quincena: 1,
                shared: false,
                owner: activeTab,
                isRecurring: false,
                categoryPreset: 'custom'
              }
            ]);
          }}
          className="w-full py-3 px-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium hover-lift"
        >
          + Agregar Gasto
        </button>
      </div>
    </>
  );
}
