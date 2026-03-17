import { useState } from 'react';
import {
  Calendar,
  Clock,
  Coffee,
  Building2,
  DollarSign,
  Download,
  Save,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { PayPeriodType } from '@servicecore/shared';
import { mockEmployees, formatCurrency } from '@servicecore/shared';
import { ExcelActions } from '../features/import-export/ExcelActions';
import { PayrollReportButton } from '../features/reports/PayrollReportButton';

export function Settings() {
  const { settings, updateSettings, addToast } = useAppStore();

  // --- Pay Period ---
  const [payPeriod, setPayPeriod] = useState<PayPeriodType>(settings.payPeriodType);

  function savePayPeriod() {
    updateSettings({ payPeriodType: payPeriod });
    addToast('Pay period updated', 'success');
  }

  // --- Overtime Rules ---
  const [dailyThreshold, setDailyThreshold] = useState(settings.overtimeRules.dailyThreshold);
  const [weeklyThreshold, setWeeklyThreshold] = useState(settings.overtimeRules.weeklyThreshold);
  const [otMultiplier, setOtMultiplier] = useState(settings.overtimeRules.overtimeMultiplier);
  const [dtMultiplier, setDtMultiplier] = useState(settings.overtimeRules.doubleTimeMultiplier);

  function saveOvertimeRules() {
    updateSettings({
      overtimeRules: {
        dailyThreshold,
        weeklyThreshold,
        overtimeMultiplier: otMultiplier,
        doubleTimeMultiplier: dtMultiplier,
      },
    });
    addToast('Overtime rules updated', 'success');
  }

  // --- Break Rules ---
  const [autoDeduct, setAutoDeduct] = useState(settings.breakRules.autoDeductMinutes);
  const [afterHours, setAfterHours] = useState(settings.breakRules.afterHoursThreshold);

  function saveBreakRules() {
    updateSettings({
      breakRules: {
        autoDeductMinutes: autoDeduct,
        afterHoursThreshold: afterHours,
      },
    });
    addToast('Break rules updated', 'success');
  }

  // --- Export ---
  function handleExport(format: string) {
    addToast(`Export started: ${format}...`, 'info');
  }

  // Unique roles with department and rate
  const payRates = mockEmployees.reduce<
    { role: string; department: string; rate: number }[]
  >((acc, emp) => {
    const key = `${emp.role}-${emp.department}`;
    if (!acc.some((r) => `${r.role}-${r.department}` === key)) {
      acc.push({ role: emp.role, department: emp.department, rate: emp.hourlyRate });
    }
    return acc;
  }, []);

  const PAY_PERIOD_OPTIONS: { value: PayPeriodType; label: string }[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-Weekly' },
    { value: 'semi-monthly', label: 'Semi-Monthly' },
  ];

  return (
    <div className="space-y-6">
      {/* Pay Period */}
      <SectionCard
        icon={<Calendar className="w-5 h-5 text-[#f89020]" />}
        title="Pay Period"
        onSave={savePayPeriod}
      >
        <div className="flex flex-wrap gap-3">
          {PAY_PERIOD_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors
                ${payPeriod === option.value
                  ? 'border-[#f89020] bg-[#f89020]/5 text-[#f89020]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="payPeriod"
                value={option.value}
                checked={payPeriod === option.value}
                onChange={() => setPayPeriod(option.value)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  payPeriod === option.value ? 'border-[#f89020]' : 'border-gray-300'
                }`}
              >
                {payPeriod === option.value && (
                  <div className="w-2 h-2 rounded-full bg-[#f89020]" />
                )}
              </div>
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      {/* Overtime Rules */}
      <SectionCard
        icon={<Clock className="w-5 h-5 text-[#f89020]" />}
        title="Overtime Rules"
        onSave={saveOvertimeRules}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField
            label="Daily Threshold (hrs)"
            value={dailyThreshold}
            onChange={setDailyThreshold}
            min={1}
            max={24}
            step={0.5}
          />
          <NumberField
            label="Weekly Threshold (hrs)"
            value={weeklyThreshold}
            onChange={setWeeklyThreshold}
            min={1}
            max={168}
            step={1}
          />
          <NumberField
            label="Overtime Multiplier"
            value={otMultiplier}
            onChange={setOtMultiplier}
            min={1}
            max={5}
            step={0.1}
          />
          <NumberField
            label="Double-Time Multiplier"
            value={dtMultiplier}
            onChange={setDtMultiplier}
            min={1}
            max={5}
            step={0.1}
          />
        </div>
      </SectionCard>

      {/* Break Rules */}
      <SectionCard
        icon={<Coffee className="w-5 h-5 text-[#f89020]" />}
        title="Break Rules"
        onSave={saveBreakRules}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField
            label="Auto-Deduct (minutes)"
            value={autoDeduct}
            onChange={setAutoDeduct}
            min={0}
            max={120}
            step={5}
          />
          <NumberField
            label="After-Hours Threshold (hrs)"
            value={afterHours}
            onChange={setAfterHours}
            min={1}
            max={12}
            step={0.5}
          />
        </div>
      </SectionCard>

      {/* Departments */}
      <SectionCard
        icon={<Building2 className="w-5 h-5 text-[#f89020]" />}
        title="Departments"
      >
        <div className="flex flex-wrap gap-2">
          {settings.departments.map((dept) => (
            <span
              key={dept}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-[#0a1f44] bg-[#0a1f44]/5 border border-[#0a1f44]/10 rounded-full"
            >
              {dept}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">Department management available in a future release.</p>
      </SectionCard>

      {/* Pay Rates */}
      <SectionCard
        icon={<DollarSign className="w-5 h-5 text-[#f89020]" />}
        title="Pay Rates"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Department</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Hourly Rate</th>
              </tr>
            </thead>
            <tbody>
              {payRates.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-2 px-3 text-[#0a1f44] font-medium">{row.role}</td>
                  <td className="py-2 px-3 text-gray-500">{row.department}</td>
                  <td className="py-2 px-3 text-right text-[#0a1f44] font-medium">
                    {formatCurrency(row.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-400">Rate editing available in a future release.</p>
      </SectionCard>

      {/* Excel Import / Export */}
      <ExcelActions />

      {/* Other Export Options */}
      <SectionCard
        icon={<Download className="w-5 h-5 text-[#f89020]" />}
        title="Other Export Options"
      >
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('CSV')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0a1f44] bg-white border border-gray-200 hover:border-[#f89020] hover:text-[#f89020] rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('QuickBooks Format')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0a1f44] bg-white border border-gray-200 hover:border-[#f89020] hover:text-[#f89020] rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            QuickBooks Format
          </button>
          <PayrollReportButton />
        </div>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                             */
/* ------------------------------------------------------------------ */

function SectionCard({
  icon,
  title,
  onSave,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onSave?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f89020]/10">
            {icon}
          </div>
          <h3 className="text-base font-semibold text-[#0a1f44]">{title}</h3>
        </div>
        {onSave && (
          <button
            onClick={onSave}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#f89020] hover:bg-[#e07d10] rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 text-sm text-[#0a1f44] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f89020]/40 focus:border-[#f89020] transition-colors"
      />
    </div>
  );
}
