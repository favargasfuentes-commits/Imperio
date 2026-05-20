import type { MonthlyData } from '../app/types/financialTypes';

const STORAGE_PREFIX = 'financial-data';

export async function saveMonthlyData(data: MonthlyData): Promise<void> {
  const key = `${STORAGE_PREFIX}-${data.year}-${data.month}`;
  localStorage.setItem(key, JSON.stringify(data));
}

export async function getMonthlyData(year: number, month: number): Promise<MonthlyData | null> {
  const key = `${STORAGE_PREFIX}-${year}-${month}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export async function getAllMonthlyData(): Promise<MonthlyData[]> {
  const allKeys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX + '-'));
  const allData = allKeys
    .map(key => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    })
    .filter(d => d !== null);

  // Ordenar por año y mes (más reciente primero)
  return allData.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

export async function deleteMonthlyData(year: number, month: number): Promise<void> {
  const key = `${STORAGE_PREFIX}-${year}-${month}`;
  localStorage.removeItem(key);
}
