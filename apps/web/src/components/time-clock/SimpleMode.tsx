import { useState, useEffect } from 'react';
import { Timer, TimerOff, MapPin } from 'lucide-react';
import type { Employee, TimeEntry } from '../../types';
import { formatHoursMinutes } from '../../utils/formatters';
import { calculateHoursWorked } from '../../utils/calculations';

interface SimpleModeProps {
  employee: Employee;
  currentEntry: TimeEntry | null;
  onClockIn: () => void;
  onClockOut: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function SimpleMode({
  employee: _employee,
  currentEntry,
  onClockIn,
  onClockOut,
  notes,
  onNotesChange,
}: SimpleModeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isOnDuty = currentEntry !== null && currentEntry.clockOut === null;

  const hoursToday = currentEntry
    ? calculateHoursWorked(currentEntry.clockIn, currentEntry.clockOut, currentEntry.breaks)
    : 0;

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Current Time */}
      <div className="text-center">
        <p className="text-5xl font-bold text-secondary-500 tracking-tight">
          {timeString}
        </p>
        <p className="text-secondary-300 mt-1 text-sm">{dateString}</p>
      </div>

      {/* Current Shift Label */}
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary-500">
        Current Shift
      </p>

      {/* Giant Clock Button */}
      <div className="flex justify-center">
        <button
          onClick={isOnDuty ? onClockOut : onClockIn}
          className={`
            w-56 h-56 rounded-full flex flex-col items-center justify-center
            text-white font-bold text-2xl
            transition-transform active:scale-95
            ${
              isOnDuty
                ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-primary-500 shadow-[0_0_30px_rgba(248,144,32,0.3)] hover:shadow-[0_0_50px_rgba(248,144,32,0.5)]'
            }
          `}
        >
          {isOnDuty ? (
            <>
              <TimerOff className="w-12 h-12 mb-2" />
              <span>CLOCK OUT</span>
            </>
          ) : (
            <>
              <Timer className="w-12 h-12 mb-2" />
              <span>CLOCK IN</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Shift Status</p>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnDuty ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-semibold text-secondary-500">
              {isOnDuty ? 'On Duty' : 'Off Duty'}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Today</p>
          <p className="text-sm font-semibold text-secondary-500">
            {formatHoursMinutes(hoursToday)}
          </p>
        </div>
      </div>

      {/* Location Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
          <p className="text-sm font-medium text-secondary-500">
            Denver Central Logistics Hub
          </p>
        </div>
      </div>

      {/* Shift Notes */}
      <div>
        <label
          htmlFor="shift-notes"
          className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5"
        >
          Shift Notes
        </label>
        <textarea
          id="shift-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes about your shift..."
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary-500 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
}
