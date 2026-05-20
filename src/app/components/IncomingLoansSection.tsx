import { TrendingDown, Plus, CheckCircle2, Archive, Trash2 } from 'lucide-react';
import { IncomingLoan, Payment } from '../App';
import { useState } from 'react';

interface IncomingLoansSectionProps {
  incomingLoans: IncomingLoan[];
  setIncomingLoans: (loans: IncomingLoan[]) => void;
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  activeTab: 'person1' | 'person2';
  personName: string;
}

export function IncomingLoansSection({ incomingLoans, setIncomingLoans, payments, setPayments, activeTab, personName }: IncomingLoansSectionProps) {
  const [showArchived, setShowArchived] = useState(false);

  const allUserLoans = incomingLoans.filter(l => l.owner === activeTab);
  const visibleLoans = showArchived
    ? allUserLoans.filter(l => l.archived)
    : allUserLoans.filter(l => !l.archived);
  const archivedCount = allUserLoans.filter(l => l.archived).length;

  const getPaymentsForLoan = (loanId: string) => {
    return payments.filter(p => p.type === 'incomingLoan' && p.referenceId === loanId);
  };

  const getTotalPaidForLoan = (loanId: string) => {
    const loanPayments = getPaymentsForLoan(loanId);
    return loanPayments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);
  };

  return (
    <>
      {/* Toggle para mostrar archivados */}
      {archivedCount > 0 && (
        <div className="mb-3 flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
            />
            <Archive className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              Mostrar Archivadas ({archivedCount})
            </span>
          </label>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {visibleLoans.length === 0 && !showArchived && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No tienes deudas registradas</p>
            <p className="text-gray-400 text-sm">Registra el dinero que debes para hacer seguimiento de pagos</p>
          </div>
        )}

        {visibleLoans.length === 0 && showArchived && (
          <div className="text-center py-12 bg-orange-50 rounded-lg border-2 border-dashed border-orange-300">
            <Archive className="w-12 h-12 text-orange-400 mx-auto mb-3" />
            <p className="text-orange-600 font-medium mb-1">No hay deudas archivadas</p>
            <p className="text-orange-500 text-sm">Las deudas archivadas aparecerán aquí</p>
          </div>
        )}
        {visibleLoans.map((loan) => {
          const globalIndex = incomingLoans.findIndex(l => l.id === loan.id);
          const loanPayments = getPaymentsForLoan(loan.id);
          const paidAmount = getTotalPaidForLoan(loan.id);
          const pendingAmount = loan.totalAmount - paidAmount;
          const isComplete = loan.totalAmount > 0 && paidAmount >= loan.totalAmount;
          const progress = loan.totalAmount > 0 ? (paidAmount / loan.totalAmount) * 100 : 0;

          return (
            <div
              key={loan.id}
              className={`p-4 rounded-lg space-y-3 border ${
                isComplete
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Header de la deuda */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">A quién le debes</label>
                  <input
                    type="text"
                    value={loan.name}
                    onChange={(e) => {
                      const newLoans = [...incomingLoans];
                      newLoans[globalIndex].name = e.target.value;
                      setIncomingLoans(newLoans);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nombre"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monto Total de la Deuda</label>
                  <input
                    type="number"
                    value={loan.totalAmount}
                    onChange={(e) => {
                      const newLoans = [...incomingLoans];
                      newLoans[globalIndex].totalAmount = parseFloat(e.target.value) || 0;
                      setIncomingLoans(newLoans);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="₡ Total"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha que Recibiste</label>
                  <input
                    type="date"
                    value={loan.dateReceived}
                    onChange={(e) => {
                      const newLoans = [...incomingLoans];
                      newLoans[globalIndex].dateReceived = e.target.value;
                      setIncomingLoans(newLoans);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">Progreso de Pago de Deuda</span>
                  <span className={`font-semibold ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isComplete
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : 'bg-gradient-to-r from-orange-500 to-red-600'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Pagado: ₡{paidAmount.toLocaleString('es-CR')}</span>
                  <span>
                    {isComplete ? (
                      <span className="text-green-600 font-semibold">¡Completado!</span>
                    ) : (
                      `Pendiente: ₡${pendingAmount.toLocaleString('es-CR')}`
                    )}
                  </span>
                </div>
              </div>

              {/* Lista de pagos del mes actual */}
              <div className="bg-white rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">Pagos Programados (Este Mes)</h4>
                  <button
                    onClick={() => {
                      const newPayment: Payment = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        type: 'incomingLoan',
                        referenceId: loan.id,
                        amount: 0,
                        dueDate: new Date().toISOString().split('T')[0],
                        isPaid: false,
                        owner: activeTab
                      };
                      setPayments([...payments, newPayment]);
                    }}
                    className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar Pago
                  </button>
                </div>

                {loanPayments.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">
                    No hay pagos configurados para este mes. Haz clic en "Agregar Pago" para crear la lista de pagos programados.
                  </p>
                )}

                {loanPayments.map((payment) => {
                  const paymentIndex = payments.findIndex(p => p.id === payment.id);

                  return (
                    <div
                      key={payment.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        payment.isPaid ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {/* Checkbox */}
                      <label className="flex items-center cursor-pointer min-w-[44px] min-h-[44px] justify-center">
                        <input
                          type="checkbox"
                          checked={payment.isPaid}
                          onChange={(e) => {
                            const newPayments = [...payments];
                            newPayments[paymentIndex].isPaid = e.target.checked;
                            if (e.target.checked) {
                              newPayments[paymentIndex].paidDate = new Date().toISOString().split('T')[0];
                            } else {
                              newPayments[paymentIndex].paidDate = undefined;
                            }
                            setPayments(newPayments);
                          }}
                          className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                      </label>

                      {/* Monto */}
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => {
                          const newPayments = [...payments];
                          newPayments[paymentIndex].amount = parseFloat(e.target.value) || 0;
                          setPayments(newPayments);
                        }}
                        className={`flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 ${
                          payment.isPaid ? 'line-through text-gray-500 bg-gray-100' : ''
                        }`}
                        placeholder="₡ Monto"
                      />

                      {/* Fecha esperada */}
                      <input
                        type="date"
                        value={payment.dueDate || ''}
                        onChange={(e) => {
                          const newPayments = [...payments];
                          newPayments[paymentIndex].dueDate = e.target.value;
                          setPayments(newPayments);
                        }}
                        className={`px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-orange-500 ${
                          payment.isPaid ? 'text-gray-500 bg-gray-100' : ''
                        }`}
                      />

                      {/* Fecha pagado (si está pagado) */}
                      {payment.isPaid && payment.paidDate && (
                        <span className="text-xs text-green-600 whitespace-nowrap flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {new Date(payment.paidDate).toLocaleDateString('es-CR')}
                        </span>
                      )}

                      {/* Botón eliminar pago */}
                      <button
                        onClick={() => {
                          setPayments(payments.filter(p => p.id !== payment.id));
                        }}
                        className="p-1 text-red-600 bg-red-100 hover:bg-red-200 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label="Eliminar pago"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Botones de gestión */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const newLoans = [...incomingLoans];
                    newLoans[globalIndex].archived = showArchived ? false : true;
                    setIncomingLoans(newLoans);
                  }}
                  className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                    showArchived
                      ? 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
                      : 'text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200'
                  }`}
                >
                  {showArchived ? '♻️ Restaurar' : '📦 Archivar'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar esta deuda permanentemente? Esta acción no se puede deshacer.')) {
                      // Eliminar también todos los pagos asociados
                      setPayments(payments.filter(p => !(p.type === 'incomingLoan' && p.referenceId === loan.id)));
                      setIncomingLoans(incomingLoans.filter(l => l.id !== loan.id));
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

        <button
          onClick={() => {
            const newLoan: IncomingLoan = {
              id: Date.now().toString(),
              name: '',
              totalAmount: 0,
              dateReceived: new Date().toISOString().split('T')[0],
              owner: activeTab,
            };
            setIncomingLoans([...incomingLoans, newLoan]);
          }}
          className="w-full py-2 px-4 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
        >
          + Agregar Deuda
        </button>
      </div>
    </>
  );
}
