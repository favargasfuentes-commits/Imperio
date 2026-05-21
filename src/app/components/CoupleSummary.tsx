import { Wallet, Calendar, TrendingUp } from 'lucide-react';
import { PersonData, Expense, Saving, Loan, IncomingLoan, Credit, Payment } from '../types/financialTypes'
import { OptimizedInput } from './OptimizedInput';
import jouskcaminaGif from '../../imports/jouskcamina.gif';
import kishcaminandoGif from '../../imports/kishcaminando.gif';

interface CoupleSummaryProps {
  person1: PersonData;
  person2: PersonData;
  expenses: Expense[];
  savings: Saving[];
  loans?: Loan[];
  incomingLoans?: IncomingLoan[];
  credits?: Credit[];
  payments: Payment[];
  setPerson1: (data: PersonData) => void;
  setPerson2: (data: PersonData) => void;
  activeTab: 'person1' | 'person2';
}

export function CoupleSummary({ person1, person2, expenses, savings, loans = [], incomingLoans = [], credits = [], payments, setPerson1, setPerson2, activeTab }: CoupleSummaryProps) {
  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  };

  const calculatePersonNetSalary = (person: PersonData) => {
    const totalDeductions = person.deductions.reduce((sum, d) => {
      if (d.isPercentage) {
        return sum + (person.grossSalary * (d.percentage / 100));
      }
      return sum + d.amount;
    }, 0);
    return person.grossSalary - totalDeductions;
  };

  const calculatePersonRealNet = (person: PersonData, quincena: 1 | 2) => {
    const netSalary = calculatePersonNetSalary(person);
    const netSalaryQuincena = netSalary / 2;
    const otherDeductions = person.otherDeductions.reduce(
      (sum, d) => sum + (quincena === 1 ? d.amountQ1 : d.amountQ2),
      0
    );
    return netSalaryQuincena - otherDeductions;
  };

  const calculateExpensesForPerson = (personNum: 1 | 2, quincena: 1 | 2) => {
    const owner = personNum === 1 ? 'person1' : 'person2';
    return expenses
      .filter((e) => {
        const normalizedQuincena = typeof e.quincena === 'number'
          ? e.quincena
          : e.quincena === 'both'
            ? 'both'
            : parseInt(e.quincena, 10) as 1 | 2;
        return normalizedQuincena === quincena || normalizedQuincena === 'both';
      })
      .reduce((sum, e) => {
        const amount = e.amount;
        if (e.shared) {
          if (e.splitType === 'amount') {
            // División por monto: si es 'both', cada quincena usa el monto completo.
            const amountP1 = e.splitAmountP1 || 0;
            const amountP2 = e.amount - amountP1;
            return sum + (personNum === 1 ? amountP1 : amountP2);
          } else {
            // División por porcentaje
            const percentage = personNum === 1 ? (e.splitPercentageP1 || 50) : (100 - (e.splitPercentageP1 || 50));
            return sum + (amount * percentage / 100);
          }
        } else if (e.owner === owner) {
          // Solo incluir gastos individuales si pertenecen a esta persona
          return sum + amount;
        }
        return sum;
      }, 0);
  };

  const calculateSavingsForPerson = (personNum: 1 | 2, quincena: 1 | 2) => {
    const owner = personNum === 1 ? 'person1' : 'person2';
    return savings.filter(s => !s.archived).reduce((sum, s) => {
      // Obtener pagos YA PAGADOS de este ahorro/meta para esta quincena del mes actual
      const savingPayments = payments.filter(p =>
        p.type === 'saving' &&
        p.referenceId === s.id &&
        p.quincena === quincena &&
        p.isPaid === true && // Solo los que YA se pagaron
        p.owner === owner
      );

      const totalAmount = savingPayments.reduce((pSum, p) => pSum + p.amount, 0);

      if (s.shared) {
        // División por porcentaje
        const percentage = personNum === 1 ? (s.splitPercentageP1 || 50) : (100 - (s.splitPercentageP1 || 50));
        return sum + (totalAmount * percentage / 100);
      } else if (s.owner === owner) {
        return sum + totalAmount;
      }

      return sum;
    }, 0);
  };

  // Calcular pagos de tasa cero (son gastos mensuales divididos en 2 quincenas)
  const calculateZeroInterestPaymentsForPerson = (personNum: 1 | 2, quincena: 1 | 2) => {
    const owner = personNum === 1 ? 'person1' : 'person2';
    const personCredits = credits.filter(c => c.owner === owner && c.hasZeroInterest && c.installmentAmount);
    const totalMonthly = personCredits.reduce((sum, c) => sum + (c.installmentAmount || 0), 0);
    // Dividir el pago mensual entre las dos quincenas
    return totalMonthly / 2;
  };

  // Calcular pagos de deudas YA REALIZADOS (pagos marcados como pagados, por quincena específica)
  // ESTOS SE RESTAN porque son salidas de dinero que YA salieron
  const calculateDebtPaymentsForPerson = (personNum: 1 | 2, quincena: 1 | 2) => {
    const owner = personNum === 1 ? 'person1' : 'person2';

    // Obtener IDs de deudas de esta persona (incluir compartidas)
    const debtIds = incomingLoans
      .filter(l => (l.shared || l.owner === owner) && !l.archived)
      .map(l => l.id);

    // Obtener pagos YA PAGADOS de deudas de ESTA QUINCENA del mes actual para este usuario
    const debtPayments = payments.filter(p =>
      p.type === 'incomingLoan' &&
      debtIds.includes(p.referenceId) &&
      p.quincena === quincena && // Solo de esta quincena
      p.isPaid === true && // Solo los que YA se pagaron
      p.owner === owner
    );

    return debtPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  // Calcular pagos de préstamos que YA recibiste (pagos que te hicieron por préstamos que diste)
  // ESTOS SE SUMAN porque son ingresos que YA entraron
  const calculateLoanPaymentsReceivedForPerson = (personNum: 1 | 2, quincena: 1 | 2) => {
    const owner = personNum === 1 ? 'person1' : 'person2';

    // Obtener IDs de préstamos de esta persona (incluir compartidos)
    const loanIds = loans
      .filter(l => (l.shared || l.owner === owner) && !l.archived)
      .map(l => l.id);

    // Obtener pagos que YA recibiste de ESTA QUINCENA (pagados)
    const loanPayments = payments.filter(p =>
      p.type === 'loan' &&
      loanIds.includes(p.referenceId) &&
      p.quincena === quincena && // Solo de esta quincena
      p.isPaid === true && // Solo los que YA se recibieron
      p.owner === owner
    );

    return loanPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  const p1NetQ1 = calculatePersonRealNet(person1, 1);
  const p1NetQ2 = calculatePersonRealNet(person1, 2);
  const p2NetQ1 = calculatePersonRealNet(person2, 1);
  const p2NetQ2 = calculatePersonRealNet(person2, 2);

  const p1ExpensesQ1 = calculateExpensesForPerson(1, 1);
  const p1ExpensesQ2 = calculateExpensesForPerson(1, 2);
  const p2ExpensesQ1 = calculateExpensesForPerson(2, 1);
  const p2ExpensesQ2 = calculateExpensesForPerson(2, 2);

  const p1SavingsQ1 = calculateSavingsForPerson(1, 1);
  const p1SavingsQ2 = calculateSavingsForPerson(1, 2);
  const p2SavingsQ1 = calculateSavingsForPerson(2, 1);
  const p2SavingsQ2 = calculateSavingsForPerson(2, 2);

  const p1ZeroInterestQ1 = calculateZeroInterestPaymentsForPerson(1, 1);
  const p1ZeroInterestQ2 = calculateZeroInterestPaymentsForPerson(1, 2);
  const p2ZeroInterestQ1 = calculateZeroInterestPaymentsForPerson(2, 1);
  const p2ZeroInterestQ2 = calculateZeroInterestPaymentsForPerson(2, 2);

  const p1DebtPaymentsQ1 = calculateDebtPaymentsForPerson(1, 1);
  const p1DebtPaymentsQ2 = calculateDebtPaymentsForPerson(1, 2);
  const p2DebtPaymentsQ1 = calculateDebtPaymentsForPerson(2, 1);
  const p2DebtPaymentsQ2 = calculateDebtPaymentsForPerson(2, 2);

  const p1LoanPaymentsQ1 = calculateLoanPaymentsReceivedForPerson(1, 1);
  const p1LoanPaymentsQ2 = calculateLoanPaymentsReceivedForPerson(1, 2);
  const p2LoanPaymentsQ1 = calculateLoanPaymentsReceivedForPerson(2, 1);
  const p2LoanPaymentsQ2 = calculateLoanPaymentsReceivedForPerson(2, 2);

  // Disponible = Neto - Gastos - Ahorros - TasaCero - Deudas + PréstamosRecuperados
  const p1AvailableQ1 = p1NetQ1 - p1ExpensesQ1 - p1SavingsQ1 - p1ZeroInterestQ1 - p1DebtPaymentsQ1 + p1LoanPaymentsQ1;
  const p1AvailableQ2 = p1NetQ2 - p1ExpensesQ2 - p1SavingsQ2 - p1ZeroInterestQ2 - p1DebtPaymentsQ2 + p1LoanPaymentsQ2;
  const p2AvailableQ1 = p2NetQ1 - p2ExpensesQ1 - p2SavingsQ1 - p2ZeroInterestQ1 - p2DebtPaymentsQ1 + p2LoanPaymentsQ1;
  const p2AvailableQ2 = p2NetQ2 - p2ExpensesQ2 - p2SavingsQ2 - p2ZeroInterestQ2 - p2DebtPaymentsQ2 + p2LoanPaymentsQ2;

  const totalAvailableQ1 = p1AvailableQ1 + p2AvailableQ1;
  const totalAvailableQ2 = p1AvailableQ2 + p2AvailableQ2;

  // Datos de la persona activa
  const activePerson = activeTab === 'person1' ? person1 : person2;
  const setActivePerson = activeTab === 'person1' ? setPerson1 : setPerson2;
  const activeGif = activeTab === 'person1' ? jouskcaminaGif : kishcaminandoGif;
  const activeOwner = activeTab;

  return (
    <div className="lg:sticky lg:top-8 space-y-4">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          <h2 className="text-lg sm:text-xl font-bold">Resumen Individual</h2>
        </div>

        <div className="space-y-4">
          {/* Persona activa */}
          <div className="bg-white/10 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <img
                src={activeGif}
                alt={activePerson.name}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
                style={{ imageRendering: 'pixelated' }}
              />
              <OptimizedInput
                type="text"
                value={activePerson.name}
                onSave={(value) => setActivePerson({ ...activePerson, name: value as string })}
                className="bg-white/20 border border-white/30 rounded-lg px-2 sm:px-3 py-1 text-white font-semibold text-base sm:text-lg outline-none focus:ring-2 focus:ring-white/50 flex-1 min-w-0"
                placeholder="Nombre"
              />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-90">Salario Bruto</span>
                <span className="font-medium">{formatCurrency(activePerson.grossSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-90">Salario Neto</span>
                <span className="font-medium">{formatCurrency(calculatePersonNetSalary(activePerson))}</span>
              </div>
              {loans.filter(l => (l.shared || l.owner === activeOwner) && !l.archived).length > 0 && (
                <div className="flex justify-between border-t border-white/20 pt-2">
                  <span className="opacity-90">Prestado (Total)</span>
                  <span className="font-medium text-amber-200">
                    {formatCurrency(loans.filter(l => (l.shared || l.owner === activeOwner) && !l.archived).reduce((sum, l) => sum + l.totalAmount, 0))}
                  </span>
                </div>
              )}
              {incomingLoans.filter(l => (l.shared || l.owner === activeOwner) && !l.archived).length > 0 && (
                <div className="flex justify-between">
                  <span className="opacity-90">Debes (Pendiente)</span>
                  <span className="font-medium text-orange-200">
                    -{formatCurrency(incomingLoans.filter(l => (l.shared || l.owner === activeOwner) && !l.archived).reduce((sum, l) => {
                      // Calcular cuánto se ha pagado de esta deuda en todos los meses
                      const paidAmount = payments.filter(p =>
                        p.type === 'incomingLoan' &&
                        p.referenceId === l.id &&
                        p.isPaid
                      ).reduce((paidSum, p) => paidSum + p.amount, 0);
                      return sum + (l.totalAmount - paidAmount);
                    }, 0))}
                  </span>
                </div>
              )}
              {credits.filter(c => c.owner === activeOwner).length > 0 && (
                <div className="flex justify-between">
                  <span className="opacity-90">Deuda TC</span>
                  <span className="font-medium text-red-200">
                    -{formatCurrency(credits.filter(c => c.owner === activeOwner).reduce((sum, c) => sum + c.currentBalance, 0))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Total de la pareja */}
          <div className="bg-white/20 rounded-lg p-3 sm:p-4">
            <div className="flex justify-between items-center gap-2">
              <span className="font-bold text-sm sm:text-base">Total Neto Pareja</span>
              <span className="font-bold text-lg sm:text-2xl">
                {formatCurrency(calculatePersonNetSalary(person1) + calculatePersonNetSalary(person2))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Disponible por Quincena</h3>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Persona activa */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">{activePerson.name}</h4>

            <div className="space-y-3">
              <div className="bg-white/50 rounded-lg p-2">
                <div className="text-xs font-medium text-indigo-600 mb-1">Quincena 1</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Neto</span>
                    <span>{formatCurrency(activeTab === 'person1' ? p1NetQ1 : p2NetQ1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gastos</span>
                    <span className="text-red-600">-{formatCurrency(activeTab === 'person1' ? p1ExpensesQ1 : p2ExpensesQ1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ahorro</span>
                    <span className="text-emerald-600">-{formatCurrency(activeTab === 'person1' ? p1SavingsQ1 : p2SavingsQ1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deuda</span>
                    <span className="text-red-600">-{formatCurrency(activeTab === 'person1' ? p1DebtPaymentsQ1 : p2DebtPaymentsQ1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Préstamos</span>
                    <span className="text-green-600">+{formatCurrency(activeTab === 'person1' ? p1LoanPaymentsQ1 : p2LoanPaymentsQ1)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-indigo-200">
                    <span>Disponible</span>
                    <span className="text-indigo-600">{formatCurrency(activeTab === 'person1' ? p1AvailableQ1 : p2AvailableQ1)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 rounded-lg p-2">
                <div className="text-xs font-medium text-indigo-600 mb-1">Quincena 2</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Neto</span>
                    <span>{formatCurrency(activeTab === 'person1' ? p1NetQ2 : p2NetQ2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gastos</span>
                    <span className="text-red-600">-{formatCurrency(activeTab === 'person1' ? p1ExpensesQ2 : p2ExpensesQ2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ahorro</span>
                    <span className="text-emerald-600">-{formatCurrency(activeTab === 'person1' ? p1SavingsQ2 : p2SavingsQ2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deuda</span>
                    <span className="text-red-600">-{formatCurrency(activeTab === 'person1' ? p1DebtPaymentsQ2 : p2DebtPaymentsQ2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Préstamos</span>
                    <span className="text-green-600">+{formatCurrency(activeTab === 'person1' ? p1LoanPaymentsQ2 : p2LoanPaymentsQ2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-indigo-200">
                    <span>Disponible</span>
                    <span className="text-indigo-600">{formatCurrency(activeTab === 'person1' ? p1AvailableQ2 : p2AvailableQ2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-100 rounded-lg p-2">
                <div className="flex justify-between font-bold text-indigo-900 text-xs sm:text-sm">
                  <span>Total Mensual</span>
                  <span>{formatCurrency(activeTab === 'person1' ? (p1AvailableQ1 + p1AvailableQ2) : (p2AvailableQ1 + p2AvailableQ2))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Pareja */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 sm:p-4 border-2 border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm sm:text-base">Total Disponible Pareja</span>
              <span className="font-bold text-green-700 text-base sm:text-xl">{formatCurrency(totalAvailableQ1 + totalAvailableQ2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Promedio semanal</span>
              <span className="font-semibold">{formatCurrency((totalAvailableQ1 + totalAvailableQ2) / 4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
