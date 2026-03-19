import { useState, useEffect, useMemo } from 'react';
import {
  Timer,
  TimerOff,
  Coffee,
  MapPinCheck,
  Car,
  Briefcase,
  Clock,
  BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Employee, TimeEntry, BreakType } from '@servicecore/shared';
import { formatHoursMinutes, mockProjects, calculateHoursWorked } from '@servicecore/shared';
import { useAppStore } from '../../store/useAppStore';

interface AdvancedModeProps {
  employee: Employee;
  entries: TimeEntry[];
}

export default function AdvancedMode({ employee, entries }: AdvancedModeProps) {
  const {
    isClockedIn,
    clockInTime,
    clockInProject,
    clockIn,
    clockOut,
    addToast,
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState<string>(clockInProject ?? '');
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakType, setBreakType] = useState<BreakType>('lunch');
  const [breakStart, setBreakStart] = useState<Date | null>(null);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOnBreak || !breakStart) return;
    const interval = setInterval(() => {
      setBreakElapsed(Math.floor((Date.now() - breakStart.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOnBreak, breakStart]);

  const hoursToday = useMemo(() => {
    if (!isClockedIn || !clockInTime) return 0;
    return (Date.now() - new Date(clockInTime).getTime()) / 3600000;
  }, [isClockedIn, clockInTime, currentTime]);

  const elapsedString = useMemo(() => {
    if (!isClockedIn || !clockInTime) return '';
    const totalSeconds = Math.floor((Date.now() - new Date(clockInTime).getTime()) / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }, [isClockedIn, clockInTime, currentTime]);

  const handleClockIn = () => {
    clockIn(selectedProject || undefined);
    addToast(`Clocked in at ${new Date().toLocaleTimeString()}`, 'success');
  };

  const handleClockOut = () => {
    clockOut();
    setIsOnBreak(false);
    addToast(`Clocked out - ${formatHoursMinutes(hoursToday)} worked`, 'success');
  };

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formatBreakTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const project = clockInProject
    ? mockProjects.find((p) => p.id === clockInProject)
    : null;

  // Recent timesheet entries (last 5)
  const recentEntries = useMemo(() => {
    return [...entries]
      .filter((e) => e.clockOut)
      .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
      .slice(0, 5)
      .map((entry) => {
        const proj = entry.projectId ? mockProjects.find((p) => p.id === entry.projectId) : null;
        const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
        const date = new Date(entry.clockIn).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        return {
          id: entry.id,
          projectName: proj?.name ?? 'Unassigned',
          date,
          hours,
        };
      });
  }, [entries]);

  // Weekly hours for bar chart
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const data = days.map((day, i) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayDate);
      dayEnd.setDate(dayDate.getDate() + 1);

      const dayHours = entries
        .filter((e) => {
          const clockIn = new Date(e.clockIn);
          return clockIn >= dayDate && clockIn < dayEnd && e.clockOut;
        })
        .reduce((sum, e) => sum + calculateHoursWorked(e.clockIn, e.clockOut, e.breaks), 0);

      return { day, hours: Math.round(dayHours * 10) / 10 };
    });

    return data;
  }, [entries]);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Time + Employee Row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-secondary-500 tabular-nums">{timeString}</p>
          <p className="text-xs text-gray-400">{dateString}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-secondary-500">{employee.firstName} {employee.lastName}</p>
          <p className="text-xs text-gray-400">{employee.role} &middot; {employee.department}</p>
        </div>
      </div>

      {/* Clock Button - centered, medium */}
      <div className="flex justify-center">
        <button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          className={`
            w-36 h-36 rounded-full flex flex-col items-center justify-center
            text-white font-bold text-base flex-shrink-0
            transition-all duration-200 active:scale-95
            ${
              isClockedIn
                ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] ring-3 ring-red-200'
                : 'bg-primary-500 shadow-[0_0_20px_rgba(248,144,32,0.3)] ring-3 ring-primary-200 hover:shadow-[0_0_40px_rgba(248,144,32,0.5)]'
            }
          `}
        >
          {isClockedIn ? (
            <>
              <TimerOff className="w-8 h-8 mb-1" />
              <span>CLOCK OUT</span>
              <span className="text-xs font-normal mt-0.5 opacity-80 tabular-nums">
                {elapsedString}
              </span>
            </>
          ) : (
            <>
              <Timer className="w-8 h-8 mb-1" />
              <span>CLOCK IN</span>
            </>
          )}
        </button>
      </div>

      {/* 4 Stat Cards in a row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Status</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs font-semibold text-secondary-500">{isClockedIn ? 'On Duty' : 'Off Duty'}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Today</p>
          <p className="text-xs font-semibold text-secondary-500 mt-1 tabular-nums">{formatHoursMinutes(hoursToday)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Rate</p>
          <p className="text-xs font-semibold text-secondary-500 mt-1">${employee.hourlyRate}/hr</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Earned</p>
          <p className="text-xs font-semibold text-green-600 mt-1">${(hoursToday * employee.hourlyRate).toFixed(2)}</p>
        </div>
      </div>

      {/* Project Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-4 h-4 text-primary-500" />
          <span className="text-xs font-semibold text-secondary-500 uppercase tracking-wide">Project / Task</span>
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          disabled={isClockedIn}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-secondary-500 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
        >
          <option value="">Select a project...</option>
          {mockProjects.filter((p) => p.isActive).map((p) => (
            <option key={p.id} value={p.id}>{p.name} - {p.client}</option>
          ))}
        </select>
        {project && isClockedIn && (
          <p className="text-xs text-primary-600 mt-1.5">Active: {project.name}</p>
        )}
      </div>

      {/* Break + GPS Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Break Tracking */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-semibold text-secondary-500">Break</span>
            </div>
            <button
              onClick={() => {
                if (isOnBreak) {
                  setIsOnBreak(false);
                  setBreakStart(null);
                  setBreakElapsed(0);
                } else {
                  setIsOnBreak(true);
                  setBreakStart(new Date());
                  setBreakElapsed(0);
                }
              }}
              disabled={!isClockedIn}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                !isClockedIn
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isOnBreak
                  ? 'bg-red-500 text-white'
                  : 'bg-primary-500 text-white'
              }`}
            >
              {isOnBreak ? 'End' : 'Start'}
            </button>
          </div>
          <div className="flex gap-1 mb-2">
            {(['lunch', 'rest', 'other'] as BreakType[]).map((bt) => (
              <button
                key={bt}
                onClick={() => setBreakType(bt)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  breakType === bt ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {bt}
              </button>
            ))}
          </div>
          {isOnBreak && (
            <p className="text-lg font-bold text-primary-500 tabular-nums text-center">{formatBreakTime(breakElapsed)}</p>
          )}
        </div>

        {/* GPS */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <MapPinCheck className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-secondary-500">GPS</span>
          </div>
          <p className="text-[10px] text-gray-500">39.7392, -104.9903</p>
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-medium">
            <span className="w-1 h-1 rounded-full bg-green-500" />
            In Geofence
          </span>
        </div>
      </div>

      {/* Notes + Mileage Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Shift notes..."
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-secondary-500 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
        <div>
          <label className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-wide mb-1">
            <Car className="w-3 h-3" /> Miles
          </label>
          <input
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-secondary-500 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Recent Timesheet */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary-500" />
          <span className="text-xs font-semibold text-secondary-500 uppercase tracking-wide">Recent Timesheet</span>
        </div>
        {recentEntries.length > 0 ? (
          <div className="space-y-1.5">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-secondary-500 truncate">{entry.projectName}</p>
                  <p className="text-[10px] text-gray-400">{entry.date}</p>
                </div>
                <span className="text-xs font-semibold text-primary-500 tabular-nums ml-2">{formatHoursMinutes(entry.hours)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-2">No recent entries</p>
        )}
      </div>

      {/* Weekly Hours Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-primary-500" />
          <span className="text-xs font-semibold text-secondary-500 uppercase tracking-wide">Weekly Hours</span>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(value) => [`${value}h`, 'Hours']}
              />
              <Bar dataKey="hours" fill="#f89020" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
