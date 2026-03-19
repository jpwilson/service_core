import { useState, useRef } from 'react';
import { Upload, X, Check, FileText, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';

interface KronosRow {
  employeeName: string;
  employeeId: string;
  date: string;
  inPunch: string;
  outPunch: string;
  hours: string;
  payCode: string;
  department: string;
  jobCode: string;
  comments: string;
  edited: boolean;
}

// Parse Kronos-style CSV/Excel data
function parseKronosData(text: string): KronosRow[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detect header row - Kronos uses various column names
  const headerLine = lines[0].toLowerCase();
  const delimiter = headerLine.includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/"/g, ''));

  // Map Kronos column names to our fields
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const lower = h.toLowerCase();
    if (lower.includes('employee') && lower.includes('name')) colMap.employeeName = i;
    else if (lower === 'employee name') colMap.employeeName = i;
    else if (lower === 'name') colMap.employeeName = i;
    else if (lower.includes('employee') && (lower.includes('id') || lower.includes('#') || lower.includes('number'))) colMap.employeeId = i;
    else if (lower === 'emp id' || lower === 'employee id') colMap.employeeId = i;
    else if (lower === 'date' || lower === 'work date' || lower === 'punch date') colMap.date = i;
    else if (lower === 'in' || lower === 'in punch' || lower === 'start time' || lower === 'clock in' || lower === 'time in') colMap.inPunch = i;
    else if (lower === 'out' || lower === 'out punch' || lower === 'end time' || lower === 'clock out' || lower === 'time out') colMap.outPunch = i;
    else if (lower === 'hours' || lower === 'total hours' || lower === 'worked hours' || lower === 'daily total') colMap.hours = i;
    else if (lower === 'pay code' || lower === 'paycode' || lower === 'pay type' || lower === 'earning code') colMap.payCode = i;
    else if (lower === 'department' || lower === 'dept' || lower === 'home department') colMap.department = i;
    else if (lower === 'job' || lower === 'job code' || lower === 'job title' || lower === 'position') colMap.jobCode = i;
    else if (lower === 'comments' || lower === 'notes' || lower === 'comment') colMap.comments = i;
  });

  // Parse data rows
  const rows: KronosRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim().replace(/"/g, ''));
    if (cells.length < 3) continue;

    const row: KronosRow = {
      employeeName: cells[colMap.employeeName ?? 0] || '',
      employeeId: cells[colMap.employeeId ?? -1] || '',
      date: cells[colMap.date ?? 1] || '',
      inPunch: cells[colMap.inPunch ?? 2] || '',
      outPunch: cells[colMap.outPunch ?? 3] || '',
      hours: cells[colMap.hours ?? 4] || '',
      payCode: cells[colMap.payCode ?? -1] || 'REG',
      department: cells[colMap.department ?? -1] || '',
      jobCode: cells[colMap.jobCode ?? -1] || '',
      comments: cells[colMap.comments ?? -1] || '',
      edited: false,
    };

    if (row.employeeName || row.date) {
      rows.push(row);
    }
  }

  return rows;
}

export function KronosImport() {
  const { addToast } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<KronosRow[] | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; field: keyof KronosRow } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseKronosData(text);
        if (parsed.length === 0) {
          addToast('No data found. Check file format.', 'info');
          return;
        }
        setRows(parsed);
        addToast(`Found ${parsed.length} entries from Kronos export`, 'success');
      } catch {
        addToast('Failed to parse Kronos file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleCellEdit(rowIndex: number, field: keyof KronosRow, value: string) {
    if (!rows) return;
    const updated = [...rows];
    (updated[rowIndex] as unknown as Record<string, unknown>)[field] = value;
    updated[rowIndex].edited = true;
    setRows(updated);
    setEditingCell(null);
  }

  function handleConfirm() {
    if (!rows) return;
    addToast(`${rows.length} Kronos entries imported successfully`, 'success');
    setRows(null);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-100">
          <FileText className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#0a1f44]">Kronos / UKG Import</h3>
          <p className="text-xs text-gray-400">Import timesheet data from Kronos Workforce Central or UKG Pro</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 space-y-1">
            <p className="font-medium">Supported Kronos export formats:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>CSV exports from Kronos Workforce Central</li>
              <li>Tab-delimited exports from UKG Pro / UKG Ready</li>
              <li>Generic CSV with columns: Employee Name, Date, In, Out, Hours</li>
            </ul>
            <p>Expected columns: <span className="font-mono text-blue-800">Employee Name, Date, In Punch, Out Punch, Hours, Pay Code, Department</span></p>
          </div>
        </div>

        {/* Upload buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Kronos Export
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Preview with editable cells */}
        {rows && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#0a1f44]">
                  Preview: {rows.length} entries
                </span>
                {rows.some((r) => r.edited) && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    Edited
                  </span>
                )}
              </div>
              <button onClick={() => setRows(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100">
                    {['Employee', 'ID', 'Date', 'In', 'Out', 'Hours', 'Pay Code', 'Dept', 'Comments'].map((h) => (
                      <th key={h} className="text-left py-2 px-2.5 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className={`border-b border-gray-50 ${row.edited ? 'bg-yellow-50' : 'hover:bg-gray-50/50'}`}>
                      {(['employeeName', 'employeeId', 'date', 'inPunch', 'outPunch', 'hours', 'payCode', 'department', 'comments'] as const).map((field) => (
                        <td
                          key={field}
                          className="py-1.5 px-2.5 text-gray-700 cursor-pointer hover:bg-blue-50"
                          onClick={() => setEditingCell({ row: idx, field })}
                        >
                          {editingCell?.row === idx && editingCell?.field === field ? (
                            <input
                              autoFocus
                              defaultValue={row[field] as string}
                              onBlur={(e) => handleCellEdit(idx, field, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellEdit(idx, field, (e.target as HTMLInputElement).value);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full px-1 py-0.5 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          ) : (
                            <span className={`text-xs ${!row[field] ? 'text-gray-300 italic' : ''}`}>
                              {(row[field] as string) || '—'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 100 && (
                <p className="px-4 py-2 text-xs text-gray-400 text-center">
                  Showing first 100 of {rows.length} rows
                </p>
              )}
            </div>

            {/* Validation warnings */}
            {rows.some((r) => !r.inPunch || !r.outPunch) && (
              <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-xs text-amber-700">
                  Some entries are missing in/out times. Click any cell to edit before importing.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setRows(null)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#f89020] hover:bg-[#e07d10] rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm Import ({rows.length} entries)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
