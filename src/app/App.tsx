import { useState, useEffect } from 'react';
import { Calculator, Users, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Save, ShoppingCart, PiggyBank, HandCoins, TrendingDown, CreditCard, DollarSign } from 'lucide-react';
import { IncomeSection } from './components/IncomeSection';
import { DeductionsSection } from './components/DeductionsSection';
import { ExpensesSection } from './components/ExpensesSection';
import { SavingsSection } from './components/SavingsSection';
import { LoansSection } from './components/LoansSection';
import { IncomingLoansSection } from './components/IncomingLoansSection';
import { CreditSection } from './components/CreditSection';
import { AlertsSection } from './components/AlertsSection';
import { CoupleSummary } from './components/CoupleSummary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Toast } from './components/Toast';
import { ExportButton } from './components/ExportButton';
import { ImportButton } from './components/ImportButton';
import { ScrollToTop } from './components/ScrollToTop';
import { CollapsibleSection } from './components/CollapsibleSection';
import { GlobalEntitiesSection } from './components/GlobalEntitiesSection';
import { MonthlyPaymentsSection } from './components/MonthlyPaymentsSection';
import { OptimizedInput } from './components/OptimizedInput';
import { saveMonthlyData, getMonthlyData, getAllMonthlyData } from './services/dataService';
import {
  saveLoans,
  getLoans,
  saveIncomingLoans,
  getIncomingLoans,
  saveSavings,
  getSavings,
  migrateToGlobalData
} from './services/globalDataService';
import { setupMobileApp } from '../config/mobile';
import type { MonthlyData, PersonData, Expense, Saving, Loan, Credit, IncomingLoan, Payment } from './types/financialTypes';

const getDefaultMonthlyData = (year: number, month: number): MonthlyData => ({
  year,
  month,
  person1: {
    name: 'Persona 1',
    grossSalary: 1000000,
    dollarRate: 0,
    deductions: [
      { id: '1', name: 'CCSS (Enfermedad)', amount: 0, percentage: 10.67, isPercentage: true },
      { id: '2', name: 'CCSS (IVM)', amount: 0, percentage: 5.34, isPercentage: true },
      { id: '3', name: 'Asociación', amount: 50000, percentage: 5, isPercentage: false },
      { id: '4', name: 'Caridad', amount: 500, percentage: 0, isPercentage: false },
    ],
    otherDeductions: [
      { id: '1', name: 'Deducción 1', amountQ1: 45000, amountQ2: 159000 },
      { id: '2', name: 'Deducción 2', amountQ1: 12500, amountQ2: 0 },
    ],
  },
  person2: {
    name: 'Persona 2',
    grossSalary: 800000,
    dollarRate: 0,
    deductions: [
      { id: '1', name: 'CCSS (Enfermedad)', amount: 0, percentage: 10.67, isPercentage: true },
      { id: '2', name: 'CCSS (IVM)', amount: 0, percentage: 5.34, isPercentage: true },
    ],
    otherDeductions: [],
  },
  expenses: [
    { id: '1', name: 'Alquiler', amount: 300000, quincena: 1, shared: true, splitType: 'percentage', splitPercentageP1: 50 },
    { id: '2', name: 'Supermercado', amount: 100000, quincena: 'both', shared: true, splitType: 'percentage', splitPercentageP1: 50 },
    { id: '3', name: 'Gasto Personal P1', amount: 20000, quincena: 1, shared: false, owner: 'person1' },
  ],
  savings: [],
  loans: [],
  incomingLoans: [],
  credits: [],
  payments: [], // Pagos del mes
});

// Datos globales por defecto (se guardan separados)
const getDefaultGlobalSavings = (): Saving[] => [
  {
    id: 'default-1',
    name: 'Ahorro Vacaciones',
    shared: true,
    splitType: 'percentage',
    splitPercentageP1: 50,
    isGoal: false
  },
  {
    id: 'default-2',
    name: 'Ahorro Personal P1',
    shared: false,
    owner: 'person1' as 'person1' | 'person2',
    isGoal: false
  },
  {
    id: 'default-3',
    name: 'Viaje a Europa',
    shared: true,
    isGoal: true,
    targetAmount: 2000000,
    splitType: 'percentage',
    splitPercentageP1: 50
  },
];

