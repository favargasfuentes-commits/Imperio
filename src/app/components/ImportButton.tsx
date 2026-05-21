import { Upload } from 'lucide-react';
import { MonthlyData } from '../types/financialTypes'

interface ImportButtonProps {
  onImport: (data: MonthlyData | MonthlyData[] | any) => void;
  onError: (message: string) => void;
}

export function ImportButton({ onImport, onError }: ImportButtonProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);

        // Detectar nueva estructura con globalData
        if (parsedData.monthlyData || parsedData.globalLoans || parsedData.globalIncomingLoans || parsedData.globalSavings) {
          // Nueva estructura: {monthlyData, globalLoans, globalIncomingLoans, globalSavings}
          // Extraer monthlyData (puede ser array o objeto único)
          const monthlyData = parsedData.monthlyData;
          if (Array.isArray(monthlyData)) {
            onImport(monthlyData);
          } else if (monthlyData) {
            onImport(monthlyData);
          } else {
            throw new Error('Formato de datos inválido');
          }
          return;
        }

        // Estructura antigua: validar y pasar
        if (Array.isArray(parsedData)) {
          // Multiple months
          const isValid = parsedData.every(data =>
            data.year !== undefined &&
            data.month !== undefined &&
            data.person1 &&
            data.person2
          );
          if (!isValid) {
            throw new Error('Formato de datos inválido');
          }
          onImport(parsedData);
        } else {
          // Single month
          if (!parsedData.year || parsedData.month === undefined || !parsedData.person1 || !parsedData.person2) {
            throw new Error('Formato de datos inválido');
          }
          onImport(parsedData);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        onError('Error al importar el archivo. Verifica que sea un archivo JSON válido.');
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  return (
    <label className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm hover-lift cursor-pointer">
      <Upload className="w-4 h-4" />
      Importar
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />
    </label>
  );
}
