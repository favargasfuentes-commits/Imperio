import { AlertTriangle, AlertCircle, Clock, CreditCard, HandCoins, Calendar } from 'lucide-react';
import { PersonData, Expense, Saving, Loan, Credit, Payment } from '../App';

interface AlertsSectionProps {
  person1: PersonData;
  person2: PersonData;
  expenses: Expense[];
  savings: Saving[];
  loans: Loan[];
  credits: Credit[];
  payments: Payment[];
  activeTab: 'person1' | 'person2';
}

interface Alert {
  type: 'critical' | 'warning' | 'info';
  icon: React.ReactNode;
  title: string;
  message: string;
}

export function AlertsSection({ person1, person2, expenses, savings, loans, credits, payments, activeTab }: AlertsSectionProps) {
  const alerts: Alert[] = [];
  const today = new Date();

  // Calcular disponible de una persona
  const calculatePersonAvailable = (person: PersonData, owner: 'person1' | 'person2') => {
    const totalDeductions = person.deductions.reduce((sum, d) => {
      if (d.isPercentage) {
        return sum + (person.grossSalary * (d.percentage / 100));
      }
      return sum + d.amount;
    }, 0);

    const netSalary = person.grossSalary - totalDeductions;
    const otherDeductions = person.otherDeductions.reduce((sum, d) => sum + d.amountQ1 + d.amountQ2, 0);
    const realNet = netSalary - otherDeductions;

    // Calcular gastos
    const personExpenses = expenses.reduce((sum, e) => {
      const totalAmount = e.quincena === 'both' ? e.amount : e.amount;
      const monthlyAmount = e.quincena === 'both' ? totalAmount : totalAmount;

      if (e.shared) {
        if (e.splitType === 'amount') {
          const amountP1 = e.splitAmountP1 || 0;
          const amountP2 = totalAmount - amountP1;
          return sum + (owner === 'person1' ? amountP1 : amountP2);
        } else {
          const percentage = owner === 'person1' ? (e.splitPercentageP1 || 50) : (100 - (e.splitPercentageP1 || 50));
          return sum + (monthlyAmount * percentage / 100);
        }
      } else if (e.owner === owner) {
        return sum + monthlyAmount;
      }
      return sum;
    }, 0);

    // Calcular ahorros y metas (basado en pagos YA pagados del mes actual)
    // ESTOS SE RESTAN porque son salidas de dinero
    const personSavings = savings.filter(s => !s.archived).reduce((sum, s) => {
      // Obtener pagos ya realizados de este ahorro/meta para este usuario
      const savingPayments = payments.filter(p =>
        p.type === 'saving' &&
        p.referenceId === s.id &&
        p.isPaid === true &&
        p.owner === owner
      );

      const total = savingPayments.reduce((pSum, p) => pSum + p.amount, 0);

      if (s.shared) {
        const percentage = owner === 'person1' ? (s.splitPercentageP1 || 50) : (100 - (s.splitPercentageP1 || 50));
        return sum + (total * percentage / 100);
      } else if (s.owner === owner) {
        return sum + total;
      }

      return sum;
    }, 0);

    // Calcular pagos de deudas ya realizados del mes actual
    // ESTOS SE RESTAN porque son salidas de dinero
    const personDebts = payments.filter(p =>
      p.type === 'incomingLoan' &&
      p.isPaid === true &&
      p.owner === owner
    ).reduce((sum, p) => sum + p.amount, 0);

    // Calcular pagos de préstamos que ya recibiste este mes
    // ESTOS SE SUMAN porque son ingresos
    const personLoanPayments = payments.filter(p =>
      p.type === 'loan' &&
      p.isPaid === true &&
      p.owner === owner
    ).reduce((sum, p) => sum + p.amount, 0);

    return realNet - personExpenses - personSavings - personDebts + personLoanPayments;
  };

  // Verificar si los gastos superan el ingreso
  const person1Available = calculatePersonAvailable(person1, 'person1');
  const person2Available = calculatePersonAvailable(person2, 'person2');

  if (activeTab === 'person1' && person1Available < 0) {
    alerts.push({
      type: 'critical',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: '¡DÉFICIT CRÍTICO!',
      message: `${person1.name} tiene un déficit de ₡${Math.abs(person1Available).toLocaleString('es-CR')}. Los gastos superan los ingresos.`
    });
  }

  if (activeTab === 'person2' && person2Available < 0) {
    alerts.push({
      type: 'critical',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: '¡DÉFICIT CRÍTICO!',
      message: `${person2.name} tiene un déficit de ₡${Math.abs(person2Available).toLocaleString('es-CR')}. Los gastos superan los ingresos.`
    });
  }

  // Verificar capacidad de pago de tarjetas
  const personCredits = credits.filter(c => c.owner === activeTab);
  const available = activeTab === 'person1' ? person1Available : person2Available;

  personCredits.forEach(credit => {
    if (available < credit.minimumPayment) {
      alerts.push({
        type: 'critical',
        icon: <CreditCard className="w-5 h-5" />,
        title: 'No alcanza para pago de tarjeta',
        message: `Falta ₡${(credit.minimumPayment - available).toLocaleString('es-CR')} para pagar el mínimo de "${credit.name}"`
      });
    }

    // Alerta de fecha de pago próxima
    const todayDay = today.getDate();
    const daysUntilPayment = credit.paymentDate >= todayDay
      ? credit.paymentDate - todayDay
      : (30 - todayDay) + credit.paymentDate;

    if (daysUntilPayment <= 3 && credit.currentBalance > 0) {
      alerts.push({
        type: 'warning',
        icon: <Clock className="w-5 h-5" />,
        title: 'Pago de tarjeta próximo',
        message: `"${credit.name}" vence en ${daysUntilPayment} día${daysUntilPayment !== 1 ? 's' : ''}. Saldo: ₡${credit.currentBalance.toLocaleString('es-CR')}`
      });
    }
  });

  // Verificar préstamos vencidos o próximos a vencer
  const personLoans = loans.filter(l => l.owner === activeTab && !l.archived);
  personLoans.forEach(loan => {
    if (loan.expectedReturn) {
      const returnDate = new Date(loan.expectedReturn);
      const diffTime = returnDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        alerts.push({
          type: 'warning',
          icon: <HandCoins className="w-5 h-5" />,
          title: 'Préstamo vencido',
          message: `El préstamo a "${loan.name}" venció hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}. Monto: ₡${loan.amount.toLocaleString('es-CR')}`
        });
      } else if (diffDays <= 7) {
        alerts.push({
          type: 'info',
          icon: <Calendar className="w-5 h-5" />,
          title: 'Préstamo próximo a vencer',
          message: `El préstamo a "${loan.name}" vence en ${diffDays} día${diffDays !== 1 ? 's' : ''}. Monto: ₡${loan.amount.toLocaleString('es-CR')}`
        });
      }
    }
  });

  // Verificar metas con fecha límite próxima o vencida
  const personGoals = savings.filter(s => s.isGoal && !s.archived && (s.shared || s.owner === activeTab));
  personGoals.forEach(goal => {
    if (goal.deadline && goal.targetAmount) {
      const deadlineDate = new Date(goal.deadline);
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const progress = ((goal.currentAmount || 0) / goal.targetAmount) * 100;

      if (diffDays < 0 && progress < 100) {
        alerts.push({
          type: 'warning',
          icon: <AlertCircle className="w-5 h-5" />,
          title: 'Meta no alcanzada',
          message: `La meta "${goal.name}" venció. Progreso: ${progress.toFixed(0)}%. Faltan ₡${(goal.targetAmount - (goal.currentAmount || 0)).toLocaleString('es-CR')}`
        });
      } else if (diffDays <= 14 && diffDays > 0 && progress < 80) {
        alerts.push({
          type: 'info',
          icon: <AlertCircle className="w-5 h-5" />,
          title: 'Meta en riesgo',
          message: `La meta "${goal.name}" vence en ${diffDays} días y vas al ${progress.toFixed(0)}%`
        });
      }
    }
  });

  // Alerta de bajo disponible (menos de 50k)
  if (available > 0 && available < 50000) {
    alerts.push({
      type: 'info',
      icon: <AlertCircle className="w-5 h-5" />,
      title: 'Disponible bajo',
      message: `Solo quedan ₡${available.toLocaleString('es-CR')} disponibles para el mes`
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 hover-lift">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
        Alertas y Recordatorios
      </h2>

      <div className="space-y-2 sm:space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`p-3 sm:p-4 rounded-lg border-l-4 ${
              alert.type === 'critical'
                ? 'bg-red-50 border-red-500'
                : alert.type === 'warning'
                ? 'bg-amber-50 border-amber-500'
                : 'bg-blue-50 border-blue-500'
            }`}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <div
                className={`flex-shrink-0 ${
                  alert.type === 'critical'
                    ? 'text-red-600'
                    : alert.type === 'warning'
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`}
              >
                {alert.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold text-xs sm:text-sm mb-1 ${
                    alert.type === 'critical'
                      ? 'text-red-800'
                      : alert.type === 'warning'
                      ? 'text-amber-800'
                      : 'text-blue-800'
                  }`}
                >
                  {alert.title}
                </h3>
                <p
                  className={`text-xs sm:text-sm ${
                    alert.type === 'critical'
                      ? 'text-red-700'
                      : alert.type === 'warning'
                      ? 'text-amber-700'
                      : 'text-blue-700'
                  }`}
                >
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
