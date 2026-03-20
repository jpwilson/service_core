import { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  UserX,
  X,
  ChevronRight,
} from 'lucide-react';

type Severity = 'warning' | 'info' | 'critical';

interface PredictiveAlert {
  id: number;
  severity: Severity;
  title: string;
  message: string;
  suggestedAction: string;
  icon: typeof TrendingUp;
}

const severityStyles: Record<Severity, { bg: string; border: string; badge: string; iconColor: string }> = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    iconColor: 'text-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    iconColor: 'text-amber-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    iconColor: 'text-blue-500',
  },
};

const initialAlerts: PredictiveAlert[] = [
  {
    id: 1,
    severity: 'warning',
    title: 'Overtime Projection',
    message:
      'Carlos Vigil is at 34.5h (Mon–Thu). Projected 43.1h by Friday — 3.1h OT ($125.55 cost)',
    suggestedAction: 'Reassign Friday routes',
    icon: TrendingUp,
  },
  {
    id: 2,
    severity: 'critical',
    title: 'Consecutive Days',
    message:
      'Marcus Trujillo has worked 6 consecutive days. Consider rest day per OSHA guidelines.',
    suggestedAction: 'Schedule day off',
    icon: Calendar,
  },
  {
    id: 3,
    severity: 'warning',
    title: 'Budget Alert',
    message:
      'Denver Metro project at 89% of budget ($129,050 / $145,000). 2 weeks remaining.',
    suggestedAction: 'Review budget',
    icon: DollarSign,
  },
  {
    id: 4,
    severity: 'info',
    title: 'Possible No-Shows',
    message:
      '3 employees have not clocked in today by 8:00 AM (typical start). Possible no-shows.',
    suggestedAction: 'Send check-in',
    icon: UserX,
  },
];

export function PredictiveAlerts() {
  const [alerts, setAlerts] = useState(initialAlerts);

  const dismissAlert = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-primary-500" />
        <h3 className="text-sm font-semibold text-secondary-500">Predictive Alerts</h3>
        <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-medium">
          {alerts.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {alerts.map((alert) => {
          const styles = severityStyles[alert.severity];
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className={`rounded-xl border ${styles.border} ${styles.bg} p-4 relative`}
            >
              <button
                onClick={() => dismissAlert(alert.id)}
                className="absolute top-2 right-2 p-1 rounded-lg hover:bg-white/60 transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>

              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <Icon className={`h-5 w-5 ${styles.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-secondary-500 mb-1">{alert.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{alert.message}</p>
                  <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
                    {alert.suggestedAction}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
