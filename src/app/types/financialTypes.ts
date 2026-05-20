export interface Deduction {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  isPercentage: boolean;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  quincena: 1 | 2 | 'both';
  shared: boolean;
  splitType?: 'percentage' | 'amount';
  splitPercentageP1?: number;
  splitAmountP1?: number;
  owner?: 'person1' | 'person2';
  isRecurring?: boolean; // Si es un gasto recurrente que se copia al siguiente mes
  categoryPreset?: string; // Categoría predefinida (Uber, Gasolina, etc.)
}

// DEPRECATED - Solo para migración
export interface SavingPayment {
  id: string;
  amount: number;
  quincena: 1 | 2;
  isPaid: boolean;
  paidDate?: string;
}

export interface Saving {
  id: string;
  name: string;
  shared: boolean;
  splitType?: 'percentage' | 'amount';
  splitPercentageP1?: number;
  owner?: 'person1' | 'person2';
  isGoal?: boolean; // Si es meta con objetivo
  targetAmount?: number; // Monto objetivo (solo si isGoal = true)
  deadline?: string; // Fecha límite (solo si isGoal = true)
  archived?: boolean;

  // DEPRECATED - Solo para compatibilidad con datos antiguos
  amountQ1?: number;
  amountQ2?: number;
  totalAmount?: number;
  payments?: SavingPayment[];
  currentAmount?: number;
  splitAmountP1Q1?: number;
  splitAmountP1Q2?: number;
}

// DEPRECATED - Solo para migración
export interface LoanPayment {
  id: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
}

export interface Loan {
  id: string;
  name: string; // A quién le prestaste
  totalAmount: number; // Monto total prestado
  dateLent: string; // Fecha en que prestaste
  owner: 'person1' | 'person2';
  archived?: boolean;
  shared?: boolean; // Si es compartido entre ambos
  splitType?: 'percentage' | 'amount';
  splitPercentageP1?: number;

  // DEPRECATED - Solo para compatibilidad con datos antiguos
  payments?: LoanPayment[];
}

// DEPRECATED - Solo para migración
export interface DebtPayment {
  id: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
}

export interface IncomingLoan {
  id: string;
  name: string; // A quién le debemos
  totalAmount: number; // Monto total que debemos
  dateReceived: string; // Fecha en que recibimos el préstamo
  owner: 'person1' | 'person2';
  archived?: boolean;
  shared?: boolean; // Si es compartido entre ambos
  splitType?: 'percentage' | 'amount';
  splitPercentageP1?: number;

  // DEPRECATED - Solo para compatibilidad con datos antiguos
  payments?: DebtPayment[];
}

export interface Credit {
  id: string;
  name: string;
  creditLimit: number;
  currentBalance: number;
  paymentDate: number;
  minimumPayment: number;
  owner: 'person1' | 'person2';
  hasZeroInterest?: boolean; // Si tiene un plan de tasa cero
  totalInstallments?: number; // Total de cuotas del plan
  installmentsPaid?: number; // Cuotas pagadas hasta ahora
  installmentAmount?: number; // Monto de cada cuota
}

export interface OtherDeduction {
  id: string;
  name: string;
  amountQ1: number;
  amountQ2: number;
}

export interface PersonData {
  name: string;
  grossSalary: number;
  dollarRate: number;
  deductions: Deduction[];
  otherDeductions: OtherDeduction[];
}

export interface Payment {
  id: string;
  type: 'loan' | 'incomingLoan' | 'saving'; // Tipo de entidad
  referenceId: string; // ID del loan/incomingLoan/saving global
  amount: number;
  quincena?: 1 | 2; // Para savings
  dueDate?: string; // Para loans/incomingLoans
  isPaid: boolean;
  paidDate?: string;
  owner: 'person1' | 'person2'; // Quién hace el pago
}

export interface MonthlyData {
  year: number;
  month: number;
  person1: PersonData;
  person2: PersonData;
  expenses: Expense[];
  credits: Credit[];
  payments: Payment[]; // Pagos del mes a préstamos/deudas/ahorros globales

  // DEPRECATED - Solo para migración de datos antiguos
  savings?: Saving[];
  loans?: Loan[];
  incomingLoans?: IncomingLoan[];
}
