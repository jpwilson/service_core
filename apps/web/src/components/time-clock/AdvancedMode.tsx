import { useState, useEffect, useMemo } from 'react';
import {
  Timer,
  TimerOff,
  MapPin,
  Coffee,
  Camera,
  MapPinCheck,
  AlertTriangle,
  Car,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { Employee, TimeEntry, BreakType } from '@servicecore/shared';
import { formatHoursMinutes, calculateHoursWorked, getWeeklyHours, mockProjects } from '@servicecore/shared';
import { startOfWeek, parseISO, format } from 'date-fns';

interface AdvancedModeProps {
  employee: Employee;
  currentEntry: TimeEntry | null;
  onClockIn: () => void;
  onClockOut: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  entries: TimeEntry[];
}

export default function AdvancedMode({
  employee: _employee,
  currentEntry,
  onClockIn,
  onClockOut,
  notes,
  onNotesChange,
  entries,
}: AdvancedModeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState<string>(
    currentEntry?.projectId ?? '',
  );
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakType, setBreakType] = useState<BreakType>('lunch');
  const [breakStart, setBreakStart] = useState<Date | null>(null);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [mileage, setMileage] = useState<string>(
    currentEntry?.mileage?.toString() ?? '',
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track break duration
  useEffect(() => {
    if (!isOnBreak || !breakStart) return;
    const interval = setInterval(() => {
      setBreakElapsed(Math.floor((Date.now() - breakStart.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOnBreak, breakStart]);

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

  // Weekly hours chart data
  const weeklyData = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const dailyHours = getWeeklyHours(entries, weekStart);
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return dayLabels.map((day, i) => ({
      day,
      hours: Math.round(dailyHours[i] * 100) / 100,
    }));
  }, [entries]);

  const totalWeeklyHours = weeklyData.reduce((sum, d) => sum + d.hours, 0);

  // Last 7 entries
  const recentEntries = useMemo(() => {
    return [...entries]
      .filter((e) => e.clockOut !== null)
      .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
      .slice(0, 7);
  }, [entries]);

  const handleStartBreak = () => {
    setIsOnBreak(true);
    setBreakStart(new Date());
    setBreakElapsed(0);
  };

  const handleEndBreak = () => {
    setIsOnBreak(false);
    setBreakStart(null);
    setBreakElapsed(0);
  };

  const formatBreakTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const breakTypes: { value: BreakType; label: string }[] = [
    { value: 'lunch', label: 'Lunch' },
    { value: 'rest', label: 'Rest' },
    { value: 'other', label: 'Other' },
  ];

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
          htmlFor="shift-notes-adv"
          className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5"
        >
          Shift Notes
        </label>
        <textarea
          id="shift-notes-adv"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes about your shift..."
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary-500 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>

      {/* ===== ADVANCED SECTIONS ===== */}

      {/* Project / Task Dropdown */}
      <div>
        <label
          htmlFor="project-select"
          className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5"
        >
          Project / Task
        </label>
        <select
          id="project-select"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary-500 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select a project...</option>
          {mockProjects
            .filter((p) => p.isActive)
            .map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
        </select>
      </div>

      {/* Break Tracking */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-semibold text-secondary-500">Break Tracking</span>
          </div>
          <button
            onClick={isOnBreak ? handleEndBreak : handleStartBreak}
            disabled={!isOnDuty}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !isOnDuty
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isOnBreak
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {isOnBreak ? 'End Break' : 'Start Break'}
          </button>
        </div>

        {/* Break type pills */}
        <div className="flex gap-2">
          {breakTypes.map((bt) => (
            <button
              key={bt.value}
              onClick={() => setBreakType(bt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                breakType === bt.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {bt.label}
            </button>
          ))}
        </div>

        {/* Current break duration */}
        {isOnBreak && (
          <div className="bg-primary-50 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-primary-600 font-medium">
              Break in progress ({breakType})
            </p>
            <p className="text-2xl font-bold text-primary-500 tabular-nums">
              {formatBreakTime(breakElapsed)}
            </p>
          </div>
        )}
      </div>

      {/* GPS Location Indicator */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPinCheck className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-secondary-500">GPS Location</p>
            <p className="text-xs text-gray-500">39.7392, -104.9903</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Within Geofence
        </span>
      </div>

      {/* Timesheet History */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-secondary-500 mb-3">
          Recent Timesheet
        </h3>
        {recentEntries.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No recent entries</p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry) => {
              const hours = calculateHoursWorked(
                entry.clockIn,
                entry.clockOut,
                entry.breaks,
              );
              const project = mockProjects.find((p) => p.id === entry.projectId);
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-secondary-500">
                      {format(parseISO(entry.clockIn), 'EEE, MMM d')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {project?.name ?? 'No project'}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      hours > 8 ? 'text-red-500' : 'text-secondary-500'
                    }`}
                  >
                    {formatHoursMinutes(hours)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly Hours Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-secondary-500 mb-3">
          Weekly Hours
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                domain={[0, 12]}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}
                formatter={(value) => [`${Number(value).toFixed(1)}h`, 'Hours']}
              />
              <ReferenceLine
                y={8}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: '8h',
                  position: 'right',
                  fontSize: 10,
                  fill: '#ef4444',
                }}
              />
              <Bar
                dataKey="hours"
                fill="#f89020"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overtime Indicator */}
      {totalWeeklyHours > 32 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Overtime Alert</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You have logged {formatHoursMinutes(totalWeeklyHours)} this week.
              Projected overtime: {formatHoursMinutes(Math.max(0, totalWeeklyHours - 40))} at
              current pace.
            </p>
          </div>
        </div>
      )}

      {/* Mileage Entry */}
      <div>
        <label
          htmlFor="mileage-input"
          className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-1.5"
        >
          <Car className="w-3.5 h-3.5" />
          Mileage
        </label>
        <input
          id="mileage-input"
          type="number"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          placeholder="Enter miles driven..."
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary-500 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Photo Verification */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-primary-300 hover:text-primary-500 transition-colors">
        <Camera className="w-10 h-10 mb-2" />
        <p className="text-sm font-medium">Tap to verify</p>
        <p className="text-xs mt-0.5">Photo verification</p>
      </div>
    </div>
  );
}
