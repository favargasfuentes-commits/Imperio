import { Plus, CheckCircle2, Trash2, DollarSign } from 'lucide-react';
import { Payment, Loan, IncomingLoan, Saving } from '../App';

interface MonthlyPaymentsSectionProps {
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  loans: Loan[];
  incomingLoans: IncomingLoan[];
  savings: Saving[];
  activeTab: 'person1' | 'person2';
}

export function MonthlyPaymentsSection({
  payments,
  setPayments,
  loans,
  incomingLoans,
  savings,
  activeTab
}: MonthlyPaymentsSectionProps) {
  // Filtrar pagos del usuario activo
  const userPayments = payments.filter(p => p.owner === activeTab);
  const totalPending = userPayments.filter(p => !p.isPaid).reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = userPayments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);

  // Obtener entidades disponibles del usuario (incluir compartidas)
  const availableLoans = loans.filter(l => (l.shared || l.owner === activeTab) && !l.archived);
  const availableIncomingLoans = incomingLoans.filter(l => (l.shared || l.owner === activeTab) && !l.archived);
  const availableSavings = savings.filter(s => (s.shared || s.owner === activeTab) && !s.archived);

  const getEntityName = (payment: Payment): string => {
    if (payment.type === 'loan') {
      const loan = loans.find(l => l.id === payment.referenceId);
      return loan ? `${loan.shared ? '👥 ' : ''}Préstamo a ${loan.name}` : 'Préstamo eliminado';
    } else if (payment.type === 'incomingLoan') {
      const loan = incomingLoans.find(l => l.id === payment.referenceId);
      return loan ? `${loan.shared ? '👥 ' : ''}Deuda con ${loan.name}` : 'Deuda eliminada';
    } else if (payment.type === 'saving') {
      const saving = savings.find(s => s.id === payment.referenceId);
      if (saving) {
        const prefix = saving.shared ? '👥 ' : '';
        return saving.isGoal ? `${prefix}Meta: ${saving.name}` : `${prefix}Ahorro: ${saving.name}`;
      }
      return 'Ahorro eliminado';
    }
    return 'Desconocido';
  };

  const getTypeColor = (type: string): string => {
    if (type === 'loan') return 'bg-amber-50 border-amber-200 text-amber-700';
    if (type === 'incomingLoan') return 'bg-orange-50 border-orange-200 text-orange-700';
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs text-orange-600 font-medium mb-1">Pendiente</p>
          <p className="text-lg font-bold text-orange-700">₡{totalPending.toLocaleString('es-CR')}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium mb-1">Pagado</p>
          <p className="text-lg font-bold text-green-700">₡{totalPaid.toLocaleString('es-CR')}</p>
        </div>
      </div>

      {/* Lista de pagos */}
      <div className="space-y-3">
        {userPayments.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <DollarSign className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 font-medium mb-1">No hay pagos programados</p>
            <p className="text-gray-400 text-sm">Agrega los pagos que harás este mes</p>
          </div>
        )}

        {userPayments.map((payment) => {
          const paymentIndex = payments.findIndex(p => p.id === payment.id);

          return (
            <div
              key={payment.id}
              className={`p-3 rounded-lg border ${
                payment.isPaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}
            >
              {/* Checkbox y monto */}
              <div className="flex items-start gap-3 mb-3">
                <label className="flex items-center cursor-pointer min-w-[40px] min-h-[40px] justify-center">
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

                <div className="flex-1 space-y-3">
                  {/* Tipo y entidad */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Asignar a</label>
                    <select
                      value={`${payment.type}:${payment.referenceId}`}
                      onChange={(e) => {
                        const [type, refId] = e.target.value.split(':');
                        const newPayments = [...payments];
                        newPayments[paymentIndex].type = type as 'loan' | 'incomingLoan' | 'saving';
                        newPayments[paymentIndex].referenceId = refId;
                        setPayments(newPayments);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Selecciona --</option>

                      {availableSavings.length > 0 && (
                        <optgroup label="Ahorros y Metas">
                          {availableSavings.map(s => (
                            <option key={s.id} value={`saving:${s.id}`}>
                              {s.isGoal ? '🎯' : '🏦'} {s.shared ? '👥 ' : ''}{s.name}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {availableLoans.length > 0 && (
                        <optgroup label="Préstamos (Recuperar)">
                          {availableLoans.map(l => (
                            <option key={l.id} value={`loan:${l.id}`}>
                              💰 {l.shared ? '👥 ' : ''}{l.name}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {availableIncomingLoans.length > 0 && (
                        <optgroup label="Deudas (Pagar)">
                          {availableIncomingLoans.map(l => (
                            <option key={l.id} value={`incomingLoan:${l.id}`}>
                              💸 {l.shared ? '👥 ' : ''}{l.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Nombre de la entidad asignada */}
                  {payment.referenceId && (
                    <div className={`text-xs px-2 py-1 rounded border inline-block ${getTypeColor(payment.type)}`}>
                      {getEntityName(payment)}
                    </div>
                  )}

                  {/* Monto y quincena */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Monto</label>
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => {
                          const newPayments = [...payments];
                          newPayments[paymentIndex].amount = parseFloat(e.target.value) || 0;
                          setPayments(newPayments);
                        }}
                        className={`w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 ${
                          payment.isPaid ? 'line-through text-gray-500 bg-gray-100' : ''
                        }`}
                        placeholder="₡ Monto"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quincena</label>
                      <select
                        value={payment.quincena || 1}
                        onChange={(e) => {
                          const newPayments = [...payments];
                          newPayments[paymentIndex].quincena = parseInt(e.target.value) as 1 | 2;
                          setPayments(newPayments);
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                      </select>
                    </div>
                  </div>

                  {/* Fecha pagado */}
                  {payment.isPaid && payment.paidDate && (
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Pagado: {new Date(payment.paidDate).toLocaleDateString('es-CR')}
                    </div>
                  )}
                </div>

                {/* Botón eliminar */}
                <button
                  onClick={() => {
                    setPayments(payments.filter(p => p.id !== payment.id));
                  }}
                  className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded transition-colors"
                  aria-label="Eliminar pago"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón agregar pago */}
      <button
        onClick={() => {
          const newPayment: Payment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: 'saving',
            referenceId: '',
            amount: 0,
            quincena: 1,
            isPaid: false,
            owner: activeTab
          };
          setPayments([...payments, newPayment]);
        }}
        className="w-full py-3 px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Agregar Pago del Mes
      </button>
    </div>
  );
}
