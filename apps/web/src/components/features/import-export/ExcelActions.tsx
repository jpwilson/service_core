import { useState, useRef } from 'react';
import { Download, Upload, X, FileSpreadsheet, Check } from 'lucide-react';
import {
  exportTimesheetsToExcel,
  parseTimesheetExcel,
  mockTimeEntries,
  mockEmployees,
  mockProjects,
} from '@servicecore/shared';
import type { ParsedTimesheetRow } from '@servicecore/shared';
import { useAppStore } from '../../../store/useAppStore';

export function ExcelActions() {
  const { addToast } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewRows, setPreviewRows] = useState<ParsedTimesheetRow[] | null>(null);

  function handleExport() {
    try {
      const data = exportTimesheetsToExcel(mockTimeEntries, mockEmployees, mockProjects);
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `servicecore-timesheet-${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Timesheet exported successfully', 'success');
    } catch {
      addToast('Failed to export timesheet', 'error');
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const rows = parseTimesheetExcel(buffer);
        if (rows.length === 0) {
          addToast('No data found in file', 'info');
          return;
        }
        setPreviewRows(rows);
      } catch {
        addToast('Failed to parse file', 'error');
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  }

  function handleConfirmImport() {
    if (!previewRows) return;
    addToast(`${previewRows.length} entries imported`, 'success');
    setPreviewRows(null);
  }

  function handleCancelImport() {
    setPreviewRows(null);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f89020]/10">
          <FileSpreadsheet className="w-5 h-5 text-[#f89020]" />
        </div>
        <h3 className="text-base font-semibold text-[#0a1f44]">Excel Import / Export</h3>
      </div>

      <div className="px-6 py-5">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
          <button
            onClick={handleImportClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Timesheet
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Preview Modal */}
        {previewRows && (
          <div className="mt-5 border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-medium text-[#0a1f44]">
                Preview: {previewRows.length} rows found
              </span>
              <button
                onClick={handleCancelImport}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Clock In</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2 px-3 text-[#0a1f44]">{row.employeeName}</td>
                      <td className="py-2 px-3 text-gray-600">{row.date}</td>
                      <td className="py-2 px-3 text-gray-600">{row.clockIn}</td>
                      <td className="py-2 px-3 text-gray-600">{row.clockOut}</td>
                      <td className="py-2 px-3 text-right text-[#0a1f44] font-medium">{row.hoursWorked}</td>
                      <td className="py-2 px-3 text-gray-600">{row.project}</td>
                      <td className="py-2 px-3 text-gray-400 truncate max-w-[200px]">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewRows.length > 50 && (
                <p className="px-4 py-2 text-xs text-gray-400 text-center">
                  Showing first 50 of {previewRows.length} rows
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleCancelImport}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#f89020] hover:bg-[#e07d10] rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm Import
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
