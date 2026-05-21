import { useState } from 'react';
import { HandCoins, TrendingDown, PiggyBank, Target, Plus, Archive, Trash2 } from 'lucide-react';
import { Loan, IncomingLoan, Saving, Payment } from '../types/financialTypes'
import { OptimizedInput } from './OptimizedInput';

interface GlobalEntitiesSectionProps {
  loans: Loan[];
  setLoans: (loans: Loan[]) => void;
  incomingLoans: IncomingLoan[];
  setIncomingLoans: (loans: IncomingLoan[]) => void;
  savings: Saving[];
  setSavings: (savings: Saving[]) => void;
  allPayments: Payment[]; // Todos los pagos de todos los meses para calcular progreso
  activeTab: 'person1' | 'person2';
}

export function GlobalEntitiesSection({
  loans,
  setLoans,
  incomingLoans,
  setIncomingLoans,
  savings,
  setSavings,
  allPayments,
  activeTab
}: GlobalEntitiesSectionProps) {
  const [activeSection, setActiveSection] = useState<'loans' | 'incomingLoans' | 'savings'>('savings');
  const [showArchived, setShowArchived] = useState(false);

  // Funciones para calcular progreso basado en todos los pagos
  const getTotalPaidForLoan = (loanId: string) => {
    return allPayments
      .filter(p => p.type === 'loan' && p.referenceId === loanId && p.isPaid)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getTotalPaidForIncomingLoan = (loanId: string) => {
    return allPayments
      .filter(p => p.type === 'incomingLoan' && p.referenceId === loanId && p.isPaid)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getTotalPaidForSaving = (savingId: string) => {
    return allPayments
      .filter(p => p.type === 'saving' && p.referenceId === savingId && p.isPaid)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  // Filtrar por usuario activo (incluir compartidos)
  const userLoans = loans.filter(l => l.shared || l.owner === activeTab);
  const visibleLoans = showArchived ? userLoans.filter(l => l.archived) : userLoans.filter(l => !l.archived);

  const userIncomingLoans = incomingLoans.filter(l => l.shared || l.owner === activeTab);
  const visibleIncomingLoans = showArchived ? userIncomingLoans.filter(l => l.archived) : userIncomingLoans.filter(l => !l.archived);

  const userSavings = savings.filter(s => s.shared || s.owner === activeTab);
  const visibleSavings = showArchived ? userSavings.filter(s => s.archived) : userSavings.filter(s => !s.archived);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Gestión Global</h2>
        <p className="text-sm text-gray-600">Administra tus préstamos, deudas y metas. Los pagos se registran mes a mes.</p>
      </div>

      {/* Tabs de sección */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => setActiveSection('savings')}
          className={`py-3 px-2 rounded-lg font-semibold transition-all text-sm flex flex-col items-center gap-1 ${
            activeSection === 'savings'
              ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <PiggyBank className="w-5 h-5" />
          Ahorros/Metas
        </button>
        <button
          onClick={() => setActiveSection('loans')}
          className={`py-3 px-2 rounded-lg font-semibold transition-all text-sm flex flex-col items-center gap-1 ${
            activeSection === 'loans'
              ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <HandCoins className="w-5 h-5" />
          Préstamos
        </button>
        <button
          onClick={() => setActiveSection('incomingLoans')}
          className={`py-3 px-2 rounded-lg font-semibold transition-all text-sm flex flex-col items-center gap-1 ${
            activeSection === 'incomingLoans'
              ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingDown className="w-5 h-5" />
          Deudas
        </button>
      </div>

      {/* Toggle archivados */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <Archive className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Mostrar Archivados</span>
        </label>
      </div>

      {/* Contenido según sección activa */}
      <div className="space-y-4">
        {/* AHORROS Y METAS */}
        {activeSection === 'savings' && (
          <>
            {visibleSavings.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium mb-1">No hay {showArchived ? 'ahorros/metas archivados' : 'ahorros/metas registrados'}</p>
                <p className="text-gray-400 text-sm">Crea ahorros recurrentes o metas con objetivo específico</p>
              </div>
            )}

            {visibleSavings.map((saving) => {
              const globalIndex = savings.findIndex(s => s.id === saving.id);
              const paidAmount = getTotalPaidForSaving(saving.id);
              const progress = saving.isGoal && saving.targetAmount
                ? (paidAmount / saving.targetAmount) * 100
                : 0;
              const isComplete = saving.isGoal && saving.targetAmount && paidAmount >= saving.targetAmount;

              return (
                <div
                  key={saving.id}
                  className={`p-4 rounded-lg border space-y-3 ${
                    isComplete
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {saving.isGoal ? (
                      <Target className="w-5 h-5 text-blue-600" />
                    ) : (
                      <PiggyBank className="w-5 h-5 text-emerald-600" />
                    )}
                    <span className="text-xs font-semibold text-gray-600 uppercase">
                      {saving.isGoal ? 'Meta' : 'Ahorro'}
                    </span>
                    {saving.shared && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Compartido</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                      <OptimizedInput
                        type="text"
                        value={saving.name}
                        onSave={(value) => {
                          const newSavings = [...savings];
                          newSavings[globalIndex].name = value as string;
                          setSavings(newSavings);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="Nombre del ahorro/meta"
                      />
                    </div>

                    {saving.isGoal && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Monto Objetivo</label>
                        <OptimizedInput
                          type="number"
                          value={saving.targetAmount || 0}
                          onSave={(value) => {
                            const newSavings = [...savings];
                            newSavings[globalIndex].targetAmount = value as number;
                            setSavings(newSavings);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          placeholder="₡ Objetivo"
                        />
                      </div>
                    )}
                  </div>

                  {/* Toggle compartido */}
                  <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={saving.shared}
                        onChange={(e) => {
                          const newSavings = [...savings];
                          newSavings[globalIndex].shared = e.target.checked;
                          if (e.target.checked) {
                            newSavings[globalIndex].owner = undefined;
                            newSavings[globalIndex].splitType = 'percentage';
                            newSavings[globalIndex].splitPercentageP1 = 50;
                          } else {
                            newSavings[globalIndex].owner = activeTab;
                          }
                          setSavings(newSavings);
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-purple-700">
                        Compartido entre ambos
                      </span>
                    </label>
                    {saving.shared && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-600">División:</span>
                        <select
                          value={saving.splitPercentageP1 || 50}
                          onChange={(e) => {
                            const newSavings = [...savings];
                            newSavings[globalIndex].splitPercentageP1 = parseInt(e.target.value);
                            setSavings(newSavings);
                          }}
                          className="px-2 py-1 text-xs border border-purple-300 rounded focus:ring-2 focus:ring-purple-500"
                        >
                          <option value={50}>50/50</option>
                          <option value={60}>60/40</option>
                          <option value={70}>70/30</option>
                          <option value={40}>40/60</option>
                          <option value={30}>30/70</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {saving.isGoal && saving.targetAmount && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">Progreso</span>
                        <span className={`font-semibold ${isComplete ? 'text-green-600' : 'text-emerald-600'}`}>
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isComplete
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                              : 'bg-gradient-to-r from-emerald-500 to-green-600'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Acumulado: ₡{paidAmount.toLocaleString('es-CR')}</span>
                        <span>
                          {isComplete ? (
                            <span className="text-green-600 font-semibold">¡Completado!</span>
                          ) : (
                            `Falta: ₡${(saving.targetAmount - paidAmount).toLocaleString('es-CR')}`
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {!saving.isGoal && (
                    <div className="text-sm text-gray-600">
                      Total ahorrado: <span className="font-semibold text-emerald-600">₡{paidAmount.toLocaleString('es-CR')}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        const newSavings = [...savings];
                        newSavings[globalIndex].archived = !saving.archived;
                        setSavings(newSavings);
                      }}
                      className="py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
                    >
                      {saving.archived ? '♻️ Restaurar' : '📦 Archivar'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar permanentemente?')) {
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
                  const newSaving: Saving = {
                    id: Date.now().toString(),
                    name: '',
                    shared: false,
                    owner: activeTab,
                    isGoal: false
                  };
                  setSavings([...savings, newSaving]);
                }}
                className="py-3 px-4 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium"
              >
                <PiggyBank className="w-4 h-4 inline mr-2" />
                + Nuevo Ahorro
              </button>
              <button
                onClick={() => {
                  const newMeta: Saving = {
                    id: Date.now().toString(),
                    name: '',
                    shared: false,
                    owner: activeTab,
                    isGoal: true,
                    targetAmount: 0
                  };
                  setSavings([...savings, newMeta]);
                }}
                className="py-3 px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                <Target className="w-4 h-4 inline mr-2" />
                + Nueva Meta
              </button>
            </div>
          </>
        )}

        {/* PRÉSTAMOS */}
        {activeSection === 'loans' && (
          <>
            {visibleLoans.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <HandCoins className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium mb-1">No hay {showArchived ? 'préstamos archivados' : 'préstamos registrados'}</p>
                <p className="text-gray-400 text-sm">Registra el dinero que has prestado a otros</p>
              </div>
            )}

            {visibleLoans.map((loan) => {
              const globalIndex = loans.findIndex(l => l.id === loan.id);
              const paidAmount = getTotalPaidForLoan(loan.id);
              const progress = loan.totalAmount > 0 ? (paidAmount / loan.totalAmount) * 100 : 0;
              const isComplete = loan.totalAmount > 0 && paidAmount >= loan.totalAmount;

              return (
                <div
                  key={loan.id}
                  className={`p-4 rounded-lg border space-y-3 ${
                    isComplete
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {loan.shared && (
                    <div className="mb-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Compartido</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">A quién le prestaste</label>
                      <OptimizedInput
                        type="text"
                        value={loan.name}
                        onSave={(value) => {
                          const newLoans = [...loans];
                          newLoans[globalIndex].name = value as string;
                          setLoans(newLoans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        placeholder="Nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Monto Total</label>
                      <OptimizedInput
                        type="number"
                        value={loan.totalAmount}
                        onSave={(value) => {
                          const newLoans = [...loans];
                          newLoans[globalIndex].totalAmount = value as number;
                          setLoans(newLoans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        placeholder="₡ Total"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={loan.dateLent}
                        onChange={(e) => {
                          const newLoans = [...loans];
                          newLoans[globalIndex].dateLent = e.target.value;
                          setLoans(newLoans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Toggle compartido */}
                  <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={loan.shared || false}
                        onChange={(e) => {
                          const newLoans = [...loans];
                          newLoans[globalIndex].shared = e.target.checked;
                          if (e.target.checked) {
                            newLoans[globalIndex].splitType = 'percentage';
                            newLoans[globalIndex].splitPercentageP1 = 50;
                          }
                          setLoans(newLoans);
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-purple-700">
                        Compartido entre ambos
                      </span>
                    </label>
                    {loan.shared && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-600">División:</span>
                        <select
                          value={loan.splitPercentageP1 || 50}
                          onChange={(e) => {
                            const newLoans = [...loans];
                            newLoans[globalIndex].splitPercentageP1 = parseInt(e.target.value);
                            setLoans(newLoans);
                          }}
                          className="px-2 py-1 text-xs border border-purple-300 rounded focus:ring-2 focus:ring-purple-500"
                        >
                          <option value={50}>50/50</option>
                          <option value={60}>60/40</option>
                          <option value={70}>70/30</option>
                          <option value={40}>40/60</option>
                          <option value={30}>30/70</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-medium">Recuperación</span>
                      <span className={`font-semibold ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-amber-500 to-yellow-600'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Recibido: ₡{paidAmount.toLocaleString('es-CR')}</span>
                      <span>Pendiente: ₡{(loan.totalAmount - paidAmount).toLocaleString('es-CR')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const newLoans = [...loans];
                        newLoans[globalIndex].archived = !loan.archived;
                        setLoans(newLoans);
                      }}
                      className="py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg"
                    >
                      {loan.archived ? '♻️ Restaurar' : '📦 Archivar'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar permanentemente?')) {
                          setLoans(loans.filter(l => l.id !== loan.id));
                        }
                      }}
                      className="py-2 px-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => {
                const newLoan: Loan = {
                  id: Date.now().toString(),
                  name: '',
                  totalAmount: 0,
                  dateLent: new Date().toISOString().split('T')[0],
                  owner: activeTab
                };
                setLoans([...loans, newLoan]);
              }}
              className="w-full py-3 px-4 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium"
            >
              + Nuevo Préstamo
            </button>
          </>
        )}

        {/* DEUDAS */}
        {activeSection === 'incomingLoans' && (
          <>
            {visibleIncomingLoans.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium mb-1">No hay {showArchived ? 'deudas archivadas' : 'deudas registradas'}</p>
                <p className="text-gray-400 text-sm">Registra el dinero que debes a otros</p>
              </div>
            )}

            {visibleIncomingLoans.map((loan) => {
              const globalIndex = incomingLoans.findIndex(l => l.id === loan.id);
              const paidAmount = getTotalPaidForIncomingLoan(loan.id);
              const progress = loan.totalAmount > 0 ? (paidAmount / loan.totalAmount) * 100 : 0;
              const isComplete = loan.totalAmount > 0 && paidAmount >= loan.totalAmount;

              return (
                <div
                  key={loan.id}
                  className={`p-4 rounded-lg border space-y-3 ${
                    isComplete
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {loan.shared && (
                    <div className="mb-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Compartido</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">A quién le debes</label>
                      <OptimizedInput
                        type="text"
                        value={loan.name}
                        onSave={(value) => {
                          const newLoans = [...incomingLoans];
                          newLoans[globalIndex].name = value as string;
                          setIncomingLoans(newLoans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="Nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Monto Total</label>
                      <OptimizedInput
                        type="number"
                        value={loan.totalAmount}
                        onSave={(value) => {
                          const newLoans = [...incomingLoans];
                          newLoans[globalIndex].totalAmount = value as number;
                          setIncomingLoans(newLoans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="₡ Total"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={loan.dateReceived}
                        onChange={(e) => {
                          const newLoans = [...incomingLoans];
                          newLoans[globalIndex].dateReceived = e.target.value;
                          setIncomingLoans(newLoans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Toggle compartido */}
                  <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={loan.shared || false}
                        onChange={(e) => {
                          const newLoans = [...incomingLoans];
                          newLoans[globalIndex].shared = e.target.checked;
                          if (e.target.checked) {
                            newLoans[globalIndex].splitType = 'percentage';
                            newLoans[globalIndex].splitPercentageP1 = 50;
                          }
                          setIncomingLoans(newLoans);
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-purple-700">
                        Compartido entre ambos
                      </span>
                    </label>
                    {loan.shared && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-600">División:</span>
                        <select
                          value={loan.splitPercentageP1 || 50}
                          onChange={(e) => {
                            const newLoans = [...incomingLoans];
                            newLoans[globalIndex].splitPercentageP1 = parseInt(e.target.value);
                            setIncomingLoans(newLoans);
                          }}
                          className="px-2 py-1 text-xs border border-purple-300 rounded focus:ring-2 focus:ring-purple-500"
                        >
                          <option value={50}>50/50</option>
                          <option value={60}>60/40</option>
                          <option value={70}>70/30</option>
                          <option value={40}>40/60</option>
                          <option value={30}>30/70</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-medium">Pago de Deuda</span>
                      <span className={`font-semibold ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-600'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Pagado: ₡{paidAmount.toLocaleString('es-CR')}</span>
                      <span>Pendiente: ₡{(loan.totalAmount - paidAmount).toLocaleString('es-CR')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const newLoans = [...incomingLoans];
                        newLoans[globalIndex].archived = !loan.archived;
                        setIncomingLoans(newLoans);
                      }}
                      className="py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg"
                    >
                      {loan.archived ? '♻️ Restaurar' : '📦 Archivar'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar permanentemente?')) {
                          setIncomingLoans(incomingLoans.filter(l => l.id !== loan.id));
                        }
                      }}
                      className="py-2 px-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => {
                const newLoan: IncomingLoan = {
                  id: Date.now().toString(),
                  name: '',
                  totalAmount: 0,
                  dateReceived: new Date().toISOString().split('T')[0],
                  owner: activeTab
                };
                setIncomingLoans([...incomingLoans, newLoan]);
              }}
              className="w-full py-3 px-4 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium"
            >
              + Nueva Deuda
            </button>
          </>
        )}
      </div>
    </div>
  );
}
