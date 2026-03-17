import React from 'react';
import { Calendar } from 'lucide-react';
import {
  format,
  subDays,
  subMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const formatForInput = (date: Date): string => format(date, 'yyyy-MM-dd');

interface Preset {
  label: string;
  getRange: () => DateRange;
}

const presets: Preset[] = [
  {
    label: 'Last 7 days',
    getRange: () => ({
      start: subDays(new Date(), 6),
      end: new Date(),
    }),
  },
  {
    label: 'Last 30 days',
    getRange: () => ({
      start: subDays(new Date(), 29),
      end: new Date(),
    }),
  },
  {
    label: 'This month',
    getRange: () => ({
      start: startOfMonth(new Date()),
      end: new Date(),
    }),
  },
  {
    label: 'Last month',
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
    },
  },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      onChange({ ...value, start: date });
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      onChange({ ...value, end: date });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={formatForInput(value.start)}
            onChange={handleStartChange}
            className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f89020]/30 focus:border-[#f89020] text-[#0a1f44]"
          />
        </div>
        <span className="text-sm text-gray-500">to</span>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={formatForInput(value.end)}
            onChange={handleEndChange}
            className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f89020]/30 focus:border-[#f89020] text-[#0a1f44]"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.getRange())}
            className="px-3 py-1 text-xs font-medium rounded-full border border-gray-200 text-gray-600 hover:bg-[#f89020]/10 hover:text-[#f89020] hover:border-[#f89020]/30 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
