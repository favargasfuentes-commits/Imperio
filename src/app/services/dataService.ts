import { MonthlyData } from '../types/financialTypes';

const STORAGE_KEY = 'financial_data_history';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_TABLE = 'financial_data_history';

async function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (error) {
    console.error('Supabase client initialization failed:', error);
    return null;
  }
}

function getAllMonthlyDataFromLocalStorage(): MonthlyData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading localStorage monthly data:', error);
    return [];
  }
}

function saveMonthlyDataToLocalStorage(data: MonthlyData): void {
  const history = getAllMonthlyDataFromLocalStorage();
  const index = history.findIndex(d => d.year === data.year && d.month === data.month);

  if (index >= 0) {
    history[index] = data;
  } else {
    history.push(data);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export async function saveMonthlyData(data: MonthlyData): Promise<void> {
  const supabase = await getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .upsert({ year: data.year, month: data.month, data }, { onConflict: 'year,month' });

      if (!error) {
        return;
      }

      throw error;
    } catch (error) {
      console.error('Supabase save failed, falling back to localStorage:', error);
    }
  }

  try {
    saveMonthlyDataToLocalStorage(data);
  } catch (error) {
    console.error('Error saving monthly data to localStorage:', error);
    throw error;
  }
}

export async function getMonthlyData(year: number, month: number): Promise<MonthlyData | null> {
  const supabase = await getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('data')
        .eq('year', year)
        .eq('month', month)
        .limit(1)
        .single();

      if (!error && data && data.data) {
        return data.data as MonthlyData;
      }

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase getMonthlyData failed, falling back to localStorage:', error);
    }
  }

  try {
    const history = getAllMonthlyDataFromLocalStorage();
    const monthlyData = history.find(d => d.year === year && d.month === month);
    return monthlyData ? JSON.parse(JSON.stringify(monthlyData)) : null;
  } catch (error) {
    console.error('Error getting monthly data from localStorage:', error);
    return null;
  }
}

export async function getAllMonthlyData(): Promise<MonthlyData[]> {
  const supabase = await getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('data')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => row.data as MonthlyData).filter(Boolean);
      }

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase getAllMonthlyData failed, falling back to localStorage:', error);
    }
  }

  return getAllMonthlyDataFromLocalStorage();
}
