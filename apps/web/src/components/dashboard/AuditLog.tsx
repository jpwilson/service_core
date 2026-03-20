import { useState, useMemo } from 'react';
import { formatDistanceToNow, subHours, subDays, subMinutes } from 'date-fns';
import {
  Shield,
  Clock,
  AlertTriangle,
  Edit3,
  Bell,
  Settings,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Activity,
} from 'lucide-react';

type AuditType =
  | 'approval'
  | 'clock_event'
  | 'system_flag'
  | 'manual_edit'
  | 'reminder'
  | 'settings_change'
  | 'export'
  | 'import';

interface AuditEntry {
  id: number;
  timestamp: Date;
  actor: string;
  action: string;
  details: string;
  type: AuditType;
}

const typeConfig: Record<AuditType, { label: string; color: string; borderColor: string; icon: typeof Shield }> = {
  approval: { label: 'Approval', color: 'text-green-600 bg-green-50', borderColor: 'border-green-500', icon: CheckCircle2 },
  clock_event: { label: 'Clock Event', color: 'text-blue-600 bg-blue-50', borderColor: 'border-blue-500', icon: Clock },
  system_flag: { label: 'System Flag', color: 'text-amber-600 bg-amber-50', borderColor: 'border-amber-500', icon: AlertTriangle },
  manual_edit: { label: 'Manual Edit', color: 'text-purple-600 bg-purple-50', borderColor: 'border-purple-500', icon: Edit3 },
  reminder: { label: 'Reminder', color: 'text-cyan-600 bg-cyan-50', borderColor: 'border-cyan-500', icon: Bell },
  settings_change: { label: 'Settings', color: 'text-gray-600 bg-gray-50', borderColor: 'border-gray-500', icon: Settings },
  export: { label: 'Export', color: 'text-indigo-600 bg-indigo-50', borderColor: 'border-indigo-500', icon: Download },
  import: { label: 'Import', color: 'text-orange-600 bg-orange-50', borderColor: 'border-orange-500', icon: Upload },
};

const now = new Date();

