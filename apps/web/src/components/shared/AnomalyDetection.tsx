import { useState } from 'react';
import { formatDistanceToNow, subDays, subHours } from 'date-fns';
import {
  ShieldAlert,
  Users,
  Repeat,
  MapPin,
  Radio,
  Clock,
  Timer,
  Eye,
  XCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

type Severity = 'high' | 'medium' | 'low';
type AnomalyStatus = 'pending' | 'reviewed' | 'dismissed';

interface Anomaly {
  id: number;
  severity: Severity;
  type: string;
  employee: string;
  description: string;
  date: Date;
  status: AnomalyStatus;
  icon: typeof ShieldAlert;
}

const severityConfig: Record<Severity, { badge: string; dot: string }> = {
  high: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  medium: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  low: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
};

const now = new Date();

const initialAnomalies: Anomaly[] = [
  {
    id: 1,
    severity: 'high',
    type: 'Buddy Punching',
    employee: 'Tyler Montoya',
    description:
      'Buddy punching suspected: Tyler Montoya clocked in from same IP/location as Brian Kessler within 30 seconds (Mar 14)',
    date: subDays(now, 6),
    status: 'pending',
    icon: Users,
  },
  {
    id: 2,
    severity: 'medium',
    type: 'Consistent Rounding',
    employee: 'Destiny Romero',
    description:
      'Consistent rounding: Destiny Romero has clocked exactly 8.00h for 12 consecutive days',
    date: subDays(now, 1),
    status: 'pending',
    icon: Repeat,
  },
  {
    id: 3,
    severity: 'high',
    type: 'Mileage Discrepancy',
    employee: 'Jake Sandoval',
    description:
      'Mileage discrepancy: Jake Sandoval claimed 142mi but route distance is 98mi (Mar 15)',
    date: subDays(now, 5),
    status: 'pending',
    icon: MapPin,
  },
  {
    id: 4,
    severity: 'high',
    type: 'Ghost Shift',
    employee: 'Sam Cordova',
    description:
      'Ghost shift: Sam Cordova has no GPS movement for 3.5h during shift (Mar 13, 10:30 AM – 2:00 PM)',
    date: subDays(now, 7),
    status: 'pending',
    icon: Radio,
  },
  {
    id: 5,
    severity: 'medium',
    type: 'Pattern Break',
    employee: 'Miguel Archuleta',
    description:
      'Pattern break: Miguel Archuleta typically starts at 7:00 AM, clocked in at 10:45 AM 3 times this week',
    date: subHours(now, 8),
    status: 'pending',
    icon: Clock,
  },
  {
    id: 6,
    severity: 'low',
    type: 'Overtime Gaming',
    employee: 'Derek Gallegos',
    description:
      'Overtime gaming: Derek Gallegos worked 7.9h on 8 of last 10 days (just under OT threshold)',
    date: subDays(now, 2),
    status: 'pending',
    icon: Timer,
  },
];

export function AnomalyDetection() {
  const [anomalies, setAnomalies] = useState(initialAnomalies);

  const updateStatus = (id: number, status: AnomalyStatus) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const pendingAnomalies = anomalies.filter((a) => a.status === 'pending');
  const highSeverity = pendingAnomalies.filter((a) => a.severity === 'high').length;
  const reviewed = anomalies.filter((a) => a.status === 'reviewed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-500">Anomaly Detection</h2>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered timesheet analysis for fraud prevention and compliance
          </p>
        </div>
        <ShieldAlert className="h-6 w-6 text-primary-500" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-gray-500 font-medium">Detected</span>
          </div>
          <p className="text-2xl font-bold text-secondary-500">{pendingAnomalies.length}</p>
          <p className="text-xs text-gray-400">pending review</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <span className="text-xs text-gray-500 font-medium">High Severity</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{highSeverity}</p>
          <p className="text-xs text-gray-400">require attention</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-500 font-medium">Reviewed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{reviewed}</p>
          <p className="text-xs text-gray-400">resolved</p>
        </div>
      </div>

      {/* Anomaly Cards */}
      <div className="space-y-3">
        {anomalies.map((anomaly) => {
          const severity = severityConfig[anomaly.severity];
          const Icon = anomaly.icon;
          const isDismissed = anomaly.status === 'dismissed';
          const isReviewed = anomaly.status === 'reviewed';

          return (
            <div
              key={anomaly.id}
              className={`rounded-xl border border-gray-200 bg-white p-4 transition-opacity ${
                isDismissed ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-lg bg-gray-50 p-2.5">
                  <Icon className="h-5 w-5 text-secondary-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${severity.badge}`}>
                      {anomaly.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-gray-500">{anomaly.type}</span>
                    {isReviewed && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                        Reviewed
                      </span>
                    )}
                    {isDismissed && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                        Dismissed
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-secondary-500 font-medium mb-1">{anomaly.employee}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{anomaly.description}</p>

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(anomaly.date, { addSuffix: true })}
                    </span>

                    {anomaly.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(anomaly.id, 'reviewed')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Review
                        </button>
                        <button
                          onClick={() => updateStatus(anomaly.id, 'dismissed')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          <XCircle className="h-3 w-3" />
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
