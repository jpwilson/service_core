import { useState } from 'react';
import { format } from 'date-fns';
import {
  Download,
  FileText,
  CheckCircle,
  Clock,
  LinkIcon,
  AlertCircle,
  History,
} from 'lucide-react';
import {
  mockTimeEntries,
  mockEmployees,
  calculateHoursWorked,
  calculateOvertimeHours,
} from '@servicecore/shared';
import { useAppStore } from '../../store/useAppStore';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface ExportRecord {
  id: string;
  formatName: string;
  fileName: string;
  exportedAt: Date;
  employeeCount: number;
  totalHours: number;
  payPeriod: string;
}

interface SyncConnection {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastSync: Date | null;
  color: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'quickbooks',
    name: 'QuickBooks Online CSV',
    description: 'Standard CSV format compatible with QuickBooks Online payroll import. Includes employee hours, overtime, pay rates, and department mapping.',
    icon: 'QB',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'xero',
    name: 'Xero CSV',
    description: 'Formatted for Xero accounting payroll module. Maps employees to Xero contacts with earnings categories and pay items.',
    icon: 'XR',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'adp',
    name: 'ADP CSV',
    description: 'ADP Workforce Now compatible format with company code, file number, earnings codes, and batch ID for seamless payroll processing.',
    icon: 'ADP',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    id: 'generic',
    name: 'Generic Payroll CSV',
    description: 'Universal CSV format that works with most payroll systems. Clean column headers with employee details, hours breakdown, and gross pay.',
    icon: 'CSV',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

const INITIAL_EXPORT_HISTORY: ExportRecord[] = [
  {
    id: 'exp-demo-1',
    formatName: 'QuickBooks Online CSV',
    fileName: 'servicecore-qb-payroll-2026-03-14.csv',
    exportedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    employeeCount: 18,
    totalHours: 1440,
    payPeriod: 'Mar 1 - Mar 14',
  },
  {
    id: 'exp-demo-2',
    formatName: 'ADP CSV',
    fileName: 'servicecore-adp-payroll-2026-02-28.csv',
    exportedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    employeeCount: 16,
    totalHours: 1280,
    payPeriod: 'Feb 15 - Feb 28',
  },
  {
    id: 'exp-demo-3',
    formatName: 'Generic Payroll CSV',
    fileName: 'servicecore-payroll-2026-02-14.csv',
    exportedAt: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000),
    employeeCount: 17,
    totalHours: 1360,
    payPeriod: 'Feb 1 - Feb 14',
  },
];

const SYNC_CONNECTIONS: SyncConnection[] = [
  {
    id: 'qb',
    name: 'QuickBooks Online',
    description: 'Auto-sync timesheets to QuickBooks payroll each pay period',
    connected: false,
    lastSync: null,
    color: 'border-green-200',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Push approved hours directly to Xero pay runs',
    connected: false,
    lastSync: null,
    color: 'border-blue-200',
  },
  {
    id: 'adp',
    name: 'ADP Workforce Now',
    description: 'Sync employee hours and earnings codes to ADP batches',
    connected: false,
    lastSync: null,
    color: 'border-red-200',
  },
];

function buildPayrollData() {
  const employeeMap = new Map(mockEmployees.map((e) => [e.id, e]));

  const aggregated = new Map<
    string,
    { employee: typeof mockEmployees[0]; totalHours: number; otHours: number; department: string }
  >();

  for (const entry of mockTimeEntries) {
    const emp = employeeMap.get(entry.employeeId);
    if (!emp || !entry.clockOut) continue;

    const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
    const { overtime } = calculateOvertimeHours(hours, 8);

    const existing = aggregated.get(emp.id);
    if (existing) {
      existing.totalHours += hours;
      existing.otHours += overtime;
    } else {
      aggregated.set(emp.id, {
        employee: emp,
        totalHours: hours,
        otHours: overtime,
        department: emp.department,
      });
    }
  }

  return Array.from(aggregated.values()).map((row) => ({
    employeeName: `${row.employee.firstName} ${row.employee.lastName}`,
    employeeId: row.employee.id,
    regularHours: Math.round((row.totalHours - row.otHours) * 100) / 100,
    otHours: Math.round(row.otHours * 100) / 100,
    rate: row.employee.hourlyRate,
    otRate: row.employee.overtimeRate,
    grossPay:
      Math.round(
        ((row.totalHours - row.otHours) * row.employee.hourlyRate +
          row.otHours * row.employee.overtimeRate) *
          100
      ) / 100,
    department: row.department,
  }));
}