const mockAuditEntries: AuditEntry[] = [
  { id: 1, timestamp: subMinutes(now, 8), actor: 'Andrea Quintana', action: 'Approved timesheet', details: 'Approved timesheet for Marcus Trujillo (44.5h, Mar 10-16)', type: 'approval' },
  { id: 2, timestamp: subMinutes(now, 23), actor: 'Marcus Trujillo', action: 'Clocked in', details: 'Clocked in at Denver Metro (6:02 AM)', type: 'clock_event' },
  { id: 3, timestamp: subMinutes(now, 47), actor: 'System', action: 'Auto-flagged overtime', details: 'Auto-flagged overtime for Carlos Vigil (42.3h weekly)', type: 'system_flag' },
  { id: 4, timestamp: subHours(now, 1), actor: 'JP Wilson', action: 'Edited time entry', details: 'Edited time entry for Jake Sandoval (changed clock-out from 3:30 PM to 4:15 PM)', type: 'manual_edit' },
  { id: 5, timestamp: subHours(now, 2), actor: 'System', action: 'Sent reminder emails', details: 'Sent reminder email to 5 employees with missing timesheets', type: 'reminder' },
  { id: 6, timestamp: subHours(now, 2.5), actor: 'Tyler Montoya', action: 'Clocked out', details: 'Clocked out at Colorado Springs South (3:47 PM)', type: 'clock_event' },
  { id: 7, timestamp: subHours(now, 3), actor: 'Andrea Quintana', action: 'Approved timesheet', details: 'Approved timesheet for Destiny Romero (40.0h, Mar 10-16)', type: 'approval' },
  { id: 8, timestamp: subHours(now, 3.5), actor: 'JP Wilson', action: 'Exported payroll report', details: 'Exported payroll report for pay period Mar 10-16 (PDF, 23 employees)', type: 'export' },
  { id: 9, timestamp: subHours(now, 4), actor: 'System', action: 'Auto-flagged overtime', details: 'Auto-flagged overtime for Derek Gallegos (41.8h weekly)', type: 'system_flag' },
  { id: 10, timestamp: subHours(now, 5), actor: 'Brian Kessler', action: 'Clocked in', details: 'Clocked in at Aurora East (5:58 AM)', type: 'clock_event' },
  { id: 11, timestamp: subHours(now, 6), actor: 'JP Wilson', action: 'Changed overtime rules', details: 'Changed overtime threshold from 40h to 44h for seasonal period', type: 'settings_change' },
  { id: 12, timestamp: subHours(now, 7), actor: 'Andrea Quintana', action: 'Edited time entry', details: 'Edited time entry for Sam Cordova (added missed lunch break, -0.5h)', type: 'manual_edit' },
  { id: 13, timestamp: subHours(now, 8), actor: 'System', action: 'Sent reminder emails', details: 'Sent clock-out reminder to 3 employees still on the clock after 5:00 PM', type: 'reminder' },
  { id: 14, timestamp: subHours(now, 10), actor: 'Miguel Archuleta', action: 'Clocked in', details: 'Clocked in at Pueblo West (10:45 AM — late arrival flagged)', type: 'clock_event' },
  { id: 15, timestamp: subHours(now, 12), actor: 'JP Wilson', action: 'Imported timesheets', details: 'Imported Kronos timesheets for week of Mar 3-9 (18 employees, 4 conflicts)', type: 'import' },
  { id: 16, timestamp: subDays(now, 1), actor: 'Andrea Quintana', action: 'Approved timesheet', details: 'Approved timesheet for Tyler Montoya (38.2h, Mar 10-16)', type: 'approval' },
  { id: 17, timestamp: subDays(now, 1), actor: 'System', action: 'Auto-flagged consecutive days', details: 'Auto-flagged Marcus Trujillo for 6 consecutive work days without rest', type: 'system_flag' },
  { id: 18, timestamp: subDays(now, 1), actor: 'JP Wilson', action: 'Edited time entry', details: 'Edited time entry for Miguel Archuleta (added 1.5h travel time)', type: 'manual_edit' },
  { id: 19, timestamp: subDays(now, 1.5), actor: 'Destiny Romero', action: 'Clocked out', details: 'Clocked out at Fort Collins North (4:01 PM)', type: 'clock_event' },
  { id: 20, timestamp: subDays(now, 2), actor: 'JP Wilson', action: 'Exported payroll report', details: 'Exported Excel timesheet summary for Mar 3-9 (XLSX, 23 employees)', type: 'export' },
  { id: 21, timestamp: subDays(now, 2), actor: 'System', action: 'Auto-flagged anomaly', details: 'Auto-flagged buddy punching suspicion: Tyler Montoya and Brian Kessler same location within 30s', type: 'system_flag' },
  { id: 22, timestamp: subDays(now, 2), actor: 'Andrea Quintana', action: 'Approved timesheet', details: 'Approved timesheet for Brian Kessler (40.0h, Mar 3-9)', type: 'approval' },
  { id: 23, timestamp: subDays(now, 3), actor: 'JP Wilson', action: 'Updated pay rates', details: 'Updated pay rate for Carlos Vigil ($26.50 → $28.00/hr, effective Mar 17)', type: 'settings_change' },
  { id: 24, timestamp: subDays(now, 3), actor: 'System', action: 'Sent reminder emails', details: 'Sent weekly timesheet submission reminder to 8 employees', type: 'reminder' },
  { id: 25, timestamp: subDays(now, 4), actor: 'JP Wilson', action: 'Imported timesheets', details: 'Imported paper timesheet scan for Sam Cordova (OCR processed, 2 fields flagged for review)', type: 'import' },
];

export function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AuditType | 'all'>('all');

  const filteredEntries = useMemo(() => {
    return mockAuditEntries.filter((entry) => {
      const matchesType = typeFilter === 'all' || entry.type === typeFilter;
      const matchesSearch =
        searchQuery === '' ||
        entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.actor.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [searchQuery, typeFilter]);

  const todayEntries = mockAuditEntries.filter(
    (e) => now.getTime() - e.timestamp.getTime() < 24 * 60 * 60 * 1000
  );
  const stats = {
    totalToday: todayEntries.length,
    manualEdits: todayEntries.filter((e) => e.type === 'manual_edit').length,
    systemFlags: todayEntries.filter((e) => e.type === 'system_flag').length,
    approvals: todayEntries.filter((e) => e.type === 'approval').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-500">Audit Log</h2>
          <p className="text-sm text-gray-500 mt-1">Complete activity trail for compliance and review</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-secondary-500" />
          <span className="text-sm font-medium text-secondary-500">{mockAuditEntries.length} total events</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Events Today', value: stats.totalToday, icon: Activity, color: 'text-blue-600' },
          { label: 'Manual Edits', value: stats.manualEdits, icon: Edit3, color: 'text-purple-600' },
          { label: 'System Flags', value: stats.systemFlags, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'Approvals', value: stats.approvals, icon: CheckCircle2, color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-secondary-500">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AuditType | 'all')}
            className="pl-10 pr-8 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Types</option>
            {Object.entries(typeConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No audit entries match your filters</p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const config = typeConfig[entry.type];
            const Icon = config.icon;
            return (
              <div
                key={entry.id}
                className={`rounded-xl border border-gray-200 bg-white p-4 border-l-4 ${config.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${config.color} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-secondary-500">{entry.actor}</span>
                      <span className="text-sm text-gray-600">{entry.action}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{entry.details}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
