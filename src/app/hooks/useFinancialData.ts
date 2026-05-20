/**
 * CUSTOM HOOK para manejar datos financieros
 *
 * Este hook abstrae toda la lógica de persistencia de datos.
 * Facilita la migración a base de datos sin cambiar los componentes.
 */

import { useState, useEffect } from 'react';
import { MonthlyData } from '../types/financialTypes';
import { getMonthlyData, saveMonthlyData, getAllMonthlyData } from '../services/dataService';

export function useFinancialData(year: number, month: number) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Cargar datos del mes actual
  useEffect(() => {
    loadData();
  }, [year, month]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMonthlyData(year, month);
      setMonthlyData(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (updates: Partial<MonthlyData>) => {
    try {
      setError(null);
      const updatedData: MonthlyData = {
        year,
        month,
        ...monthlyData,
        ...updates,
      } as MonthlyData;

      await saveMonthlyData(updatedData);
      setMonthlyData(updatedData);
    } catch (err) {
      setError(err as Error);
      console.error('Error saving data:', err);
      throw err;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  return {
    monthlyData,
    loading,
    error,
    saveData,
    refreshData
  };
}

/**
 * Hook para obtener todo el historial
 */
export function useAllFinancialData() {
  const [allData, setAllData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllMonthlyData();
      setAllData(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading all data:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    allData,
    loading,
    error,
    refreshData: loadAllData
  };
}
