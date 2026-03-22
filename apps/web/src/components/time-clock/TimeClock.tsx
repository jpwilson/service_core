import { useMemo } from 'react';
import {
  Clock,
  Calendar,
  User,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockEmployees, mockTimeEntries, getEntriesForEmployee } from '@servicecore/shared';
import { useAuth } from '../../auth/AuthContext';
import SimpleMode from './SimpleMode';
import AdvancedMode from './AdvancedMode';
import { ScheduleView } from './ScheduleView';
import { ProfileView } from './ProfileView';

interface TimeClockProps {
  embedded?: boolean;
}

export default function TimeClock({ embedded = false }: TimeClockProps) {
  const {
    currentEmployeeId,
    timeClockMode,
    setTimeClockMode,
    timeClockTab,
    setTimeClockTab,
  } = useAppStore();

  const { user } = useAuth();

  // Use the logged-in user's employee ID if available
  const employeeId = user?.employeeId || currentEmployeeId;

  const employee = useMemo(
    () => mockEmployees.find((e) => e.id === employeeId) ?? mockEmployees[0],
    [employeeId],
  );

  const entries = useMemo(
    () => getEntriesForEmployee(mockTimeEntries, employeeId),
    [employeeId],
  );

  const tabs = [
    { icon: Clock, label: 'Clock In/Out', id: 'time' as const },
    { icon: Calendar, label: 'Schedule', id: 'schedule' as const },
    { icon: User, label: 'Profile', id: 'profile' as const },
  ];

  const renderContent = () => {
    switch (timeClockTab) {
      case 'schedule':
        return <ScheduleView employee={employee} entries={entries} />;
      case 'profile':
        return <ProfileView employee={employee} entries={entries} />;
      default:
        return timeClockMode === 'simple' ? (
          <SimpleMode employee={employee} />
        ) : (
          <AdvancedMode employee={employee} entries={entries} />
        );
    }
  };

  // Embedded mode: renders inside the dashboard layout (sidebar + header already present)
  if (embedded) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tab navigation + mode toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === timeClockTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTimeClockTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-secondary-500 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {timeClockTab === 'time' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {timeClockMode === 'simple' ? 'Simple' : 'Advanced'}
              </span>
              <button
                onClick={() => setTimeClockMode(timeClockMode === 'simple' ? 'advanced' : 'simple')}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  timeClockMode === 'advanced' ? 'bg-primary-500' : 'bg-gray-300'
                }`}
                aria-label="Toggle mode"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    timeClockMode === 'advanced' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    );
  }

  // Standalone mode (kept for backward compatibility / mobile)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe z-10">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {tabs.map((item) => {
            const isActive = item.id === timeClockTab;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => setTimeClockTab(item.id)}
                className={`flex flex-col items-center py-2 px-3 min-w-[64px] transition-colors ${
                  isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