function generateQuickBooksCsv(data: ReturnType<typeof buildPayrollData>): string {
  const headers = ['Employee', 'Hours', 'OT Hours', 'Rate', 'Gross Pay', 'Department', 'Pay Period'];
  const payPeriod = `${format(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), 'MM/dd/yyyy')} - ${format(new Date(), 'MM/dd/yyyy')}`;
  const rows = data.map((r) =>
    [r.employeeName, r.regularHours, r.otHours, r.rate.toFixed(2), r.grossPay.toFixed(2), r.department, payPeriod].join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function generateXeroCsv(data: ReturnType<typeof buildPayrollData>): string {
  const headers = ['ContactName', 'EmailAddress', 'EarningsCategory', 'Units', 'Rate', 'Amount', 'PayRunDate'];
  const payRunDate = format(new Date(), 'dd/MM/yyyy');
  const rows: string[] = [];
  for (const r of data) {
    rows.push([r.employeeName, '', 'Ordinary Hours', r.regularHours, r.rate.toFixed(2), (r.regularHours * r.rate).toFixed(2), payRunDate].join(','));
    if (r.otHours > 0) {
      rows.push([r.employeeName, '', 'Overtime', r.otHours, r.otRate.toFixed(2), (r.otHours * r.otRate).toFixed(2), payRunDate].join(','));
    }
  }
  return [headers.join(','), ...rows].join('\n');
}

function generateAdpCsv(data: ReturnType<typeof buildPayrollData>): string {
  const headers = ['CompanyCode', 'BatchID', 'FileNumber', 'EmployeeName', 'EarningsCode', 'Hours', 'Rate', 'Amount', 'Department'];
  const batchId = `SC-${format(new Date(), 'yyyyMMdd')}`;
  const rows: string[] = [];
  data.forEach((r, i) => {
    const fileNum = String(i + 1).padStart(6, '0');
    rows.push(['SC001', batchId, fileNum, r.employeeName, 'REG', r.regularHours, r.rate.toFixed(2), (r.regularHours * r.rate).toFixed(2), r.department].join(','));
    if (r.otHours > 0) {
      rows.push(['SC001', batchId, fileNum, r.employeeName, 'OT', r.otHours, r.otRate.toFixed(2), (r.otHours * r.otRate).toFixed(2), r.department].join(','));
    }
  });
  return [headers.join(','), ...rows].join('\n');
}

function generateGenericCsv(data: ReturnType<typeof buildPayrollData>): string {
  const headers = ['Employee Name', 'Employee ID', 'Department', 'Regular Hours', 'Overtime Hours', 'Hourly Rate', 'OT Rate', 'Regular Pay', 'OT Pay', 'Gross Pay'];
  const rows = data.map((r) =>
    [
      r.employeeName,
      r.employeeId,
      r.department,
      r.regularHours,
      r.otHours,
      r.rate.toFixed(2),
      r.otRate.toFixed(2),
      (r.regularHours * r.rate).toFixed(2),
      (r.otHours * r.otRate).toFixed(2),
      r.grossPay.toFixed(2),
    ].join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function QuickBooksExport() {
  const { addToast } = useAppStore();
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>(INITIAL_EXPORT_HISTORY);
  const [connections] = useState<SyncConnection[]>(SYNC_CONNECTIONS);

  const handleExport = (formatId: string, formatName: string) => {
    const data = buildPayrollData();
    if (data.length === 0) {
      addToast('No payroll data available to export', 'info');
      return;
    }

    let csv: string;
    let prefix: string;

    switch (formatId) {
      case 'quickbooks':
        csv = generateQuickBooksCsv(data);
        prefix = 'qb-payroll';
        break;
      case 'xero':
        csv = generateXeroCsv(data);
        prefix = 'xero-payroll';
        break;
      case 'adp':
        csv = generateAdpCsv(data);
        prefix = 'adp-payroll';
        break;
      default:
        csv = generateGenericCsv(data);
        prefix = 'payroll';
        break;
    }

    const fileName = `servicecore-${prefix}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCsv(csv, fileName);

    const totalHours = data.reduce((sum, r) => sum + r.regularHours + r.otHours, 0);
    setExportHistory((prev) => [
      {
        id: `exp-${Date.now()}`,
        formatName,
        fileName,
        exportedAt: new Date(),
        employeeCount: data.length,
        totalHours: Math.round(totalHours),
        payPeriod: `${format(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), 'MMM d')} - ${format(new Date(), 'MMM d')}`,
      },
      ...prev,
    ]);

    addToast(`Payroll exported as ${formatName}`, 'success');
  };

  const handleConnect = (name: string) => {
    addToast(`${name} integration requires an API key. Contact your admin.`, 'info');
  };

  // Summary stats from current data
  const payrollData = buildPayrollData();
  const totalEmployees = payrollData.length;
  const totalHours = payrollData.reduce((sum, r) => sum + r.regularHours + r.otHours, 0);
  const totalGross = payrollData.reduce((sum, r) => sum + r.grossPay, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-secondary-500 font-display">Accounting & Payroll Export</h2>
        <p className="text-sm text-gray-500">
          Export payroll data to your accounting system or connect for automatic sync.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Employees', value: totalEmployees, sub: 'in current period' },
          { label: 'Total Hours', value: Math.round(totalHours).toLocaleString(), sub: 'regular + overtime' },
          { label: 'Gross Payroll', value: `$${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'estimated total' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-secondary-500 font-display mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Export Formats */}
      <div>
        <h3 className="text-sm font-bold text-secondary-500 uppercase tracking-wider mb-3">Export Formats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORT_FORMATS.map((fmt) => (
            <div
              key={fmt.id}
              className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-lg ${fmt.bgColor} ${fmt.borderColor} border flex items-center justify-center`}
                >
                  <span className={`text-sm font-black ${fmt.color}`}>{fmt.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-secondary-500">{fmt.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{fmt.description}</p>
                  <button
                    onClick={() => handleExport(fmt.id, fmt.name)}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Status */}
      <div>
        <h3 className="text-sm font-bold text-secondary-500 uppercase tracking-wider mb-3">Sync Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className={`bg-white rounded-xl border ${conn.color} p-5`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-secondary-500">{conn.name}</h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  <AlertCircle className="w-3 h-3" />
                  Not Connected
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">{conn.description}</p>
              <button
                onClick={() => handleConnect(conn.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary-500 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <LinkIcon className="w-3 h-3" />
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
            <History className="w-4 h-4 text-secondary-500" />
            <h3 className="text-sm font-bold text-secondary-500 uppercase">Last Exports</h3>
            <span className="text-xs text-gray-400 ml-auto">{exportHistory.length} exports</span>
          </div>
          <div className="divide-y divide-gray-100">
            {exportHistory.map((record) => (
              <div key={record.id} className="px-5 py-4 hover:bg-gray-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-secondary-500 truncate">{record.fileName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(record.exportedAt, 'MMM d, yyyy h:mm a')}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>{record.formatName}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Pay period: {record.payPeriod}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 text-green-600 mb-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">{record.employeeCount} employees</span>
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
