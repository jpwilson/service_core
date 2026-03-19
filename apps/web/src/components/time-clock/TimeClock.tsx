import { useMemo } from 'react';
import {
  Wrench,
  Bell,
  LayoutDashboard,
  Clock,
  Calendar,
  User,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockEmployees, mockTimeEntries, getEntriesForEmployee } from '@servicecore/shared';
import SimpleMode from './SimpleMode';
import AdvancedMode from './AdvancedMode';
import { ScheduleView } from './ScheduleView';
import { ProfileView } from './ProfileView';

export default function TimeClock() {
  const {
    currentEmployeeId,
    timeClockMode,
    setTimeClockMode,
    timeClockTab,
    setTimeClockTab,
    setCurrentView,
  } = useAppStore();

  const employee = useMemo(
    () => mockEmployees.find((e) => e.id === currentEmployeeId) ?? mockEmployees[0],
    [currentEmployeeId],
  );

  const entries = useMemo(
    () => getEntriesForEmployee(mockTimeEntries, currentEmployeeId),
    [currentEmployeeId],
  );

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' as const },
    { icon: Clock, label: 'Time', id: 'time' as const },
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" style={{ transform: 'rotate(-90deg)' }} />
          </div>
          <span className="text-lg font-bold text-secondary-500">
            Serv<Wrench className="inline w-4 h-4 text-primary-500" style={{ transform: 'rotate(-90deg)' }} />ceCore
          </span>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe z-10">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              item.id === 'dashboard' ? false :
              item.id === timeClockTab;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.id === 'dashboard') {
                    setCurrentView('dashboard');
                  } else {
                    setTimeClockTab(item.id);
                  }
                }}
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
