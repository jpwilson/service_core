import { useMemo } from 'react';
import { Activity, MapPin, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { mockActivityEvents } from '../../data/mockTimeEntries';
import { mockEmployees } from '../../data/mockEmployees';
import type { Employee, ActivityEvent } from '../../types';

const actionTextMap: Record<ActivityEvent['type'], string> = {
  clock_in: 'clocked in',
  clock_out: 'clocked out',
  break_start: 'started break',
  break_end: 'ended break',
  note: 'added note',
};

const borderColorMap: Record<ActivityEvent['type'], string> = {
  clock_in: 'border-l-green-500',
  clock_out: 'border-l-red-500',
  break_start: 'border-l-amber-500',
  break_end: 'border-l-amber-500',
  note: 'border-l-blue-500',
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function TeamFeed() {
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const emp of mockEmployees) {
      map.set(emp.id, emp);
    }
    return map;
  }, []);

  const recentEvents = useMemo(() => {
    return [...mockActivityEvents]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 30);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <Activity className="w-5 h-5 text-[#f89020]" />
        <h3 className="text-base font-semibold text-[#0a1f44]">
          Team Activity
        </h3>
      </div>

      {/* Feed list */}
      {recentEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Inbox className="w-10 h-10 mb-2" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
          {recentEvents.map((event) => {
            const employee = employeeMap.get(event.employeeId);
            if (!employee) return null;

            const relativeTime = formatDistanceToNow(
              new Date(event.timestamp),
              { addSuffix: true },
            );

            return (
              <div
                key={event.id}
                className={`flex items-center gap-3 px-5 py-3 border-l-4 ${borderColorMap[event.type]} hover:bg-gray-50 transition-colors`}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold"
                  style={{ backgroundColor: employee.avatarColor }}
                >
                  {getInitials(employee.firstName, employee.lastName)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-[#0a1f44]">
                      {employee.firstName} {employee.lastName}
                    </span>
                    <span className="text-sm text-gray-600">
                      {actionTextMap[event.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400 truncate">
                      {event.location}
                    </span>
                  </div>
                </div>

                {/* Time */}
                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                  {relativeTime}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100">
        <button className="text-sm font-medium text-[#f89020] hover:text-[#e07810] transition-colors">
          View All
        </button>
      </div>
    </div>
  );
}
