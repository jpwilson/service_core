import { ExcelActions } from '../features/import-export/ExcelActions';
import { TimesheetScanner } from '../features/ocr/TimesheetScanner';

export function Import() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0a1f44] mb-1">Import Data</h2>
        <p className="text-sm text-gray-500">
          Import timesheet data from Excel files or scan paper timesheets using OCR.
        </p>
      </div>

      <ExcelActions />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f89020]/10">
            <svg
              className="w-5 h-5 text-[#f89020]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[#0a1f44]">
            OCR Paper Timesheet Scanner
          </h3>
        </div>
        <div className="px-6 py-5">
          <TimesheetScanner />
        </div>
      </div>
    </div>
  );
}
