import { useMemo, useState, useEffect, useCallback } from 'react';
import { Activity, MapPin, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Employee, ActivityEvent } from '@servicecore/shared';
import { mockActivityEvents, mockEmployees } from '@servicecore/shared';

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

const LIVE_EVENT_LOCATIONS = [
  'Denver Metro',
  'Boulder CU',
  'Fort Collins',
  'CO Springs',
  'Arvada',
  'I-25 Corridor',
  'RiNo Development',
  'Red Rocks Area',
  'Cherry Creek',
  'DIA Terminal',
];

const LIVE_EVENT_TYPES: ActivityEvent['type'][] = ['clock_in', 'clock_out', 'note', 'break_start'];

function generateRandomEvent(employees: Employee[]): ActivityEvent {
  const emp = employees[Math.floor(Math.random() * employees.length)];
  const location = LIVE_EVENT_LOCATIONS[Math.floor(Math.random() * LIVE_EVENT_LOCATIONS.length)];
  const eventType = LIVE_EVENT_TYPES[Math.floor(Math.random() * LIVE_EVENT_TYPES.length)];

  return {
    id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    employeeId: emp.id,
    type: eventType,
    timestamp: new Date().toISOString(),
    location,
  };
}

export function TeamFeed() {
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const emp of mockEmployees) {
      map.set(emp.id, emp);
    }
    return map;
  }, []);

  const activeEmployees = useMemo(
    () => mockEmployees.filter((e) => e.isActive),
    []
  );

  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);

  const addLiveEvent = useCallback(() => {
    const newEvent = generateRandomEvent(activeEmployees);
    setLiveEvents((prev) => [newEvent, ...prev].slice(0, 10)); // keep max 10 live events
  }, [activeEmployees]);

  useEffect(() => {
    const interval = setInterval(addLiveEvent, 30000);
    return () => clearInterval(interval);
  }, [addLiveEvent]);

  const recentEvents = useMemo(() => {
    return [...mockActivityEvents]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 30);
  }, []);

  // Merge live events at the top
  const allEvents = useMemo(() => {
    return [...liveEvents, ...recentEvents];
  }, [liveEvents, recentEvents]);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <Activity className="w-5 h-5 text-[#f89020]" />
        <h3 className="text-base font-semibold text-[#0a1f44]">
          Team Activity
        </h3>
        {liveEvents.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Feed list */}
      {allEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Inbox className="w-10 h-10 mb-2" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
          {allEvents.map((event) => {
            const employee = employeeMap.get(event.employeeId);
            if (!employee) return null;

            const isLive = event.id.startsWith('live-');
            const relativeTime = formatDistanceToNow(
              new Date(event.timestamp),
              { addSuffix: true },
            );

            return (
              <div
                key={event.id}
                className={`flex items-center gap-3 px-5 py-3 border-l-4 ${borderColorMap[event.type]} hover:bg-gray-50 transition-colors ${
                  isLive ? 'bg-green-50/30' : ''
                }`}
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
