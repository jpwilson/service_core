import { useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
  Upload,
  Download,
  X,
  Check,
  FileSpreadsheet,
  FileText,
  Camera,
  Loader2,
  Plus,
  RotateCcw,
  AlertCircle,
  History,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import {
  exportTimesheetsToExcel,
  parseTimesheetExcel,
  parseOcrText,
  mockTimeEntries,
  mockEmployees,
  mockProjects,
} from '@servicecore/shared';
import type { ParsedTimesheetRow, OcrParsedEntry } from '@servicecore/shared';
import { useAppStore } from '../../store/useAppStore';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

type ImportMode = 'idle' | 'excel-preview' | 'csv-preview' | 'ocr-processing' | 'ocr-results';

interface ImportRecord {
  id: string;
  fileName: string;
  fileType: 'excel' | 'csv' | 'pdf' | 'image';
  entriesImported: number;
  importedAt: Date;
  employees: string[];
  totalHours: number;
  dateRange: string;
}

// Seed with some demo history
const INITIAL_HISTORY: ImportRecord[] = [
  {
    id: 'imp-demo-1',
    fileName: 'kronos-export-march-wk1.csv',
    fileType: 'csv',
    entriesImported: 42,
    importedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    employees: ['Marcus Trujillo', 'Jake Sandoval', 'Tyler Montoya', 'Brian Kessler', 'Carlos Vigil'],
    totalHours: 336,
    dateRange: 'Mar 3 - Mar 9',
  },
  {
    id: 'imp-demo-2',
    fileName: 'timesheet-scan-feb.pdf',
    fileType: 'pdf',
    entriesImported: 15,
    importedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    employees: ['Miguel Archuleta', 'Jordan Pacheco', 'Ryan Baca'],
    totalHours: 120,
    dateRange: 'Feb 24 - Feb 28',
  },
  {
    id: 'imp-demo-3',
    fileName: 'payroll-feb-final.xlsx',
    fileType: 'excel',
    entriesImported: 86,
    importedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    employees: ['All employees (18)'],
    totalHours: 688,
    dateRange: 'Feb 17 - Feb 28',
  },
];

interface CsvRow {
  employeeName: string;
  employeeId: string;
  date: string;
  inPunch: string;
  outPunch: string;
  hours: string;
  payCode: string;
  department: string;
  comments: string;
  edited: boolean;
}

function parseCsvData(text: string): CsvRow[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const delimiter = headerLine.includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/"/g, ''));

  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const lower = h.toLowerCase();
    if (lower.includes('employee') && lower.includes('name')) colMap.employeeName = i;
    else if (lower === 'employee name' || lower === 'name') colMap.employeeName = i;
    else if (lower.includes('employee') && (lower.includes('id') || lower.includes('#') || lower.includes('number'))) colMap.employeeId = i;
    else if (lower === 'emp id' || lower === 'employee id') colMap.employeeId = i;
    else if (lower === 'date' || lower === 'work date' || lower === 'punch date') colMap.date = i;
    else if (['in', 'in punch', 'start time', 'clock in', 'time in'].includes(lower)) colMap.inPunch = i;
    else if (['out', 'out punch', 'end time', 'clock out', 'time out'].includes(lower)) colMap.outPunch = i;
    else if (['hours', 'total hours', 'worked hours', 'daily total'].includes(lower)) colMap.hours = i;
    else if (['pay code', 'paycode', 'pay type', 'earning code'].includes(lower)) colMap.payCode = i;
    else if (['department', 'dept', 'home department'].includes(lower)) colMap.department = i;
    else if (['comments', 'notes', 'comment'].includes(lower)) colMap.comments = i;
  });

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim().replace(/"/g, ''));
    if (cells.length < 3) continue;
    const row: CsvRow = {
      employeeName: cells[colMap.employeeName ?? 0] || '',
      employeeId: cells[colMap.employeeId ?? -1] || '',
      date: cells[colMap.date ?? 1] || '',
      inPunch: cells[colMap.inPunch ?? 2] || '',
      outPunch: cells[colMap.outPunch ?? 3] || '',
      hours: cells[colMap.hours ?? 4] || '',
      payCode: cells[colMap.payCode ?? -1] || 'REG',
      department: cells[colMap.department ?? -1] || '',
      comments: cells[colMap.comments ?? -1] || '',
      edited: false,
    };
    if (row.employeeName || row.date) rows.push(row);
  }
  return rows;
}

