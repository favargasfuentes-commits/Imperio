import { Loan, IncomingLoan, Saving } from '../types/financialTypes';

const LOANS_KEY = 'global_loans';
const INCOMING_LOANS_KEY = 'global_incoming_loans';
const SAVINGS_KEY = 'global_savings';

export async function saveLoans(loans: Loan[]): Promise<void> {
  try {
    localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
  } catch (error) {
    console.error('Error saving loans:', error);
    throw error;
  }
}

export async function getLoans(): Promise<Loan[]> {
  try {
    const stored = localStorage.getItem(LOANS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting loans:', error);
    return [];
  }
}

export async function saveIncomingLoans(incomingLoans: IncomingLoan[]): Promise<void> {
  try {
    localStorage.setItem(INCOMING_LOANS_KEY, JSON.stringify(incomingLoans));
  } catch (error) {
    console.error('Error saving incoming loans:', error);
    throw error;
  }
}

export async function getIncomingLoans(): Promise<IncomingLoan[]> {
  try {
    const stored = localStorage.getItem(INCOMING_LOANS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting incoming loans:', error);
    return [];
  }
}

export async function saveSavings(savings: Saving[]): Promise<void> {
  try {
    localStorage.setItem(SAVINGS_KEY, JSON.stringify(savings));
  } catch (error) {
    console.error('Error saving savings:', error);
    throw error;
  }
}

export async function getSavings(): Promise<Saving[]> {
  try {
    const stored = localStorage.getItem(SAVINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting savings:', error);
    return [];
  }
}

export async function migrateToGlobalData(monthlyDataHistory: any[]): Promise<{
  loans: Loan[];
  incomingLoans: IncomingLoan[];
  savings: Saving[];
  updatedMonthlyData: any[];
}> {
  const loansMap = new Map<string, Loan>();
  const incomingLoansMap = new Map<string, IncomingLoan>();
  const savingsMap = new Map<string, Saving>();
  const updatedMonthlyData: any[] = [];

  for (const monthData of monthlyDataHistory) {
    const monthPayments: any[] = monthData.payments || [];

    if (monthData.loans && Array.isArray(monthData.loans)) {
      for (const loan of monthData.loans) {
        if (!loansMap.has(loan.id)) {
          const { payments, ...loanWithoutPayments } = loan;
          loansMap.set(loan.id, loanWithoutPayments);
        }

        if (loan.payments && Array.isArray(loan.payments)) {
          for (const payment of loan.payments) {
            monthPayments.push({
              id: payment.id || `${loan.id}-${Date.now()}-${Math.random()}`,
              type: 'loan',
              referenceId: loan.id,
              amount: payment.amount,
              dueDate: payment.dueDate,
              isPaid: payment.isPaid || false,
              paidDate: payment.paidDate,
              owner: loan.owner
            });
          }
        }
      }
    }

    if (monthData.incomingLoans && Array.isArray(monthData.incomingLoans)) {
      for (const loan of monthData.incomingLoans) {
        if (!incomingLoansMap.has(loan.id)) {
          const { payments, ...loanWithoutPayments } = loan;
          incomingLoansMap.set(loan.id, loanWithoutPayments);
        }

        if (loan.payments && Array.isArray(loan.payments)) {
          for (const payment of loan.payments) {
            monthPayments.push({
              id: payment.id || `${loan.id}-${Date.now()}-${Math.random()}`,
              type: 'incomingLoan',
              referenceId: loan.id,
              amount: payment.amount,
              dueDate: payment.dueDate,
              isPaid: payment.isPaid || false,
              paidDate: payment.paidDate,
              owner: loan.owner
            });
          }
        }
      }
    }

    if (monthData.savings && Array.isArray(monthData.savings)) {
      for (const saving of monthData.savings) {
        if (!savingsMap.has(saving.id)) {
          const { payments, amountQ1, amountQ2, currentAmount, totalAmount, splitAmountP1Q1, splitAmountP1Q2, ...savingClean } = saving;
          savingsMap.set(saving.id, savingClean);
        }

        if (saving.payments && Array.isArray(saving.payments)) {
          for (const payment of saving.payments) {
            monthPayments.push({
              id: payment.id || `${saving.id}-${Date.now()}-${Math.random()}`,
              type: 'saving',
              referenceId: saving.id,
              amount: payment.amount,
              quincena: payment.quincena,
              isPaid: payment.isPaid || false,
              paidDate: payment.paidDate,
              owner: saving.owner || 'person1'
            });
          }
        }
      }
    }

    const { loans, incomingLoans, savings, ...cleanMonthData } = monthData;
    updatedMonthlyData.push({
      ...cleanMonthData,
      payments: monthPayments
    });
  }

  return {
    loans: Array.from(loansMap.values()),
    incomingLoans: Array.from(incomingLoansMap.values()),
    savings: Array.from(savingsMap.values()),
    updatedMonthlyData
  };
}
