import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../../../store/useAppStore';
import {
  generatePayrollReport,
  mockEmployees,
  mockTimeEntries,
  mockProjects,
} from '@servicecore/shared';

export function PayrollReportButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const dateRange = useAppStore((s) => s.dateRange);
  const addToast = useAppStore((s) => s.addToast);

  async function handleGenerate() {
    setIsGenerating(true);

    try {
      // Allow UI to update before running synchronous PDF generation
      await new Promise((resolve) => setTimeout(resolve, 50));

      const pdfBytes = generatePayrollReport(
        mockEmployees,
        mockTimeEntries,
        mockProjects,
        dateRange,
      );

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const dateStr = format(new Date(), 'yyyy-MM-dd');

      const link = document.createElement('a');
      link.href = url;
      link.download = `payroll-report-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Payroll report downloaded', 'success');
    } catch {
      addToast('Failed to generate payroll report', 'error');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#f89020] hover:bg-[#e07d10] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      {isGenerating ? 'Generating...' : 'Generate Payroll Report'}
    </button>
  );
}
