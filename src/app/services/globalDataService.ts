import { Loan, IncomingLoan, Saving } from '../types/financialTypes';
import { supabase } from '../../lib/supabase';

const LOANS_KEY = 'global_loans';
const INCOMING_LOANS_KEY = 'global_incoming_loans';
const SAVINGS_KEY = 'global_savings';

const SUPABASE_TABLE_LOANS = 'global_loans';
const SUPABASE_TABLE_INCOMING = 'global_incoming_loans';
const SUPABASE_TABLE_SAVINGS = 'global_savings';

function readFromLocalStorage<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T[] : [];
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return [];
  }
}

function saveToLocalStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    throw error;
  }
}

export async function saveLoans(loans: Loan[]): Promise<void> {
  if (supabase) {
    try {
      const payload = loans.map(loan => ({ id: loan.id, data: loan }));
      const { error } = await supabase
        .from(SUPABASE_TABLE_LOANS)
        .upsert(payload);

      if (!error) return;

      throw error;
    } catch (error) {
      console.error('Supabase saveLoans failed, falling back to localStorage:', error);
    }
  }

  saveToLocalStorage<Loan>(LOANS_KEY, loans);
}

export async function getLoans(): Promise<Loan[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_LOANS)
        .select('*');

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => row.data as Loan).filter(Boolean);
      }

      if (error) throw error;
    } catch (error) {
      console.error('Supabase getLoans failed, falling back to localStorage:', error);
    }
  }

  return readFromLocalStorage<Loan>(LOANS_KEY);
}

export async function saveIncomingLoans(incomingLoans: IncomingLoan[]): Promise<void> {
  if (supabase) {
    try {
      const payload = incomingLoans.map(l => ({ id: l.id, data: l }));
      const { error } = await supabase
        .from(SUPABASE_TABLE_INCOMING)
        .upsert(payload);

      if (!error) return;

      throw error;
    } catch (error) {
      console.error('Supabase saveIncomingLoans failed, falling back to localStorage:', error);
    }
  }

  saveToLocalStorage<IncomingLoan>(INCOMING_LOANS_KEY, incomingLoans);
}

export async function getIncomingLoans(): Promise<IncomingLoan[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_INCOMING)
        .select('*');

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => row.data as IncomingLoan).filter(Boolean);
      }

      if (error) throw error;
    } catch (error) {
      console.error('Supabase getIncomingLoans failed, falling back to localStorage:', error);
    }
  }

  return readFromLocalStorage<IncomingLoan>(INCOMING_LOANS_KEY);
}

export async function saveSavings(savings: Saving[]): Promise<void> {
  if (supabase) {
    try {
      const payload = savings.map(s => ({ id: s.id, data: s }));
      const { error } = await supabase
        .from(SUPABASE_TABLE_SAVINGS)
        .upsert(payload);

      if (!error) return;

      throw error;
    } catch (error) {
      console.error('Supabase saveSavings failed, falling back to localStorage:', error);
    }
  }

  saveToLocalStorage<Saving>(SAVINGS_KEY, savings);
}

export async function getSavings(): Promise<Saving[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_SAVINGS)
        .select('*');

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => row.data as Saving).filter(Boolean);
      }

      if (error) throw error;
    } catch (error) {
      console.error('Supabase getSavings failed, falling back to localStorage:', error);
    }
  }

  return readFromLocalStorage<Saving>(SAVINGS_KEY);
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
