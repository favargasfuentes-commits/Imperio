import { Download } from 'lucide-react';
import { MonthlyData, Loan, IncomingLoan, Saving } from '../App';

interface ExportButtonProps {
  monthlyData: MonthlyData;
  allMonthlyData?: MonthlyData[];
  globalLoans?: Loan[];
  globalIncomingLoans?: IncomingLoan[];
  globalSavings?: Saving[];
  variant?: 'current' | 'all';
}

export function ExportButton({
  monthlyData,
  allMonthlyData,
  globalLoans = [],
  globalIncomingLoans = [],
  globalSavings = [],
  variant = 'current'
}: ExportButtonProps) {
  const exportData = () => {
    const dataToExport = variant === 'all'
      ? {
          monthlyData: allMonthlyData,
          globalLoans,
          globalIncomingLoans,
          globalSavings
        }
      : {
          monthlyData,
          globalLoans,
          globalIncomingLoans,
          globalSavings
        };
    const filename = variant === 'all'
      ? 'controlando-el-imperio-todos-los-meses.json'
      : `controlando-el-imperio-${monthlyData.year}-${String(monthlyData.month + 1).padStart(2, '0')}.json`;

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportData}
      className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm hover-lift"
      title={variant === 'all' ? 'Exportar todos los meses' : 'Exportar este mes'}
    >
      <Download className="w-4 h-4" />
      {variant === 'all' ? 'Exportar Todo' : 'Exportar Mes'}
    </button>
  );
}
