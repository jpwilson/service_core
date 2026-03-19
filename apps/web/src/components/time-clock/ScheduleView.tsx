import { useMemo } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { Employee, TimeEntry } from '@servicecore/shared';
import { formatHoursMinutes, calculateHoursWorked, mockProjects } from '@servicecore/shared';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';

interface ScheduleViewProps {
  employee: Employee;
  entries: TimeEntry[];
}

export function ScheduleView({ employee, entries }: ScheduleViewProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dayEntries = entries.filter((e) => isSameDay(parseISO(e.clockIn), date));
      const totalHours = dayEntries.reduce(
        (sum, e) => sum + calculateHoursWorked(e.clockIn, e.clockOut, e.breaks),
        0,
      );
      return { date, entries: dayEntries, totalHours };
    });
  }, [entries, weekStart]);

  const weekTotal = weekDays.reduce((sum, d) => sum + d.totalHours, 0);

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-secondary-500">Weekly Schedule</h2>
          <p className="text-xs text-gray-400">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-secondary-500">{formatHoursMinutes(weekTotal)}</p>
          <p className="text-xs text-gray-400">This Week</p>
        </div>
      </div>

      <div className="space-y-2">
        {weekDays.map(({ date, entries: dayEntries, totalHours }) => {
          const isToday = isSameDay(date, new Date());
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={date.toISOString()}
              className={`bg-white rounded-xl border p-3 ${
                isToday ? 'border-primary-500 ring-1 ring-primary-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isToday ? 'text-primary-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-semibold ${isToday ? 'text-primary-500' : 'text-secondary-500'}`}>
                    {format(date, 'EEEE')}
                  </span>
                  <span className="text-xs text-gray-400">{format(date, 'MMM d')}</span>
                  {isToday && (
                    <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold rounded uppercase">Today</span>
                  )}
                </div>
                <span className={`text-sm font-bold ${totalHours > 8 ? 'text-red-500' : 'text-secondary-500'}`}>
                  {totalHours > 0 ? formatHoursMinutes(totalHours) : isWeekend ? 'Off' : '--'}
                </span>
              </div>

              {dayEntries.length > 0 && (
                <div className="ml-6 space-y-1">
                  {dayEntries.map((entry) => {
                    const proj = mockProjects.find((p) => p.id === entry.projectId);
                    return (
                      <div key={entry.id} className="flex items-center gap-3 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(parseISO(entry.clockIn), 'h:mm a')}
                          {entry.clockOut && ` - ${format(parseISO(entry.clockOut), 'h:mm a')}`}
                        </span>
                        {proj && (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{proj.name}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming */}
      <div className="bg-primary-50 rounded-xl border border-primary-200 p-4">
        <h3 className="text-sm font-bold text-primary-800 mb-2">Scheduled This Week</h3>
        <p className="text-xs text-primary-600">
          {employee.department === 'Office'
            ? 'Mon-Fri, 8:00 AM - 5:00 PM (Standard office hours)'
            : employee.department === 'Drivers'
            ? 'Mon-Fri, 6:00 AM - 3:00 PM (Route schedule varies)'
            : 'Mon-Sat, 7:00 AM - 4:00 PM (Field assignments rotate)'}
        </p>
      </div>
    </div>
  );
}
