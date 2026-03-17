import { useState, useCallback, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, Loader2, X, Plus, Check, RotateCcw } from 'lucide-react';
import { parseOcrText, type OcrParsedEntry } from '@servicecore/shared';
import toast from 'react-hot-toast';

type ScanState = 'idle' | 'processing' | 'results';

export function TimesheetScanner() {
  const [state, setState] = useState<ScanState>('idle');
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [entries, setEntries] = useState<OcrParsedEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentFileRef = useRef<File | null>(null);

  const processImage = useCallback(async (file: File) => {
    currentFileRef.current = file;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setState('processing');
    setProgress(0);

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(m.progress);
          }
        },
      });

      const text = result.data.text;
      setRawText(text);
      const parsed = parseOcrText(text);
      setEntries(parsed);
      setState('results');
    } catch {
      toast.error('Failed to process image. Please try again.');
      setState('idle');
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        processImage(file);
      }
    },
    [processImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const updateEntry = (index: number, field: keyof OcrParsedEntry, value: string | number | null) => {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    );
  };

  const deleteEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        employeeName: null,
        date: null,
        clockIn: null,
        clockOut: null,
        hoursWorked: null,
        project: null,
        notes: null,
        confidence: 0,
      },
    ]);
  };

  const handleImport = () => {
    const count = entries.length;
    toast.success(`${count} timesheet ${count === 1 ? 'entry' : 'entries'} imported`);
    handleCancel();
  };

  const handleCancel = () => {
    setState('idle');
    setProgress(0);
    setImageUrl(null);
    setRawText('');
    setEntries([]);
    currentFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRescan = () => {
    const file = currentFileRef.current;
    if (file) {
      processImage(file);
    }
  };

  const confidenceBadge = (confidence: number) => {
    let color = 'bg-red-100 text-red-800';
    if (confidence > 0.7) color = 'bg-green-100 text-green-800';
    else if (confidence >= 0.4) color = 'bg-yellow-100 text-yellow-800';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {Math.round(confidence * 100)}%
      </span>
    );
  };

  // --- Idle State: Upload Area ---
  if (state === 'idle') {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
      >
        <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-1">Scan Paper Timesheet</p>
        <p className="text-sm text-gray-500 mb-4">
          Upload or drag and drop an image of a paper timesheet
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-orange-600 font-medium">
          <Upload className="w-4 h-4" />
          Choose Image
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // --- Processing State ---
  if (state === 'processing') {
    return (
      <div className="border rounded-lg p-8">
        <div className="flex items-start gap-4">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Uploaded timesheet"
              className="w-32 h-32 object-cover rounded border"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              <span className="text-sm font-medium text-gray-700">Analyzing timesheet...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round(progress * 100)}% complete</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Results State ---
  return (
    <div className="border rounded-lg divide-y">
      {/* Raw OCR text (collapsible) */}
      <details className="p-4">
        <summary className="text-sm font-medium text-gray-600 cursor-pointer">
          Raw OCR Text (debug)
        </summary>
        <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-x-auto whitespace-pre-wrap text-gray-700">
          {rawText}
        </pre>
      </details>

      {/* Parsed entries table */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Parsed Entries ({entries.length})
        </h3>

        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No entries could be parsed. Try adding rows manually.
          </p>
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
                {entries.map((entry, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={entry.employeeName ?? ''}
                        onChange={(e) => updateEntry(i, 'employeeName', e.target.value || null)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Name"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="date"
                        value={entry.date ?? ''}
                        onChange={(e) => updateEntry(i, 'date', e.target.value || null)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="time"
                        value={entry.clockIn ?? ''}
                        onChange={(e) => updateEntry(i, 'clockIn', e.target.value || null)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="time"
                        value={entry.clockOut ?? ''}
                        onChange={(e) => updateEntry(i, 'clockOut', e.target.value || null)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        step="0.25"
                        value={entry.hoursWorked ?? ''}
                        onChange={(e) =>
                          updateEntry(
                            i,
                            'hoursWorked',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="w-20 border rounded px-2 py-1 text-sm"
                        placeholder="0.0"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={entry.project ?? ''}
                        onChange={(e) => updateEntry(i, 'project', e.target.value || null)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Project"
                      />
                    </td>
                    <td className="py-2 pr-2">{confidenceBadge(entry.confidence)}</td>
                    <td className="py-2">
                      <button
                        onClick={() => deleteEntry(i)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove entry"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={addEntry}
          className="mt-3 flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Row
        </button>
      </div>

      {/* Action buttons */}
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={handleImport}
          disabled={entries.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          <Check className="w-4 h-4" />
          Import Entries
        </button>
        <button
          onClick={handleRescan}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Re-scan
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
