import { useState, useEffect } from 'react';
import { PiggyBank, Users, User, Target, ToggleLeft, ToggleRight, Archive, Plus, Trash2 } from 'lucide-react';
import { Saving, SavingPayment } from '../types/financialTypes'
import { CelebrationModal } from './CelebrationModal';
import { OptimizedInput } from './OptimizedInput';

interface SavingsSectionProps {
  savings: Saving[];
  setSavings: (savings: Saving[]) => void;
  person1Name: string;
  person2Name: string;
  activeTab: 'person1' | 'person2';
}

export function SavingsSection({ savings, setSavings, person1Name, person2Name, activeTab }: SavingsSectionProps) {
  const [celebrationGoal, setCelebrationGoal] = useState<{ name: string; amount: number } | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Filtrar ahorros: mostrar compartidos + individuales de la persona activa
  const allUserSavings = savings.filter(s => s.shared || s.owner === activeTab);
  const visibleSavings = showArchived
    ? allUserSavings.filter(s => s.archived)
    : allUserSavings.filter(s => !s.archived);
  const archivedCount = allUserSavings.filter(s => s.archived).length;

  const totalSavings = visibleSavings.reduce((sum, s) => {
    // Calcular basándose en pagos pendientes si existen
    if (s.payments && s.payments.length > 0) {
      const pendingPayments = s.payments.filter(p => !p.isPaid);
      return sum + pendingPayments.reduce((pSum, p) => pSum + p.amount, 0);
    }
    // Fallback para compatibilidad (solo ahorros, no metas)
    if (!s.isGoal) {
      return sum + s.amountQ1 + s.amountQ2;
    }
    return sum;
  }, 0);

  return (
    <>
      <CelebrationModal
        isOpen={celebrationGoal !== null}
        onClose={() => setCelebrationGoal(null)}
        goalName={celebrationGoal?.name || ''}
        amount={celebrationGoal?.amount || 0}
      />

      {/* Toggle para mostrar archivados */}
      {archivedCount > 0 && (
        <div className="mb-3 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <Archive className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Mostrar Archivadas ({archivedCount})
            </span>
          </label>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {visibleSavings.length === 0 && !showArchived && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No tienes ahorros o metas registradas</p>
            <p className="text-gray-400 text-sm">Comienza a ahorrar para alcanzar tus metas financieras</p>
          </div>
        )}

        {visibleSavings.length === 0 && showArchived && (
          <div className="text-center py-12 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300">
            <Archive className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <p className="text-blue-600 font-medium mb-1">No hay metas archivadas</p>
            <p className="text-blue-500 text-sm">Las metas archivadas aparecerán aquí</p>
          </div>
        )}
        {visibleSavings.map((saving) => {
          const globalIndex = savings.findIndex(s => s.id === saving.id);

          // Calcular acumulado actual como suma de pagos pagados
          const currentAmount = saving.isGoal && saving.payments
            ? saving.payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0)
            : (saving.currentAmount || 0);

          const progress = saving.isGoal && saving.targetAmount
            ? currentAmount / saving.targetAmount * 100
            : 0;
          const remaining = saving.isGoal && saving.targetAmount
            ? saving.targetAmount - currentAmount
            : 0;

          return (
          <div key={saving.id} className={`p-3 sm:p-4 rounded-lg space-y-3 hover-lift ${
            saving.isGoal ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200' : 'bg-gray-50'
          }`}>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <OptimizedInput
                  type="text"
                  value={saving.name}
                  onSave={(value) => {
                    const newSavings = [...savings];
                    newSavings[globalIndex].name = value as string;
                    setSavings(newSavings);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Nombre del ahorro o meta"
                />

                <button
                  onClick={() => {
                    const newSavings = [...savings];
                    newSavings[globalIndex].isGoal = !newSavings[globalIndex].isGoal;
                    if (newSavings[globalIndex].isGoal && !newSavings[globalIndex].targetAmount) {
                      newSavings[globalIndex].targetAmount = 0;
                      newSavings[globalIndex].currentAmount = 0;
                    }
                    setSavings(newSavings);
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    saving.isGoal
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title={saving.isGoal ? 'Es una Meta' : 'Es un Ahorro simple'}
                >
                  {saving.isGoal ? <Target className="w-4 h-4" /> : <PiggyBank className="w-4 h-4" />}
                  <span className="text-sm">{saving.isGoal ? 'Meta' : 'Ahorro'}</span>
                </button>
              </div>

              {!saving.isGoal && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Pagos Programados</label>
                    <button
                      onClick={() => {
                        const newSavings = [...savings];
                        if (!newSavings[globalIndex].payments) {
                          newSavings[globalIndex].payments = [];
                        }
                        newSavings[globalIndex].payments.push({
                          id: `${Date.now()}-${Math.random()}`,
                          amount: 0,
                          quincena: 1,
                          isPaid: false
                        });
                        setSavings(newSavings);
                      }}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar Pago
                    </button>
                  </div>

                  {saving.payments && saving.payments.length > 0 ? (
                    <div className="space-y-2">
                      {saving.payments.map((payment, paymentIndex) => (
                        <div key={payment.id} className={`flex items-center gap-2 p-2 border rounded-lg transition-all ${
                          payment.isPaid
                            ? 'bg-green-50 border-green-300 opacity-75'
                            : 'bg-white border-gray-200'
                        }`}>
                          <input
                            type="checkbox"
                            checked={payment.isPaid}
                            onChange={(e) => {
                              const newSavings = [...savings];
                              newSavings[globalIndex].payments[paymentIndex].isPaid = e.target.checked;
                              if (e.target.checked) {
                                newSavings[globalIndex].payments[paymentIndex].paidDate = new Date().toISOString().split('T')[0];
                              } else {
                                newSavings[globalIndex].payments[paymentIndex].paidDate = undefined;
                              }
                              setSavings(newSavings);
                            }}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                            title={payment.isPaid ? 'Pagado' : 'Marcar como pagado'}
                          />

                          <OptimizedInput
                            type="number"
                            value={payment.amount}
                            onSave={(value) => {
                              const newSavings = [...savings];
                              newSavings[globalIndex].payments[paymentIndex].amount = value as number;
                              setSavings(newSavings);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                            placeholder="₡ Monto"
                          />

                          <select
                            value={payment.quincena}
                            onChange={(e) => {
                              const newSavings = [...savings];
                              newSavings[globalIndex].payments[paymentIndex].quincena = parseInt(e.target.value) as 1 | 2;
                              setSavings(newSavings);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                          >
                            <option value={1}>Q1</option>
                            <option value={2}>Q2</option>
                          </select>

                          <button
                            onClick={() => {
                              const newSavings = [...savings];
                              newSavings[globalIndex].payments = newSavings[globalIndex].payments.filter(p => p.id !== payment.id);
                              setSavings(newSavings);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar pago"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">No hay pagos programados</p>
                  )}

                  {/* Resumen de ahorro mensual */}
                  {saving.payments && saving.payments.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">Progreso del Mes</span>
                        <span className="font-semibold text-emerald-600">
                          {saving.payments.length > 0
                            ? ((saving.payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0) /
                               saving.payments.reduce((sum, p) => sum + p.amount, 0)) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-500 to-green-600"
                          style={{
                            width: `${Math.min(
                              saving.payments.length > 0
                                ? (saving.payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0) /
                                   saving.payments.reduce((sum, p) => sum + p.amount, 0)) * 100
                                : 0,
                              100
                            )}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Ahorrado: ₡{(saving.payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0) || 0).toLocaleString('es-CR')}</span>
                        <span>Meta Mes: ₡{(saving.payments.reduce((sum, p) => sum + p.amount, 0) || 0).toLocaleString('es-CR')}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {saving.isGoal && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Meta Total</label>
                      <OptimizedInput
                        type="number"
                        value={saving.targetAmount || 0}
                        onSave={(value) => {
                          const newSavings = [...savings];
                          newSavings[globalIndex].targetAmount = value as number;
                          setSavings(newSavings);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="₡ Objetivo"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Acumulado Actual</label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-semibold">
                        ₡{currentAmount.toLocaleString('es-CR')}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Calculado automáticamente según pagos realizados
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Límite (Opcional)</label>
                    <input
                      type="date"
                      value={saving.deadline || ''}
                      onChange={(e) => {
                        const newSavings = [...savings];
                        newSavings[globalIndex].deadline = e.target.value;
                        setSavings(newSavings);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Pagos mensuales para la meta */}
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Aportes Mensuales a la Meta</label>
                      <button
                        onClick={() => {
                          const newSavings = [...savings];
                          if (!newSavings[globalIndex].payments) {
                            newSavings[globalIndex].payments = [];
                          }
                          newSavings[globalIndex].payments.push({
                            id: `${Date.now()}-${Math.random()}`,
                            amount: 0,
                            quincena: 1,
                            isPaid: false
                          });
                          setSavings(newSavings);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Agregar Aporte
                      </button>
                    </div>

                    {saving.payments && saving.payments.length > 0 && (
                      <div className="space-y-2">
                        {saving.payments.map((payment, paymentIndex) => (
                          <div key={payment.id} className={`flex items-center gap-2 p-2 border rounded-lg transition-all ${
                            payment.isPaid
                              ? 'bg-green-50 border-green-300 opacity-75'
                              : 'bg-white border-blue-200'
                          }`}>
                            <input
                              type="checkbox"
                              checked={payment.isPaid}
                              onChange={(e) => {
                                const newSavings = [...savings];
                                const oldPaidStatus = newSavings[globalIndex].payments[paymentIndex].isPaid;

                                newSavings[globalIndex].payments[paymentIndex].isPaid = e.target.checked;
                                if (e.target.checked) {
                                  newSavings[globalIndex].payments[paymentIndex].paidDate = new Date().toISOString().split('T')[0];
                                } else {
                                  newSavings[globalIndex].payments[paymentIndex].paidDate = undefined;
                                }

                                // Calcular nuevo acumulado basado en pagos pagados
                                const newCurrentAmount = newSavings[globalIndex].payments
                                  .filter(p => p.isPaid)
                                  .reduce((sum, p) => sum + p.amount, 0);

                                const oldCurrentAmount = newSavings[globalIndex].currentAmount || 0;
                                newSavings[globalIndex].currentAmount = newCurrentAmount;

                                // Detectar si acabamos de completar la meta
                                if (saving.targetAmount && e.target.checked && !oldPaidStatus) {
                                  const oldProgress = (oldCurrentAmount / saving.targetAmount) * 100;
                                  const newProgress = (newCurrentAmount / saving.targetAmount) * 100;

                                  if (newProgress >= 100 && oldProgress < 100) {
                                    setCelebrationGoal({
                                      name: saving.name,
                                      amount: saving.targetAmount
                                    });
                                  }
                                }

                                setSavings(newSavings);
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              title={payment.isPaid ? 'Pagado' : 'Marcar como pagado'}
                            />

                            <OptimizedInput
                              type="number"
                              value={payment.amount}
                              onSave={(value) => {
                                const newSavings = [...savings];
                                newSavings[globalIndex].payments[paymentIndex].amount = value as number;
                                setSavings(newSavings);
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="₡ Monto"
                            />

                            <select
                              value={payment.quincena}
                              onChange={(e) => {
                                const newSavings = [...savings];
                                newSavings[globalIndex].payments[paymentIndex].quincena = parseInt(e.target.value) as 1 | 2;
                                setSavings(newSavings);
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={1}>Q1</option>
                              <option value={2}>Q2</option>
                            </select>

                            <button
                              onClick={() => {
                                const newSavings = [...savings];
                                newSavings[globalIndex].payments = newSavings[globalIndex].payments.filter(p => p.id !== payment.id);
                                setSavings(newSavings);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar aporte"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          <span className="font-medium">Aporte mensual total: </span>
                          ₡{(saving.payments?.reduce((sum, p) => sum + p.amount, 0) || 0).toLocaleString('es-CR')}
                          {saving.payments?.filter(p => p.isPaid).length > 0 && (
                            <span className="ml-2 text-green-600">
                              ({saving.payments.filter(p => p.isPaid).length} de {saving.payments.length} pagados)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-medium">Progreso</span>
                      <span className="font-semibold text-blue-600">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress >= 100
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Actual: ₡{currentAmount.toLocaleString('es-CR')}</span>
                      <span>
                        {progress >= 100 ? (
                          <span className="text-green-600 font-semibold">¡Meta Completada! 🎉</span>
                        ) : (
                          `Falta: ₡${remaining.toLocaleString('es-CR')}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <button
                onClick={() => {
                  const newSavings = [...savings];
                  newSavings[globalIndex].shared = !newSavings[globalIndex].shared;
                  if (newSavings[globalIndex].shared) {
                    newSavings[globalIndex].splitType = 'percentage';
                    newSavings[globalIndex].splitPercentageP1 = 50;
                    newSavings[globalIndex].owner = undefined;
                  } else {
                    newSavings[globalIndex].owner = activeTab;
                  }
                  setSavings(newSavings);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  saving.shared
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {saving.shared ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span className="text-sm truncate">{saving.shared ? 'Compartido' : `Individual`}</span>
              </button>

              {saving.shared && (
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">{person1Name}:</span>
                  <OptimizedInput
                    type="number"
                    min="0"
                    max="100"
                    value={saving.splitPercentageP1 || 50}
                    onSave={(value) => {
                      const newSavings = [...savings];
                      newSavings[globalIndex].splitPercentageP1 = value as number;
                      newSavings[globalIndex].splitType = 'percentage';
                      setSavings(newSavings);
                    }}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                  <span className="text-sm text-gray-600">%</span>
                  <span className="text-sm text-gray-600">{person2Name}: {100 - (saving.splitPercentageP1 || 50)}%</span>
                </div>
              )}

            </div>

            {/* Botones de gestión */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => {
                  const newSavings = [...savings];
                  newSavings[globalIndex].archived = showArchived ? false : true;
                  setSavings(newSavings);
                }}
                className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  showArchived
                    ? 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {showArchived ? '♻️ Restaurar' : '📦 Archivar'}
              </button>
              <button
                onClick={() => {
                  const itemType = saving.isGoal ? 'meta' : 'ahorro';
                  if (confirm(`¿Eliminar este ${itemType} permanentemente? Esta acción no se puede deshacer.`)) {
                    setSavings(savings.filter(s => s.id !== saving.id));
                  }
                }}
                className="py-2 px-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        );
        })}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setSavings([
                ...savings,
                {
                  id: Date.now().toString(),
                  name: '',
                  amountQ1: 0,
                  amountQ2: 0,
                  payments: [],
                  shared: false,
                  owner: activeTab,
                  isGoal: false
                }
              ]);
            }}
            className="py-3 px-3 sm:px-4 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center justify-center gap-1 sm:gap-2 font-medium hover-lift text-sm sm:text-base"
          >
            <PiggyBank className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">+ Agregar Ahorro</span>
          </button>

          <button
            onClick={() => {
              setSavings([
                ...savings,
                {
                  id: Date.now().toString(),
                  name: '',
                  amountQ1: 0,
                  amountQ2: 0,
                  payments: [],
                  shared: false,
                  owner: activeTab,
                  isGoal: true,
                  targetAmount: 0,
                  currentAmount: 0
                }
              ]);
            }}
            className="py-3 px-3 sm:px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-1 sm:gap-2 font-medium hover-lift text-sm sm:text-base"
          >
            <Target className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">+ Agregar Meta</span>
          </button>
        </div>
      </div>
    </>
  );
}
