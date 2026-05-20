/**
 * SERVICIO DE BASE DE DATOS
 *
 * Este archivo maneja la conexión con la base de datos PostgreSQL/Supabase.
 * Actualmente usa localStorage como fallback, pero está preparado para
 * conectarse a una base de datos real.
 */

import type { MonthlyData, Expense, Saving, Loan, IncomingLoan, Credit, Deduction, OtherDeduction } from '../app/types/financialTypes';

// ============================================
// CONFIGURACIÓN
// ============================================

interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

// Configuración de la base de datos
// Leer desde variables de entorno
const dbConfig: DatabaseConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  // Para PostgreSQL directo:
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
  database: import.meta.env.VITE_DB_NAME || 'financial_db',
  user: import.meta.env.VITE_DB_USER || 'postgres',
  password: import.meta.env.VITE_DB_PASSWORD || '',
};

// ============================================
// CLIENTE DE BASE DE DATOS
// ============================================

class DatabaseClient {
  private supabaseClient: any = null;
  private isConnected = false;
  private useLocalStorage = true; // Por defecto usar localStorage hasta configurar DB

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Intentar conectar con Supabase si está configurado
      if (dbConfig.supabaseUrl && dbConfig.supabaseKey) {
        await this.connectSupabase();
      }
      // Si no hay Supabase, intentar PostgreSQL directo (requiere backend)
      // else if (dbConfig.host && dbConfig.password) {
      //   await this.connectPostgreSQL();
      // }
    } catch (error) {
      console.warn('No database connection available, using localStorage:', error);
      this.useLocalStorage = true;
    }
  }

  private async connectSupabase() {
    // Implementación con Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      this.supabaseClient = createClient(
        dbConfig.supabaseUrl!,
        dbConfig.supabaseKey!
      );
      this.isConnected = true;
      this.useLocalStorage = false;
      console.log('✅ Connected to Supabase');
    } catch (error) {
      console.error('Failed to connect to Supabase:', error);
      throw error;
    }
  }

  // ============================================
  // MONTHLY DATA
  // ============================================

  async getMonthlyData(coupleId: string, year: number, month: number): Promise<MonthlyData | null> {
    if (this.useLocalStorage) {
      return this.getMonthlyDataFromLocalStorage(year, month);
    }

    try {
      const { data, error } = await this.supabaseClient
        .from('monthly_data')
        .select(`
          *,
          deductions (*),
          other_deductions (*),
          expenses (*),
          savings (*),
          loans (*),
          incoming_loans (*),
          credits (*)
        `)
        .eq('couple_id', coupleId)
        .eq('year', year)
        .eq('month', month)
        .single();

      if (error) throw error;
      return this.mapDatabaseToMonthlyData(data);
    } catch (error) {
      console.error('Error getting monthly data:', error);
      return null;
    }
  }

  async getAllMonthlyData(coupleId: string): Promise<MonthlyData[]> {
    if (this.useLocalStorage) {
      return this.getAllMonthlyDataFromLocalStorage();
    }

    try {
      const { data, error } = await this.supabaseClient
        .from('monthly_data')
        .select(`
          *,
          deductions (*),
          other_deductions (*),
          expenses (*),
          savings (*),
          loans (*),
          incoming_loans (*),
          credits (*)
        `)
        .eq('couple_id', coupleId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      return data.map((d: any) => this.mapDatabaseToMonthlyData(d));
    } catch (error) {
      console.error('Error getting all monthly data:', error);
      return [];
    }
  }

  async saveMonthlyData(coupleId: string, data: MonthlyData): Promise<void> {
    if (this.useLocalStorage) {
      return this.saveMonthlyDataToLocalStorage(data);
    }

    try {
      // Primero guardar o actualizar monthly_data
      const { data: monthlyDataResult, error: monthlyError } = await this.supabaseClient
        .from('monthly_data')
        .upsert({
          couple_id: coupleId,
          year: data.year,
          month: data.month,
          person1_name: data.person1.name,
          person1_gross_salary: data.person1.grossSalary,
          person1_dollar_rate: data.person1.dollarRate,
          person2_name: data.person2.name,
          person2_gross_salary: data.person2.grossSalary,
          person2_dollar_rate: data.person2.dollarRate,
        }, {
          onConflict: 'couple_id,year,month'
        })
        .select()
        .single();

      if (monthlyError) throw monthlyError;
      const monthlyDataId = monthlyDataResult.id;

      // Guardar datos relacionados
      await this.saveRelatedData(monthlyDataId, data);
    } catch (error) {
      console.error('Error saving monthly data:', error);
      throw error;
    }
  }

  private async saveRelatedData(monthlyDataId: string, data: MonthlyData) {
    // Eliminar datos antiguos (los pagos se eliminan automáticamente por CASCADE)
    await Promise.all([
      this.supabaseClient.from('deductions').delete().eq('monthly_data_id', monthlyDataId),
      this.supabaseClient.from('other_deductions').delete().eq('monthly_data_id', monthlyDataId),
      this.supabaseClient.from('expenses').delete().eq('monthly_data_id', monthlyDataId),
      this.supabaseClient.from('savings').delete().eq('monthly_data_id', monthlyDataId),
      this.supabaseClient.from('loans').delete().eq('monthly_data_id', monthlyDataId), // loan_payments se eliminan por CASCADE
      this.supabaseClient.from('incoming_loans').delete().eq('monthly_data_id', monthlyDataId), // debt_payments se eliminan por CASCADE
      this.supabaseClient.from('credits').delete().eq('monthly_data_id', monthlyDataId),
    ]);

    // Insertar nuevos datos
    const inserts = [];

    // Deductions
    if (data.person1.deductions.length > 0) {
      inserts.push(
        this.supabaseClient.from('deductions').insert(
          data.person1.deductions.map(d => ({
            monthly_data_id: monthlyDataId,
            owner: 'person1',
            name: d.name,
            amount: d.amount,
            percentage: d.percentage,
            is_percentage: d.isPercentage,
          }))
        )
      );
    }

    if (data.person2.deductions.length > 0) {
      inserts.push(
        this.supabaseClient.from('deductions').insert(
          data.person2.deductions.map(d => ({
            monthly_data_id: monthlyDataId,
            owner: 'person2',
            name: d.name,
            amount: d.amount,
            percentage: d.percentage,
            is_percentage: d.isPercentage,
          }))
        )
      );
    }

    // Other Deductions
    if (data.person1.otherDeductions.length > 0) {
      inserts.push(
        this.supabaseClient.from('other_deductions').insert(
          data.person1.otherDeductions.map(d => ({
            monthly_data_id: monthlyDataId,
            owner: 'person1',
            name: d.name,
            amount_q1: d.amountQ1,
            amount_q2: d.amountQ2,
          }))
        )
      );
    }

    if (data.person2.otherDeductions.length > 0) {
      inserts.push(
        this.supabaseClient.from('other_deductions').insert(
          data.person2.otherDeductions.map(d => ({
            monthly_data_id: monthlyDataId,
            owner: 'person2',
            name: d.name,
            amount_q1: d.amountQ1,
            amount_q2: d.amountQ2,
          }))
        )
      );
    }

    // Expenses
    if (data.expenses.length > 0) {
      inserts.push(
        this.supabaseClient.from('expenses').insert(
          data.expenses.map(e => ({
            monthly_data_id: monthlyDataId,
            name: e.name,
            amount: e.amount,
            quincena: String(e.quincena),
            shared: e.shared,
            split_type: e.splitType,
            split_percentage_p1: e.splitPercentageP1,
            split_amount_p1: e.splitAmountP1,
            owner: e.owner,
            is_recurring: e.isRecurring,
            category_preset: e.categoryPreset,
          }))
        )
      );
    }

    // Savings
    if (data.savings.length > 0) {
      inserts.push(
        this.supabaseClient.from('savings').insert(
          data.savings.map(s => ({
            monthly_data_id: monthlyDataId,
            name: s.name,
            amount_q1: s.amountQ1,
            amount_q2: s.amountQ2,
            shared: s.shared,
            split_type: s.splitType,
            split_percentage_p1: s.splitPercentageP1,
            split_amount_p1_q1: s.splitAmountP1Q1,
            split_amount_p1_q2: s.splitAmountP1Q2,
            owner: s.owner,
            is_goal: s.isGoal,
            target_amount: s.targetAmount,
            current_amount: s.currentAmount,
            deadline: s.deadline,
            archived: s.archived || false,
          }))
        )
      );
    }

    // Loans (con pagos)
    if (data.loans.length > 0) {
      for (const loan of data.loans) {
        const { data: loanResult, error: loanError } = await this.supabaseClient
          .from('loans')
          .insert({
            monthly_data_id: monthlyDataId,
            name: loan.name,
            total_amount: loan.totalAmount,
            date_lent: loan.dateLent,
            owner: loan.owner,
            archived: loan.archived || false,
          })
          .select()
          .single();

        if (loanError) throw loanError;

        // Insertar pagos del préstamo
        if (loan.payments && loan.payments.length > 0) {
          await this.supabaseClient.from('loan_payments').insert(
            loan.payments.map(p => ({
              loan_id: loanResult.id,
              amount: p.amount,
              due_date: p.dueDate,
              is_paid: p.isPaid,
              paid_date: p.paidDate,
            }))
          );
        }
      }
    }

    // Incoming Loans / Debts (con pagos)
    if (data.incomingLoans.length > 0) {
      for (const debt of data.incomingLoans) {
        const { data: debtResult, error: debtError } = await this.supabaseClient
          .from('incoming_loans')
          .insert({
            monthly_data_id: monthlyDataId,
            name: debt.name,
            total_amount: debt.totalAmount,
            date_received: debt.dateReceived,
            owner: debt.owner,
            archived: debt.archived || false,
          })
          .select()
          .single();

        if (debtError) throw debtError;

        // Insertar pagos de la deuda
        if (debt.payments && debt.payments.length > 0) {
          await this.supabaseClient.from('debt_payments').insert(
            debt.payments.map(p => ({
              incoming_loan_id: debtResult.id,
              amount: p.amount,
              due_date: p.dueDate,
              is_paid: p.isPaid,
              paid_date: p.paidDate,
            }))
          );
        }
      }
    }

    // Credits
    if (data.credits.length > 0) {
      inserts.push(
        this.supabaseClient.from('credits').insert(
          data.credits.map(c => ({
            monthly_data_id: monthlyDataId,
            name: c.name,
            credit_limit: c.creditLimit,
            current_balance: c.currentBalance,
            payment_date: c.paymentDate,
            minimum_payment: c.minimumPayment,
            owner: c.owner,
            has_zero_interest: c.hasZeroInterest,
            total_installments: c.totalInstallments,
            installments_paid: c.installmentsPaid,
            installment_amount: c.installmentAmount,
          }))
        )
      );
    }

    await Promise.all(inserts);
  }

  // ============================================
  // MAPEO DE DATOS
  // ============================================

  private mapDatabaseToMonthlyData(dbData: any): MonthlyData {
    return {
      year: dbData.year,
      month: dbData.month,
      person1: {
        name: dbData.person1_name,
        grossSalary: dbData.person1_gross_salary,
        dollarRate: dbData.person1_dollar_rate,
        deductions: dbData.deductions?.filter((d: any) => d.owner === 'person1').map(this.mapDeduction) || [],
        otherDeductions: dbData.other_deductions?.filter((d: any) => d.owner === 'person1').map(this.mapOtherDeduction) || [],
      },
      person2: {
        name: dbData.person2_name,
        grossSalary: dbData.person2_gross_salary,
        dollarRate: dbData.person2_dollar_rate,
        deductions: dbData.deductions?.filter((d: any) => d.owner === 'person2').map(this.mapDeduction) || [],
        otherDeductions: dbData.other_deductions?.filter((d: any) => d.owner === 'person2').map(this.mapOtherDeduction) || [],
      },
      expenses: dbData.expenses?.map(this.mapExpense) || [],
      savings: dbData.savings?.map(this.mapSaving) || [],
      loans: dbData.loans?.map(this.mapLoan) || [],
      incomingLoans: dbData.incoming_loans?.map(this.mapIncomingLoan) || [],
      credits: dbData.credits?.map(this.mapCredit) || [],
    };
  }

  private mapDeduction(d: any): Deduction {
    return {
      id: d.id,
      name: d.name,
      amount: d.amount,
      percentage: d.percentage,
      isPercentage: d.is_percentage,
    };
  }

  private mapOtherDeduction(d: any): OtherDeduction {
    return {
      id: d.id,
      name: d.name,
      amountQ1: d.amount_q1,
      amountQ2: d.amount_q2,
    };
  }

  private mapExpense(e: any): Expense {
    return {
      id: e.id,
      name: e.name,
      amount: e.amount,
      quincena: e.quincena === 'both' ? 'both' : parseInt(e.quincena),
      shared: e.shared,
      splitType: e.split_type,
      splitPercentageP1: e.split_percentage_p1,
      splitAmountP1: e.split_amount_p1,
      owner: e.owner,
      isRecurring: e.is_recurring,
      categoryPreset: e.category_preset,
    };
  }

  private mapSaving(s: any): Saving {
    return {
      id: s.id,
      name: s.name,
      amountQ1: s.amount_q1,
      amountQ2: s.amount_q2,
      shared: s.shared,
      splitType: s.split_type,
      splitPercentageP1: s.split_percentage_p1,
      splitAmountP1Q1: s.split_amount_p1_q1,
      splitAmountP1Q2: s.split_amount_p1_q2,
      owner: s.owner,
      isGoal: s.is_goal,
      targetAmount: s.target_amount,
      currentAmount: s.current_amount,
      deadline: s.deadline,
      archived: s.archived || false,
    };
  }

  private mapLoan(l: any): Loan {
    // Si viene de la función get_monthly_data_complete, l tiene estructura { loan: {...}, payments: [...] }
    const loanData = l.loan || l;
    const payments = l.payments || [];

    return {
      id: loanData.id,
      name: loanData.name,
      totalAmount: loanData.total_amount,
      dateLent: loanData.date_lent,
      payments: payments.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        dueDate: p.due_date,
        isPaid: p.is_paid,
        paidDate: p.paid_date,
      })),
      owner: loanData.owner,
      archived: loanData.archived || false,
    };
  }

  private mapIncomingLoan(il: any): IncomingLoan {
    // Si viene de la función get_monthly_data_complete, il tiene estructura { debt: {...}, payments: [...] }
    const debtData = il.debt || il;
    const payments = il.payments || [];

    return {
      id: debtData.id,
      name: debtData.name,
      totalAmount: debtData.total_amount,
      dateReceived: debtData.date_received,
      payments: payments.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        dueDate: p.due_date,
        isPaid: p.is_paid,
        paidDate: p.paid_date,
      })),
      owner: debtData.owner,
      archived: debtData.archived || false,
    };
  }

  private mapCredit(c: any): Credit {
    return {
      id: c.id,
      name: c.name,
      creditLimit: c.credit_limit,
      currentBalance: c.current_balance,
      paymentDate: c.payment_date,
      minimumPayment: c.minimum_payment,
      owner: c.owner,
      hasZeroInterest: c.has_zero_interest,
      totalInstallments: c.total_installments,
      installmentsPaid: c.installments_paid,
      installmentAmount: c.installment_amount,
    };
  }

  // ============================================
  // FALLBACK: LOCAL STORAGE
  // ============================================

  private getMonthlyDataFromLocalStorage(year: number, month: number): MonthlyData | null {
    const key = `financial-data-${year}-${month}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private getAllMonthlyDataFromLocalStorage(): MonthlyData[] {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('financial-data-'));
    return allKeys.map(key => JSON.parse(localStorage.getItem(key)!));
  }

  private saveMonthlyDataToLocalStorage(data: MonthlyData): void {
    const key = `financial-data-${data.year}-${data.month}`;
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// Exportar instancia única
export const db = new DatabaseClient();
