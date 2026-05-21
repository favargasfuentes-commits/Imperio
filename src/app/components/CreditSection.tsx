import { CreditCard, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Credit, PersonData, Expense, Saving, Payment } from '../types/financialTypes'

interface CreditSectionProps {
  credits: Credit[];
  setCredits: (credits: Credit[]) => void;
  activeTab: 'person1' | 'person2';
  personName: string;
  personData: PersonData;
  expenses: Expense[];
  savings: Saving[];
  payments: Payment[];
}

export function CreditSection({ credits, setCredits, activeTab, personName, personData, expenses, savings, payments }: CreditSectionProps) {
  const visibleCredits = credits.filter(c => c.owner === activeTab);
  const totalDebt = visibleCredits.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalAvailable = visibleCredits.reduce((sum, c) => sum + (c.creditLimit - c.currentBalance), 0);

  // Calcular disponible mensual de la persona
  const calculatePersonNetSalary = () => {
    const totalDeductions = personData.deductions.reduce((sum, d) => {
      if (d.isPercentage) {
        return sum + (personData.grossSalary * (d.percentage / 100));
      }
      return sum + d.amount;
    }, 0);
    return personData.grossSalary - totalDeductions;
  };

  const calculatePersonMonthlyAvailable = () => {
    const netSalary = calculatePersonNetSalary();

    // Otras deducciones
    const otherDeductions = personData.otherDeductions.reduce(
      (sum, d) => sum + d.amountQ1 + d.amountQ2,
      0
    );

    const realNet = netSalary - otherDeductions;

    // Gastos de la persona
    const personExpenses = expenses.reduce((sum, e) => {
      const totalAmount = e.quincena === 'both' ? e.amount : e.amount;
      const monthlyAmount = e.quincena === 'both' ? totalAmount : totalAmount;

      if (e.shared) {
        if (e.splitType === 'amount') {
          const amountP1 = e.splitAmountP1 || 0;
          const amountP2 = totalAmount - amountP1;
          return sum + (activeTab === 'person1' ? amountP1 : amountP2);
        } else {
          const percentage = activeTab === 'person1' ? (e.splitPercentageP1 || 50) : (100 - (e.splitPercentageP1 || 50));
          return sum + (monthlyAmount * percentage / 100);
        }
      } else if (e.owner === activeTab) {
        return sum + monthlyAmount;
      }
      return sum;
    }, 0);

    // Ahorros y metas de la persona (basado en pagos YA pagados del mes actual)
    // ESTOS SE RESTAN porque son salidas de dinero
    const personSavings = savings.filter(s => !s.archived).reduce((sum, s) => {
      // Obtener pagos ya realizados de este ahorro/meta para este usuario
      const savingPayments = payments.filter(p =>
        p.type === 'saving' &&
        p.referenceId === s.id &&
        p.isPaid === true &&
        p.owner === activeTab
      );

      const total = savingPayments.reduce((pSum, p) => pSum + p.amount, 0);

      if (s.shared) {
        const percentage = activeTab === 'person1' ? (s.splitPercentageP1 || 50) : (100 - (s.splitPercentageP1 || 50));
        return sum + (total * percentage / 100);
      } else if (s.owner === activeTab) {
        return sum + total;
      }

      return sum;
    }, 0);

    // Calcular pagos de tasa cero (son gastos mensuales adicionales)
    const zeroInterestPayments = visibleCredits
      .filter(c => c.hasZeroInterest && c.installmentAmount)
      .reduce((sum, c) => sum + (c.installmentAmount || 0), 0);

    // Calcular pagos de deudas ya realizados del mes actual
    // ESTOS SE RESTAN porque son salidas de dinero
    const personDebts = payments.filter(p =>
      p.type === 'incomingLoan' &&
      p.isPaid === true &&
      p.owner === activeTab
    ).reduce((sum, p) => sum + p.amount, 0);

    // Calcular pagos de préstamos que ya recibiste este mes
    // ESTOS SE SUMAN porque son ingresos
    const personLoanPayments = payments.filter(p =>
      p.type === 'loan' &&
      p.isPaid === true &&
      p.owner === activeTab
    ).reduce((sum, p) => sum + p.amount, 0);

    return realNet - personExpenses - personSavings - zeroInterestPayments - personDebts + personLoanPayments;
  };

  const monthlyAvailable = calculatePersonMonthlyAvailable();

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {visibleCredits.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No tienes tarjetas de crédito registradas</p>
            <p className="text-gray-400 text-sm">Agrega tus tarjetas para monitorear tu capacidad de pago</p>
          </div>
        )}
        {visibleCredits.map((credit) => {
          const globalIndex = credits.findIndex(c => c.id === credit.id);
          const available = credit.creditLimit - credit.currentBalance;
          const usagePercent = (credit.currentBalance / credit.creditLimit) * 100;
          const today = new Date().getDate();
          const daysUntilPayment = credit.paymentDate >= today
            ? credit.paymentDate - today
            : (30 - today) + credit.paymentDate;

          // Análisis de capacidad de pago
          const canPayMinimum = monthlyAvailable >= credit.minimumPayment;
          const canPayFull = monthlyAvailable >= credit.currentBalance;
          const percentageOfAvailable = (credit.minimumPayment / monthlyAvailable) * 100;

          let paymentStatus: 'safe' | 'warning' | 'danger' = 'safe';
          if (!canPayMinimum) {
            paymentStatus = 'danger';
          } else if (percentageOfAvailable > 50 || !canPayFull) {
            paymentStatus = 'warning';
          }

          return (
            <div key={credit.id} className={`p-4 rounded-lg space-y-3 border ${
              paymentStatus === 'danger'
                ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300'
                : paymentStatus === 'warning'
                ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
                : 'bg-gradient-to-br from-gray-50 to-rose-50 border-rose-100'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nombre de la Tarjeta
                  </label>
                  <input
                    type="text"
                    value={credit.name}
                    onChange={(e) => {
                      const newCredits = [...credits];
                      newCredits[globalIndex].name = e.target.value;
                      setCredits(newCredits);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Ej: BAC Visa Gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Límite de Crédito Total
                  </label>
                  <input
                    type="number"
                    value={credit.creditLimit}
                    onChange={(e) => {
                      const newCredits = [...credits];
                      newCredits[globalIndex].creditLimit = parseFloat(e.target.value) || 0;
                      setCredits(newCredits);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="₡ Límite total aprobado"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Saldo Actual (Lo que debes)
                  </label>
                  <input
                    type="number"
                    value={credit.currentBalance}
                    onChange={(e) => {
                      const newCredits = [...credits];
                      newCredits[globalIndex].currentBalance = parseFloat(e.target.value) || 0;
                      setCredits(newCredits);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="₡ Deuda actual"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Día de Pago (1-31)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={credit.paymentDate}
                      onChange={(e) => {
                        const newCredits = [...credits];
                        newCredits[globalIndex].paymentDate = parseInt(e.target.value) || 1;
                        setCredits(newCredits);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="Día"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pago Mínimo Mensual
                    </label>
                    <input
                      type="number"
                      value={credit.minimumPayment}
                      onChange={(e) => {
                        const newCredits = [...credits];
                        newCredits[globalIndex].minimumPayment = parseFloat(e.target.value) || 0;
                        setCredits(newCredits);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="₡ Mínimo"
                    />
                  </div>
                </div>

                {/* Plan de Tasa Cero */}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={credit.hasZeroInterest || false}
                      onChange={(e) => {
                        const newCredits = [...credits];
                        newCredits[globalIndex].hasZeroInterest = e.target.checked;
                        if (e.target.checked && !newCredits[globalIndex].totalInstallments) {
                          newCredits[globalIndex].totalInstallments = 12;
                          newCredits[globalIndex].installmentsPaid = 0;
                          newCredits[globalIndex].installmentAmount = 0;
                        }
                        setCredits(newCredits);
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label className="text-sm font-medium text-gray-700">Plan de Tasa Cero / Cuotas</label>
                  </div>

                  {credit.hasZeroInterest && (
                    <div className="space-y-3 bg-blue-50 rounded-lg p-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Total Cuotas
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={credit.totalInstallments || 12}
                            onChange={(e) => {
                              const newCredits = [...credits];
                              newCredits[globalIndex].totalInstallments = parseInt(e.target.value) || 12;
                              setCredits(newCredits);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="12"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cuotas Pagadas
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={credit.totalInstallments || 12}
                            value={credit.installmentsPaid || 0}
                            onChange={(e) => {
                              const newCredits = [...credits];
                              newCredits[globalIndex].installmentsPaid = parseInt(e.target.value) || 0;
                              setCredits(newCredits);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Monto por Cuota
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={credit.installmentAmount || 0}
                            onChange={(e) => {
                              const newCredits = [...credits];
                              newCredits[globalIndex].installmentAmount = parseFloat(e.target.value) || 0;
                              setCredits(newCredits);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="₡"
                          />
                        </div>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 font-medium">Progreso del Plan</span>
                          <span className="font-semibold text-blue-600">
                            {credit.installmentsPaid || 0} / {credit.totalInstallments || 12} cuotas
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600"
                            style={{
                              width: `${Math.min(((credit.installmentsPaid || 0) / (credit.totalInstallments || 12)) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Pagado: ₡{((credit.installmentsPaid || 0) * (credit.installmentAmount || 0)).toLocaleString('es-CR')}</span>
                          <span>Restante: {(credit.totalInstallments || 12) - (credit.installmentsPaid || 0)} cuotas</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uso de Crédito</span>
                  <span className={`font-semibold ${usagePercent > 80 ? 'text-red-600' : usagePercent > 50 ? 'text-amber-600' : 'text-green-600'}`}>
                    {usagePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Disponible en tarjeta: ₡{available.toLocaleString('es-CR')}</span>
                  <div className="flex items-center gap-1">
                    {daysUntilPayment <= 7 && (
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                    )}
                    <span className={daysUntilPayment <= 7 ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                      Pago en {daysUntilPayment} días
                    </span>
                  </div>
                </div>
              </div>

              {/* Análisis de Capacidad de Pago */}
              <div className={`p-3 rounded-lg ${
                paymentStatus === 'danger'
                  ? 'bg-red-100 border border-red-300'
                  : paymentStatus === 'warning'
                  ? 'bg-amber-100 border border-amber-300'
                  : 'bg-green-100 border border-green-300'
              }`}>
                <div className="flex items-start gap-2">
                  {paymentStatus === 'danger' ? (
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : paymentStatus === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${
                      paymentStatus === 'danger' ? 'text-red-800' : paymentStatus === 'warning' ? 'text-amber-800' : 'text-green-800'
                    }`}>
                      {paymentStatus === 'danger'
                        ? '¡ALERTA! No alcanza para pago mínimo'
                        : paymentStatus === 'warning'
                        ? 'Advertencia: Capacidad de pago ajustada'
                        : 'Capacidad de pago saludable'
                      }
                    </p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Disponible mensual:</span>
                        <span className="font-semibold">₡{monthlyAvailable.toLocaleString('es-CR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Pago mínimo:</span>
                        <span className={`font-semibold ${!canPayMinimum ? 'text-red-700' : ''}`}>
                          ₡{credit.minimumPayment.toLocaleString('es-CR')}
                        </span>
                      </div>
                      {credit.currentBalance > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Saldo total:</span>
                          <span className={`font-semibold ${!canPayFull ? 'text-amber-700' : ''}`}>
                            ₡{credit.currentBalance.toLocaleString('es-CR')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-gray-400">
                        <span className="text-gray-700">Sobrante después de pago mín:</span>
                        <span className={`font-semibold ${monthlyAvailable - credit.minimumPayment < 0 ? 'text-red-700' : 'text-green-700'}`}>
                          ₡{(monthlyAvailable - credit.minimumPayment).toLocaleString('es-CR')}
                        </span>
                      </div>
                      {!canPayMinimum && (
                        <p className="text-red-700 font-medium mt-2">
                          Faltante: ₡{(credit.minimumPayment - monthlyAvailable).toLocaleString('es-CR')}
                        </p>
                      )}
                      {canPayMinimum && !canPayFull && percentageOfAvailable > 50 && (
                        <p className="text-amber-700 font-medium mt-2">
                          El pago mínimo consume {percentageOfAvailable.toFixed(0)}% de tu disponible
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setCredits(credits.filter(c => c.id !== credit.id));
                }}
                className="w-full py-2 px-3 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                Eliminar Tarjeta
              </button>
            </div>
          );
        })}

        <button
          onClick={() => {
            setCredits([
              ...credits,
              {
                id: Date.now().toString(),
                name: '',
                creditLimit: 0,
                currentBalance: 0,
                paymentDate: 1,
                minimumPayment: 0,
                owner: activeTab,
                hasZeroInterest: false,
                totalInstallments: 12,
                installmentsPaid: 0,
                installmentAmount: 0
              }
            ]);
          }}
          className="w-full py-2 px-4 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
        >
          + Agregar Tarjeta
        </button>
      </div>
    </>
  );
}