async function renderPdfToImages(file: File): Promise<HTMLCanvasElement[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const canvases: HTMLCanvasElement[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
    canvases.push(canvas);
  }
  return canvases;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') return <FileText className="w-5 h-5 text-purple-600" />;
  if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
  return <Camera className="w-5 h-5 text-primary-500" />;
}

function getFileType(file: File): 'excel' | 'csv' | 'pdf' | 'image' {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') return 'excel';
  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') return 'csv';
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf';
  return 'image';
}

export function Import() {
  const { addToast } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared state
  const [mode, setMode] = useState<ImportMode>('idle');
  const [fileName, setFileName] = useState('');
  const [importHistory, setImportHistory] = useState<ImportRecord[]>(INITIAL_HISTORY);

  // Excel state
  const [excelRows, setExcelRows] = useState<ParsedTimesheetRow[] | null>(null);

  // CSV state
  const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; field: keyof CsvRow } | null>(null);

  // OCR state
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrProgressLabel, setOcrProgressLabel] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [ocrEntries, setOcrEntries] = useState<OcrParsedEntry[]>([]);
  const currentFileRef = useRef<File | null>(null);

  const resetAll = useCallback(() => {
    setMode('idle');
    setFileName('');
    setExcelRows(null);
    setCsvRows(null);
    setEditingCell(null);
    setOcrProgress(0);
    setOcrProgressLabel('');
    setImageUrl(null);
    setRawText('');
    setOcrEntries([]);
    currentFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ---- Process file based on type ----
  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const type = getFileType(file);

    if (type === 'excel') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const rows = parseTimesheetExcel(buffer);
          if (rows.length === 0) {
            addToast('No data found in Excel file', 'info');
            return;
          }
          setExcelRows(rows);
          setMode('excel-preview');
        } catch {
          addToast('Failed to parse Excel file', 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (type === 'csv') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = parseCsvData(text);
          if (rows.length === 0) {
            addToast('No data found. Check file format.', 'info');
            return;
          }
          setCsvRows(rows);
          setMode('csv-preview');
        } catch {
          addToast('Failed to parse CSV file', 'error');
        }
      };
      reader.readAsText(file);
    } else if (type === 'pdf') {
      currentFileRef.current = file;
      setMode('ocr-processing');
      setOcrProgress(0);
      setOcrProgressLabel('Rendering PDF pages...');
      try {
        const canvases = await renderPdfToImages(file);
        let allText = '';
        for (let i = 0; i < canvases.length; i++) {
          setOcrProgressLabel(`Scanning page ${i + 1} of ${canvases.length}...`);
          const result = await Tesseract.recognize(canvases[i], 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setOcrProgress((i + m.progress) / canvases.length);
              }
            },
          });
          allText += result.data.text + '\n';
        }
        setRawText(allText);
        setOcrEntries(parseOcrText(allText));
        setMode('ocr-results');
      } catch {
        addToast('Failed to process PDF. Try a clearer scan.', 'error');
        resetAll();
      }
    } else {
      // Image - OCR
      currentFileRef.current = file;
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setMode('ocr-processing');
      setOcrProgress(0);
      setOcrProgressLabel('Analyzing image...');
      try {
        const result = await Tesseract.recognize(file, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(m.progress);
            }
          },
        });
        setRawText(result.data.text);
        setOcrEntries(parseOcrText(result.data.text));
        setMode('ocr-results');
      } catch {
        addToast('Failed to process image. Try again.', 'error');
        resetAll();
      }
    }
  }, [addToast, resetAll]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // ---- Export ----
  const handleExport = () => {
    try {
      const data = exportTimesheetsToExcel(mockTimeEntries, mockEmployees, mockProjects);
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `servicecore-timesheet-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Timesheet exported successfully', 'success');
    } catch {
      addToast('Failed to export timesheet', 'error');
    }
  };

  // ---- CSV cell edit ----
  const handleCsvCellEdit = (rowIndex: number, field: keyof CsvRow, value: string) => {
    if (!csvRows) return;
    const updated = [...csvRows];
    (updated[rowIndex] as unknown as Record<string, unknown>)[field] = value;
    updated[rowIndex].edited = true;
    setCsvRows(updated);
    setEditingCell(null);
  };

  // ---- OCR helpers ----
  const updateOcrEntry = (index: number, field: keyof OcrParsedEntry, value: string | number | null) => {
    setOcrEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  };

  const confidenceBadge = (confidence: number) => {
    let color = 'bg-red-100 text-red-800';
    if (confidence > 0.7) color = 'bg-green-100 text-green-800';
    else if (confidence >= 0.4) color = 'bg-yellow-100 text-yellow-800';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{Math.round(confidence * 100)}%</span>;
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-secondary-500">Import & Export</h2>
          <p className="text-sm text-gray-500">
            Import timesheets from Excel, CSV, Kronos/UKG, paper scans, or PDFs. Auto-detected on upload.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
      </div>

      {/* ---- IDLE: Unified Drop Zone ---- */}
      {mode === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer p-12"
        >
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-secondary-500 mb-2">
              Drop a file here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-6">
              We'll automatically detect the format and show you a preview before importing.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              {[
                { icon: <FileSpreadsheet className="w-3.5 h-3.5" />, label: 'Excel (.xlsx, .xls)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { icon: <FileText className="w-3.5 h-3.5" />, label: 'CSV / Kronos (.csv, .tsv)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                { icon: <FileText className="w-3.5 h-3.5" />, label: 'PDF Timesheet (.pdf)', color: 'bg-red-50 text-red-700 border-red-200' },
                { icon: <Camera className="w-3.5 h-3.5" />, label: 'Photo / Scan (.jpg, .png)', color: 'bg-orange-50 text-orange-700 border-orange-200' },
              ].map((fmt) => (
                <span key={fmt.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium ${fmt.color}`}>
                  {fmt.icon} {fmt.label}
                </span>
              ))}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt,.pdf,image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* ---- EXCEL PREVIEW ---- */}
      {mode === 'excel-preview' && excelRows && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {getFileIcon(fileName)}
              <span className="text-sm font-semibold text-secondary-500">{fileName}</span>
              <span className="text-xs text-gray-400">— {excelRows.length} rows</span>
            </div>
            <button onClick={resetAll} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-100">
                  {['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Project', 'Notes'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelRows.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 px-3 text-secondary-500 font-medium">{row.employeeName}</td>
                    <td className="py-2 px-3 text-gray-600">{row.date}</td>
                    <td className="py-2 px-3 text-gray-600">{row.clockIn}</td>
                    <td className="py-2 px-3 text-gray-600">{row.clockOut}</td>
                    <td className="py-2 px-3 text-right text-secondary-500 font-medium">{row.hoursWorked}</td>
                    <td className="py-2 px-3 text-gray-600">{row.project}</td>
                    <td className="py-2 px-3 text-gray-400 truncate max-w-[200px]">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {excelRows.length > 50 && (
              <p className="px-4 py-2 text-xs text-gray-400 text-center">Showing first 50 of {excelRows.length} rows</p>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-5 py-3 bg-gray-50 border-t border-gray-200">
            <button onClick={resetAll} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button onClick={() => {
                const uniqueNames = [...new Set(excelRows.map(r => r.employeeName).filter(Boolean))];
                const totalHrs = excelRows.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
                const dates = excelRows.map(r => r.date).filter(Boolean).sort();
                setImportHistory(prev => [{
                  id: `imp-${Date.now()}`, fileName, fileType: 'excel',
                  entriesImported: excelRows.length, importedAt: new Date(),
                  employees: uniqueNames.length > 5 ? [`All employees (${uniqueNames.length})`] : uniqueNames,
                  totalHours: Math.round(totalHrs),
                  dateRange: dates.length ? `${dates[0]} - ${dates[dates.length - 1]}` : 'N/A',
                }, ...prev]);
                addToast(`${excelRows.length} entries imported from Excel`, 'success'); resetAll();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600">
              <Check className="w-3.5 h-3.5" /> Import {excelRows.length} Entries
            </button>
          </div>
        </div>
      )}

      {/* ---- CSV/KRONOS PREVIEW ---- */}
      {mode === 'csv-preview' && csvRows && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {getFileIcon(fileName)}
              <span className="text-sm font-semibold text-secondary-500">{fileName}</span>
              <span className="text-xs text-gray-400">— {csvRows.length} entries</span>
              {csvRows.some((r) => r.edited) && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Edited</span>
              )}
            </div>
            <button onClick={resetAll} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-100">
                  {['Employee', 'ID', 'Date', 'In', 'Out', 'Hours', 'Pay Code', 'Dept', 'Comments'].map((h) => (
                    <th key={h} className="text-left py-2 px-2.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-50 ${row.edited ? 'bg-yellow-50' : 'hover:bg-gray-50/50'}`}>
                    {(['employeeName', 'employeeId', 'date', 'inPunch', 'outPunch', 'hours', 'payCode', 'department', 'comments'] as const).map((field) => (
                      <td key={field} className="py-1.5 px-2.5 text-gray-700 cursor-pointer hover:bg-blue-50"
                        onClick={() => setEditingCell({ row: idx, field })}>
                        {editingCell?.row === idx && editingCell?.field === field ? (
                          <input autoFocus defaultValue={row[field] as string}
                            onBlur={(e) => handleCsvCellEdit(idx, field, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCsvCellEdit(idx, field, (e.target as HTMLInputElement).value);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full px-1 py-0.5 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        ) : (
                          <span className={`text-xs ${!row[field] ? 'text-gray-300 italic' : ''}`}>{(row[field] as string) || '—'}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {csvRows.some((r) => !r.inPunch || !r.outPunch) && (
            <div className="px-5 py-2 bg-amber-50 border-t border-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-700">Some entries are missing in/out times. Click any cell to edit before importing.</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 px-5 py-3 bg-gray-50 border-t border-gray-200">
            <button onClick={resetAll} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button onClick={() => {
                const uniqueNames = [...new Set(csvRows.map(r => r.employeeName).filter(Boolean))];
                const totalHrs = csvRows.reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                const dates = csvRows.map(r => r.date).filter(Boolean).sort();
                setImportHistory(prev => [{
                  id: `imp-${Date.now()}`, fileName, fileType: 'csv',
                  entriesImported: csvRows.length, importedAt: new Date(),
                  employees: uniqueNames.length > 5 ? [`All employees (${uniqueNames.length})`] : uniqueNames,
                  totalHours: Math.round(totalHrs),
                  dateRange: dates.length ? `${dates[0]} - ${dates[dates.length - 1]}` : 'N/A',
                }, ...prev]);
                addToast(`${csvRows.length} entries imported from CSV`, 'success'); resetAll();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600">
              <Check className="w-3.5 h-3.5" /> Import {csvRows.length} Entries
            </button>
          </div>
        </div>
      )}

      {/* ---- OCR PROCESSING ---- */}
      {mode === 'ocr-processing' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-start gap-4">
            {imageUrl && <img src={imageUrl} alt="Uploaded timesheet" className="w-32 h-32 object-cover rounded border" />}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getFileIcon(fileName)}
                <span className="text-sm font-semibold text-secondary-500">{fileName}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                <span className="text-sm text-gray-600">{ocrProgressLabel}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.round(ocrProgress * 100)}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round(ocrProgress * 100)}% complete</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- OCR RESULTS ---- */}
      {mode === 'ocr-results' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {getFileIcon(fileName)}
              <span className="text-sm font-semibold text-secondary-500">{fileName}</span>
              <span className="text-xs text-gray-400">— OCR scan complete</span>
            </div>
            <button onClick={resetAll} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>

          {/* Raw text (collapsible) */}
          <details className="px-5 py-3 border-b border-gray-100">
            <summary className="text-sm font-medium text-gray-500 cursor-pointer">Raw OCR Text (debug)</summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-x-auto whitespace-pre-wrap text-gray-700">{rawText}</pre>
          </details>

          {/* Parsed entries */}
          <div className="px-5 py-4">
            <h3 className="text-sm font-bold text-secondary-500 mb-3">Parsed Entries ({ocrEntries.length})</h3>
            {ocrEntries.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No entries could be parsed. Try adding rows manually below.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="pb-2 pr-2">Employee</th>
                      <th className="pb-2 pr-2">Date</th>
                      <th className="pb-2 pr-2">Clock In</th>
                      <th className="pb-2 pr-2">Clock Out</th>
                      <th className="pb-2 pr-2">Hours</th>
                      <th className="pb-2 pr-2">Project</th>
                      <th className="pb-2 pr-2">Conf.</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ocrEntries.map((entry, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-2"><input type="text" value={entry.employeeName ?? ''} onChange={(e) => updateOcrEntry(i, 'employeeName', e.target.value || null)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Name" /></td>
                        <td className="py-2 pr-2"><input type="date" value={entry.date ?? ''} onChange={(e) => updateOcrEntry(i, 'date', e.target.value || null)} className="border rounded px-2 py-1 text-sm" /></td>
                        <td className="py-2 pr-2"><input type="time" value={entry.clockIn ?? ''} onChange={(e) => updateOcrEntry(i, 'clockIn', e.target.value || null)} className="border rounded px-2 py-1 text-sm" /></td>
                        <td className="py-2 pr-2"><input type="time" value={entry.clockOut ?? ''} onChange={(e) => updateOcrEntry(i, 'clockOut', e.target.value || null)} className="border rounded px-2 py-1 text-sm" /></td>
                        <td className="py-2 pr-2"><input type="number" step="0.25" value={entry.hoursWorked ?? ''} onChange={(e) => updateOcrEntry(i, 'hoursWorked', e.target.value ? parseFloat(e.target.value) : null)} className="w-20 border rounded px-2 py-1 text-sm" placeholder="0.0" /></td>
                        <td className="py-2 pr-2"><input type="text" value={entry.project ?? ''} onChange={(e) => updateOcrEntry(i, 'project', e.target.value || null)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Project" /></td>
                        <td className="py-2 pr-2">{confidenceBadge(entry.confidence)}</td>
                        <td className="py-2"><button onClick={() => setOcrEntries((prev) => prev.filter((_, j) => j !== i))} className="p-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button onClick={() => setOcrEntries((prev) => [...prev, { employeeName: null, date: null, clockIn: null, clockOut: null, hoursWorked: null, project: null, notes: null, confidence: 0 }])}
              className="mt-3 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
              <Plus className="w-4 h-4" /> Add Row
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-t border-gray-200">
            <button onClick={() => { const file = currentFileRef.current; if (file) { resetAll(); setTimeout(() => processFile(file), 0); } }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300">
              <RotateCcw className="w-3.5 h-3.5" /> Re-scan
            </button>
            <div className="flex items-center gap-3">
              <button onClick={resetAll} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={() => {
                  const uniqueNames = [...new Set(ocrEntries.map(r => r.employeeName).filter(Boolean) as string[])];
                  const totalHrs = ocrEntries.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
                  const dates = ocrEntries.map(r => r.date).filter(Boolean).sort() as string[];
                  const ft = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' as const : 'image' as const;
                  setImportHistory(prev => [{
                    id: `imp-${Date.now()}`, fileName, fileType: ft,
                    entriesImported: ocrEntries.length, importedAt: new Date(),
                    employees: uniqueNames.length > 5 ? [`All employees (${uniqueNames.length})`] : uniqueNames.length > 0 ? uniqueNames : ['(manual entry)'],
                    totalHours: Math.round(totalHrs),
                    dateRange: dates.length ? `${dates[0]} - ${dates[dates.length - 1]}` : 'N/A',
                  }, ...prev]);
                  addToast(`${ocrEntries.length} entries imported from scan`, 'success'); resetAll();
                }}
                disabled={ocrEntries.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <Check className="w-3.5 h-3.5" /> Import {ocrEntries.length} Entries
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- IMPORT HISTORY ---- */}
      {importHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
            <History className="w-4 h-4 text-secondary-500" />
            <h3 className="text-sm font-bold text-secondary-500 uppercase">Import History</h3>
            <span className="text-xs text-gray-400 ml-auto">{importHistory.length} imports</span>
          </div>
          <div className="divide-y divide-gray-100">
            {importHistory.map((record) => (
              <div key={record.id} className="px-5 py-4 hover:bg-gray-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {record.fileType === 'excel' && <FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
                      {record.fileType === 'csv' && <FileText className="w-5 h-5 text-purple-600" />}
                      {record.fileType === 'pdf' && <FileText className="w-5 h-5 text-red-500" />}
                      {record.fileType === 'image' && <Camera className="w-5 h-5 text-primary-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-secondary-500 truncate">{record.fileName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(record.importedAt, 'MMM d, yyyy h:mm a')}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>{record.dateRange}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {record.employees.slice(0, 4).map((name) => (
                          <span key={name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{name}</span>
                        ))}
                        {record.employees.length > 4 && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{record.employees.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 text-green-600 mb-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">{record.entriesImported} entries</span>
                    </div>
                    <p className="text-xs text-gray-500">{record.totalHours}h total</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