export default function App() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-11

  const [monthlyDataHistory, setMonthlyDataHistory] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [activeTab, setActiveTab] = useState<'person1' | 'person2'>('person1');

  // Datos globales (persisten entre meses)
  const [loans, setLoansState] = useState<Loan[]>([]);
  const [incomingLoans, setIncomingLoansState] = useState<IncomingLoan[]>([]);
  const [savings, setSavingsState] = useState<Saving[]>([]);

  // Configurar aplicación móvil
  useEffect(() => {
    setupMobileApp();
  }, []);

  // Cargar datos al inicio
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Cargar datos mensuales
      const allData = await getAllMonthlyData();

      // Cargar datos globales
      let globalLoans = await getLoans();
      let globalIncomingLoans = await getIncomingLoans();
      let globalSavings = await getSavings();

      // MIGRACIÓN: Si hay datos mensuales pero no hay datos globales, migrar
      const hasOldData = allData.some(d => d.loans || d.incomingLoans || d.savings);
      const hasNoGlobalData = globalLoans.length === 0 && globalIncomingLoans.length === 0 && globalSavings.length === 0;

      if (hasOldData && hasNoGlobalData) {
        console.log('Migrando datos a estructura global...');
        const migrated = await migrateToGlobalData(allData);
        globalLoans = migrated.loans;
        globalIncomingLoans = migrated.incomingLoans;
        globalSavings = migrated.savings;

        // Guardar datos migrados
        await saveLoans(globalLoans);
        await saveIncomingLoans(globalIncomingLoans);
        await saveSavings(globalSavings);

        // Guardar monthly data actualizada con payments
        for (const monthData of migrated.updatedMonthlyData) {
          await saveMonthlyData(monthData);
        }

        // Recargar monthly data actualizada
        const reloadedData = await getAllMonthlyData();
        allData.length = 0;
        allData.push(...reloadedData);

        setToast({ message: 'Datos migrados a nueva estructura', type: 'success' });
      }

      // Si no hay datos globales y no hubo migración, crear datos por defecto
      if (globalLoans.length === 0 && globalIncomingLoans.length === 0 && globalSavings.length === 0 && allData.length === 0) {
        const defaultSavings = getDefaultGlobalSavings();
        globalSavings = defaultSavings;
        await saveSavings(defaultSavings);
      }

      setLoansState(globalLoans);
      setIncomingLoansState(globalIncomingLoans);
      setSavingsState(globalSavings);

      if (allData.length > 0) {
        setMonthlyDataHistory(allData);
      } else {
        // Si no hay datos, crear el mes actual por defecto
        const defaultData = getDefaultMonthlyData(now.getFullYear(), now.getMonth());
        setMonthlyDataHistory([defaultData]);
        await saveMonthlyData(defaultData);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      // En caso de error, usar datos por defecto
      setMonthlyDataHistory([getDefaultMonthlyData(now.getFullYear(), now.getMonth())]);
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para actualizar datos globales
  const setLoans = (data: Loan[]) => {
    setLoansState(data);
    saveLoans(data).catch(error => {
      console.error('Error saving loans:', error);
      setToast({ message: 'Error al guardar préstamos', type: 'error' });
    });
  };

  const setIncomingLoans = (data: IncomingLoan[]) => {
    setIncomingLoansState(data);
    saveIncomingLoans(data).catch(error => {
      console.error('Error saving incoming loans:', error);
      setToast({ message: 'Error al guardar deudas', type: 'error' });
    });
  };

  const setSavings = (data: Saving[]) => {
    setSavingsState(data);
    saveSavings(data).catch(error => {
      console.error('Error saving savings:', error);
      setToast({ message: 'Error al guardar ahorros', type: 'error' });
    });
  };

  const getCurrentMonthData = (): MonthlyData => {
    const existing = monthlyDataHistory.find(
      d => d.year === currentYear && d.month === currentMonth
    );
    if (existing) {
      // Hacer una copia profunda para evitar mutaciones
      const data = JSON.parse(JSON.stringify(existing));
      // Asegurar que tenga payments
      if (!data.payments) {
        data.payments = [];
      }
      return data;
    }

    // Si no existe, crear nuevo basado en el mes anterior
    const prevMonthData = getPreviousMonthData();
    if (prevMonthData) {
      // Copia profunda del mes anterior
      const copied = JSON.parse(JSON.stringify(prevMonthData));

      // Copiar solo los gastos marcados como recurrentes
      const recurringExpenses = copied.expenses
        .filter((e: Expense) => e.isRecurring)
        .map((e: Expense) => ({
          ...e,
          id: Date.now().toString() + Math.random().toString(36).slice(2, 11) // Nuevo ID único
        }));

      return {
        year: currentYear,
        month: currentMonth,
        person1: copied.person1,
        person2: copied.person2,
        expenses: recurringExpenses, // Copiar solo gastos recurrentes
        credits: copied.credits || [], // Tarjetas se copian
        payments: [], // Nuevo mes sin pagos
      };
    }

    return getDefaultMonthlyData(currentYear, currentMonth);
  };

  const getPreviousMonthData = (): MonthlyData | null => {
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }
    const found = monthlyDataHistory.find(d => d.year === prevYear && d.month === prevMonth);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  };


  const currentData = getCurrentMonthData();

  // Actualizar datos del mes actual
  const updateCurrentMonthData = async (updates: Partial<MonthlyData>) => {
    const updatedData = {
      ...currentData,
      year: currentYear,
      month: currentMonth,
      ...updates
    };

    // Guardar en base de datos (actualmente localStorage)
    try {
      setIsSaving(true);
      await saveMonthlyData(updatedData);

      // Actualizar estado local
      setMonthlyDataHistory(prev => {
        const index = prev.findIndex(d => d.year === currentYear && d.month === currentMonth);

        if (index >= 0) {
          const newHistory = [...prev];
          newHistory[index] = updatedData;
          return newHistory;
        } else {
          return [...prev, updatedData];
        }
      });
    } catch (error) {
      console.error('Error saving data:', error);
      setToast({ message: 'Error al guardar los datos', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = async (data: MonthlyData | MonthlyData[]) => {
    try {
      setIsLoading(true);
      const dataArray = Array.isArray(data) ? data : [data];

      // Detectar si los datos importados tienen estructura antigua (con loans/savings/incomingLoans en monthly data)
      const hasOldStructure = dataArray.some(d => d.loans || d.incomingLoans || d.savings);

      if (hasOldStructure) {
        // Migrar datos importados
        const migrated = await migrateToGlobalData(dataArray);

        // Guardar datos globales migrados
        await saveLoans(migrated.loans);
        await saveIncomingLoans(migrated.incomingLoans);
        await saveSavings(migrated.savings);

        setLoansState(migrated.loans);
        setIncomingLoansState(migrated.incomingLoans);
        setSavingsState(migrated.savings);

        // Limpiar datos antiguos antes de guardar
        for (const monthData of dataArray) {
          delete monthData.loans;
          delete monthData.incomingLoans;
          delete monthData.savings;
          await saveMonthlyData(monthData);
        }
      } else {
        // Save all imported data
        for (const monthData of dataArray) {
          await saveMonthlyData(monthData);
        }
      }

      // Reload all data
      const allData = await getAllMonthlyData();
      setMonthlyDataHistory(allData);

      setToast({
        message: `${dataArray.length} mes(es) importado(s) exitosamente`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error importing data:', error);
      setToast({ message: 'Error al importar los datos', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const person1 = currentData.person1;
  const person2 = currentData.person2;
  const expenses = currentData.expenses;
  const credits = currentData.credits;
  const payments = currentData.payments || [];
  // loans, incomingLoans, savings ya están definidos como estados globales

  // Obtener todos los pagos de todos los meses para calcular progreso global
  const allPayments = monthlyDataHistory.reduce((acc: Payment[], monthData) => {
    return [...acc, ...(monthData.payments || [])];
  }, []);

  // Calcular totales para badges
  const calculateDeductions = (person: PersonData) => {
    return person.deductions.reduce((sum, d) => {
      if (d.isPercentage) {
        return sum + (person.grossSalary * (d.percentage / 100));
      }
      return sum + d.amount;
    }, 0);
  };

  const calculateExpensesForTab = () => {
    return expenses.filter(e => e.shared || e.owner === activeTab).reduce((sum, e) => sum + e.amount, 0);
  };

  const calculateSavingsForTab = () => {
    // Calcular basándose en los pagos del mes actual (no pagados)
    const savingIds = new Set(savings.filter(s => !s.archived && (s.shared || s.owner === activeTab)).map(s => s.id));
    const pendingPayments = payments.filter(p =>
      p.type === 'saving' &&
      savingIds.has(p.referenceId) &&
      !p.isPaid &&
      p.owner === activeTab
    );
    return pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  const calculateLoansForTab = () => {
    // Calcular basándose en los pagos del mes actual (no pagados)
    // Incluir préstamos compartidos y del usuario activo
    const loanIds = new Set(loans.filter(l => (l.shared || l.owner === activeTab) && !l.archived).map(l => l.id));
    const pendingPayments = payments.filter(p =>
      p.type === 'loan' &&
      loanIds.has(p.referenceId) &&
      !p.isPaid &&
      p.owner === activeTab
    );
    return pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  const calculateIncomingLoansForTab = () => {
    // Calcular basándose en los pagos del mes actual (no pagados)
    // Incluir deudas compartidas y del usuario activo
    const loanIds = new Set(incomingLoans.filter(l => (l.shared || l.owner === activeTab) && !l.archived).map(l => l.id));
    const pendingPayments = payments.filter(p =>
      p.type === 'incomingLoan' &&
      loanIds.has(p.referenceId) &&
      !p.isPaid &&
      p.owner === activeTab
    );
    return pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  const calculateCreditsForTab = () => {
    return credits.filter(c => c.owner === activeTab).reduce((sum, c) => sum + c.currentBalance, 0);
  };

  const calculateOtherDeductions = (person: PersonData) => {
    return person.otherDeductions.reduce((sum, d) => sum + d.amountQ1 + d.amountQ2, 0);
  };

  const setPerson1 = (data: PersonData) => updateCurrentMonthData({ person1: data });
  const setPerson2 = (data: PersonData) => updateCurrentMonthData({ person2: data });
  const setExpenses = (data: Expense[]) => updateCurrentMonthData({ expenses: data });
  const setCredits = (data: Credit[]) => updateCurrentMonthData({ credits: data });
  const setPayments = (data: Payment[]) => updateCurrentMonthData({ payments: data });

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Indicador de guardado */}
      {isSaving && (
        <div className="fixed top-4 left-4 z-40 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 animate-fade-in">
          <Save className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">Guardando...</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 sm:p-3 rounded-xl shadow-lg hover-lift">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Controlando el Imperio
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg px-4">Administra salarios individuales, gastos compartidos y ahorros conjuntos</p>

          {/* Import/Export Data Buttons */}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <ImportButton
              onImport={handleImport}
              onError={(message) => setToast({ message, type: 'error' })}
            />
            <ExportButton
              monthlyData={currentData}
              globalLoans={loans}
              globalIncomingLoans={incomingLoans}
              globalSavings={savings}
              variant="current"
            />
            <ExportButton
              monthlyData={currentData}
              allMonthlyData={monthlyDataHistory}
              globalLoans={loans}
              globalIncomingLoans={incomingLoans}
              globalSavings={savings}
              variant="all"
            />
          </div>
        </header>

        {/* Tabs para cambiar entre personas - Arriba */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 mb-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('person1')}
              className={`py-3 sm:py-4 px-2 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all text-sm sm:text-base md:text-xl hover-lift truncate ${
                activeTab === 'person1'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md sm:scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={person1.name || 'Persona 1'}
            >
              {person1.name || 'Persona 1'}
            </button>
            <button
              onClick={() => setActiveTab('person2')}
              className={`py-3 sm:py-4 px-2 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all text-sm sm:text-base md:text-xl hover-lift truncate ${
                activeTab === 'person2'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md sm:scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={person2.name || 'Persona 2'}
            >
              {person2.name || 'Persona 2'}
            </button>
          </div>
        </div>

        {/* GESTIÓN GLOBAL - Fuera del mes */}
        <div className="mb-8">
          <GlobalEntitiesSection
            loans={loans}
            setLoans={setLoans}
            incomingLoans={incomingLoans}
            setIncomingLoans={setIncomingLoans}
            savings={savings}
            setSavings={setSavings}
            allPayments={allPayments}
            activeTab={activeTab}
          />
        </div>

        {/* Navegación de Meses */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 sm:p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>

            <div className="bg-white rounded-xl shadow-sm px-4 sm:px-6 py-2 sm:py-3 min-w-[200px] sm:min-w-[280px]">
              <div className="flex items-center justify-center gap-2">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <span className="text-lg sm:text-xl font-bold text-gray-800">
                  {monthNames[currentMonth]} {currentYear}
                </span>
              </div>
              {!isCurrentMonth && (
                <button
                  onClick={goToCurrentMonth}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Volver al mes actual
                </button>
              )}
              {isCurrentMonth && (
                <p className="mt-1 text-xs text-green-600 font-medium">Mes Actual</p>
              )}
            </div>

            <button
              onClick={goToNextMonth}
              className="p-1.5 sm:p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Resumen - Primero en móvil, último en desktop */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <CoupleSummary
              person1={person1}
              person2={person2}
              expenses={expenses}
              savings={savings}
              loans={loans}
              incomingLoans={incomingLoans}
              credits={credits}
              payments={payments}
              setPerson1={setPerson1}
              setPerson2={setPerson2}
              activeTab={activeTab}
            />
          </div>

          {/* Contenido principal - Segundo en móvil, primero en desktop */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-last lg:order-first">
            {/* Alertas */}
            <AlertsSection
              person1={person1}
              person2={person2}
              expenses={expenses}
              savings={savings}
              loans={loans}
              credits={credits}
              payments={payments}
              activeTab={activeTab}
            />

            {/* Sección de Ingresos y Deducciones según la persona activa */}
            {activeTab === 'person1' ? (
              <>
                <CollapsibleSection
                  title={`Ingresos Mensuales - ${person1.name}`}
                  icon={<Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                  defaultOpen={false}
                  badge={
                    <div className="bg-green-50 px-2 sm:px-3 py-1 rounded-lg border border-green-100">
                      <p className="text-xs sm:text-sm font-bold text-green-600">
                        ₡{person1.grossSalary.toLocaleString('es-CR')}
                      </p>
                    </div>
                  }
                >
                  <IncomeSection
                    grossSalary={person1.grossSalary}
                    setGrossSalary={(value) => setPerson1({ ...person1, grossSalary: value })}
                    dollarRate={person1.dollarRate}
                    setDollarRate={(value) => setPerson1({ ...person1, dollarRate: value })}
                    personName={person1.name}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title={`Cargas Laborales - ${person1.name}`}
                  icon={<Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />}
                  defaultOpen={false}
                  badge={
                    <div className="bg-red-50 px-2 sm:px-3 py-1 rounded-lg border border-red-100">
                      <p className="text-xs sm:text-sm font-bold text-red-600">
                        -₡{calculateDeductions(person1).toLocaleString('es-CR')}
                      </p>
                    </div>
                  }
                >
                  <DeductionsSection
                    deductions={person1.deductions}
                    setDeductions={(deductions) => setPerson1({ ...person1, deductions })}
                    grossSalary={person1.grossSalary}
                    personName={person1.name}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title={`Otras Deducciones por Quincena - ${person1.name}`}
                  icon={<Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
                  defaultOpen={false}
                  badge={
                    <div className="bg-orange-50 px-2 sm:px-3 py-1 rounded-lg border border-orange-100">
                      <p className="text-xs sm:text-sm font-bold text-orange-600">
                        -₡{calculateOtherDeductions(person1).toLocaleString('es-CR')}
                      </p>
                    </div>
                  }
                >
                  <div className="space-y-3 sm:space-y-4">
                    {person1.otherDeductions.map((deduction, index) => (
                      <div key={deduction.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover-lift">
                        <OptimizedInput
                          type="text"
                          value={deduction.name}
                          onSave={(value) => {
                            const newDeductions = [...person1.otherDeductions];
                            newDeductions[index].name = value as string;
                            setPerson1({ ...person1, otherDeductions: newDeductions });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nombre"
                        />
                        <OptimizedInput
                          type="number"
                          value={deduction.amountQ1}
                          onSave={(value) => {
                            const newDeductions = [...person1.otherDeductions];
                            newDeductions[index].amountQ1 = value as number;
                            setPerson1({ ...person1, otherDeductions: newDeductions });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Quincena 1"
                        />
                        <OptimizedInput
                          type="number"
                          value={deduction.amountQ2}
                          onSave={(value) => {
                            const newDeductions = [...person1.otherDeductions];
                            newDeductions[index].amountQ2 = value as number;
                            setPerson1({ ...person1, otherDeductions: newDeductions });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Quincena 2"
                        />
                        <button
                          onClick={() => {
                            setPerson1({
                              ...person1,
                              otherDeductions: person1.otherDeductions.filter(d => d.id !== deduction.id)
                            });
                          }}
                          className="px-4 py-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors font-medium min-h-[44px]"
                          aria-label="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setPerson1({
                          ...person1,
                          otherDeductions: [
                            ...person1.otherDeductions,
                            { id: Date.now().toString(), name: '', amountQ1: 0, amountQ2: 0 }
                          ]
                        });
                      }}
                      className="w-full py-3 px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium hover-lift"
                    >
                      + Agregar Deducción
                    </button>
                  </div>
                </CollapsibleSection>
              </>
            ) : (
              <>
                <CollapsibleSection
                  title={`Ingresos Mensuales - ${person2.name}`}
                  icon={<Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                  defaultOpen={false}
                  badge={
                    <div className="bg-green-50 px-2 sm:px-3 py-1 rounded-lg border border-green-100">
                      <p className="text-xs sm:text-sm font-bold text-green-600">
                        ₡{person2.grossSalary.toLocaleString('es-CR')}
                      </p>
                    </div>
                  }
                >
                  <IncomeSection
                    grossSalary={person2.grossSalary}
                    setGrossSalary={(value) => setPerson2({ ...person2, grossSalary: value })}
                    dollarRate={person2.dollarRate}
                    setDollarRate={(value) => setPerson2({ ...person2, dollarRate: value })}
                    personName={person2.name}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title={`Cargas Laborales - ${person2.name}`}
                  icon={<Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />}
                  defaultOpen={false}
                  badge={
                    <div className="bg-red-50 px-2 sm:px-3 py-1 rounded-lg border border-red-100">
                      <p className="text-xs sm:text-sm font-bold text-red-600">
                        -₡{calculateDeductions(person2).toLocaleString('es-CR')}
                      </p>
                    </div>
                  }
                >
                  <DeductionsSection
                    deductions={person2.deductions}
                    setDeductions={(deductions) => setPerson2({ ...person2, deductions })}
                    grossSalary={person2.grossSalary}
                    personName={person2.name}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title={`Otras Deducciones por Quincena - ${person2.name}`}
                  icon={<Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
                  defaultOpen={false}
                  badge={
                    <div className="bg-orange-50 px-2 sm:px-3 py-1 rounded-lg border border-orange-100">
                      <p className="text-xs sm:text-sm font-bold text-orange-600">
                        -₡{calculateOtherDeductions(person2).toLocaleString('es-CR')}
                      </p>
                    </div>
                  }
                >
                  <div className="space-y-3 sm:space-y-4">
                    {person2.otherDeductions.map((deduction, index) => (
                      <div key={deduction.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover-lift">
                        <OptimizedInput
                          type="text"
                          value={deduction.name}
                          onSave={(value) => {
                            const newDeductions = [...person2.otherDeductions];
                            newDeductions[index].name = value as string;
                            setPerson2({ ...person2, otherDeductions: newDeductions });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Nombre"
                        />
                        <OptimizedInput
                          type="number"
                          value={deduction.amountQ1}
                          onSave={(value) => {
                            const newDeductions = [...person2.otherDeductions];
                            newDeductions[index].amountQ1 = value as number;
                            setPerson2({ ...person2, otherDeductions: newDeductions });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Quincena 1"
                        />
                        <OptimizedInput
                          type="number"
                          value={deduction.amountQ2}
                          onSave={(value) => {
                            const newDeductions = [...person2.otherDeductions];
                            newDeductions[index].amountQ2 = value as number;
                            setPerson2({ ...person2, otherDeductions: newDeductions });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Quincena 2"
                        />
                        <button
                          onClick={() => {
                            setPerson2({
                              ...person2,
                              otherDeductions: person2.otherDeductions.filter(d => d.id !== deduction.id)
                            });
                          }}
                          className="px-4 py-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors font-medium min-h-[44px]"
                          aria-label="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setPerson2({
                          ...person2,
                          otherDeductions: [
                            ...person2.otherDeductions,
                            { id: Date.now().toString(), name: '', amountQ1: 0, amountQ2: 0 }
                          ]
                        });
                      }}
                      className="w-full py-3 px-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium hover-lift"
                    >
                      + Agregar Deducción
                    </button>
                  </div>
                </CollapsibleSection>
              </>
            )}

            {/* Gastos Compartidos e Individuales */}
            <CollapsibleSection
              title="Gastos"
              icon={<ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />}
              defaultOpen={false}
              badge={
                <div className="bg-purple-50 px-2 sm:px-3 py-1 rounded-lg border border-purple-100">
                  <p className="text-xs sm:text-sm font-bold text-purple-600">
                    -₡{calculateExpensesForTab().toLocaleString('es-CR')}
                  </p>
                </div>
              }
            >
              <ExpensesSection
                expenses={expenses}
                setExpenses={setExpenses}
                person1Name={person1.name}
                person2Name={person2.name}
                activeTab={activeTab}
                onCopyFromPreviousMonth={() => {
                  const prevData = getPreviousMonthData();
                  if (prevData && prevData.expenses) {
                    setExpenses(JSON.parse(JSON.stringify(prevData.expenses)));
                  }
                }}
                hasPreviousMonth={getPreviousMonthData() !== null}
              />
            </CollapsibleSection>

            {/* Pagos del Mes */}
            <CollapsibleSection
              title={`Pagos del Mes - ${activeTab === 'person1' ? person1.name : person2.name}`}
              icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
              defaultOpen={true}
              badge={
                <div className="bg-blue-50 px-2 sm:px-3 py-1 rounded-lg border border-blue-100">
                  <p className="text-xs sm:text-sm font-bold text-blue-600">
                    ₡{(calculateSavingsForTab() + calculateLoansForTab() + calculateIncomingLoansForTab()).toLocaleString('es-CR')}
                  </p>
                </div>
              }
            >
              <MonthlyPaymentsSection
                payments={payments}
                setPayments={setPayments}
                loans={loans}
                incomingLoans={incomingLoans}
                savings={savings}
                activeTab={activeTab}
              />
            </CollapsibleSection>

            {/* Tarjetas de Crédito */}
            <CollapsibleSection
              title={`Tarjetas de Crédito - ${activeTab === 'person1' ? person1.name : person2.name}`}
              icon={<CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />}
              defaultOpen={false}
              badge={
                <div className="bg-rose-50 px-2 sm:px-3 py-1 rounded-lg border border-rose-100">
                  <p className="text-xs sm:text-sm font-bold text-rose-600">
                    ₡{calculateCreditsForTab().toLocaleString('es-CR')}
                  </p>
                </div>
              }
            >
              <CreditSection
                credits={credits}
                setCredits={setCredits}
                activeTab={activeTab}
                personName={activeTab === 'person1' ? person1.name : person2.name}
                personData={activeTab === 'person1' ? person1 : person2}
                expenses={expenses}
                savings={savings}
                payments={payments}
              />
            </CollapsibleSection>
          </div>
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}
