import { useState, useMemo } from 'react';
import {
  Wrench,
  Bell,
  LayoutDashboard,
  Clock,
  Calendar,
  User,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockEmployees } from '../../data/mockEmployees';
import { mockTimeEntries } from '../../data/mockTimeEntries';
import { getCurrentShiftEntry, getEntriesForEmployee } from '../../data/generators';
import SimpleMode from './SimpleMode';
import AdvancedMode from './AdvancedMode';

export default function TimeClock() {
  const {
    currentEmployeeId,
    timeClockMode,
    setTimeClockMode,
    addToast,
    setCurrentView,
  } = useAppStore();

  const [isClockedIn, setIsClockedIn] = useState(() => {
    const entry = getCurrentShiftEntry(mockTimeEntries, currentEmployeeId);
    return entry !== null;
  });
  const [notes, setNotes] = useState('');

  const employee = useMemo(
    () => mockEmployees.find((e) => e.id === currentEmployeeId) ?? mockEmployees[0],
    [currentEmployeeId],
  );

  const entries = useMemo(
    () => getEntriesForEmployee(mockTimeEntries, currentEmployeeId),
    [currentEmployeeId],
  );

  const currentEntry = useMemo(() => {
    if (!isClockedIn) return null;
    return getCurrentShiftEntry(mockTimeEntries, currentEmployeeId);
  }, [isClockedIn, currentEmployeeId]);

  const handleClockIn = () => {
    setIsClockedIn(true);
    addToast(`Clocked in at ${new Date().toLocaleTimeString()}`, 'success');
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    addToast(`Clocked out at ${new Date().toLocaleTimeString()}`, 'success');
  };

  const handleToggleMode = () => {
    setTimeClockMode(timeClockMode === 'simple' ? 'advanced' : 'simple');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' as const },
    { icon: Clock, label: 'Time', id: 'timeclock' as const },
    { icon: Calendar, label: 'Schedule', id: null },
    { icon: User, label: 'Profile', id: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <Wrench className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-secondary-500">ServiceCore</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {timeClockMode === 'simple' ? 'Simple' : 'Advanced'}
            </span>
            <button
              onClick={handleToggleMode}
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

          {/* Notification Bell */}
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
        {timeClockMode === 'simple' ? (
          <SimpleMode
            employee={employee}
            currentEntry={currentEntry}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            notes={notes}
            onNotesChange={setNotes}
          />
        ) : (
          <AdvancedMode
            employee={employee}
            currentEntry={currentEntry}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            notes={notes}
            onNotesChange={setNotes}
            entries={entries}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = item.id === 'timeclock';
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.id === 'dashboard') {
                    setCurrentView('dashboard');
                  }
                }}
                className={`flex flex-col items-center py-2 px-3 min-w-[64px] ${
                  isActive ? 'text-primary-500' : 'text-gray-400'
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
