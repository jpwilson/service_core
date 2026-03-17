import { create } from 'zustand';
import { subDays } from 'date-fns';
import type { DateRange, AppSettings, TimesheetStatus } from '../types';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  currentView: 'timeclock' | 'dashboard';
  timeClockMode: 'simple' | 'advanced';
  currentEmployeeId: string;
  selectedEmployeeId: string | null;
  dashboardTab: 'overview' | 'hours' | 'attendance' | 'labor-cost' | 'projects' | 'employees';
  dateRange: DateRange;
  settings: AppSettings;
  timesheetApprovals: Map<string, TimesheetStatus>;
  toasts: Toast[];

  setCurrentView: (view: 'timeclock' | 'dashboard') => void;
  setTimeClockMode: (mode: 'simple' | 'advanced') => void;
  setCurrentEmployeeId: (id: string) => void;
  setSelectedEmployeeId: (id: string | null) => void;
  setDashboardTab: (tab: AppState['dashboardTab']) => void;
  setDateRange: (range: DateRange) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  approveTimesheet: (entryId: string) => void;
  rejectTimesheet: (entryId: string) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'timeclock',
  timeClockMode: 'simple',
  currentEmployeeId: 'emp-1',
  selectedEmployeeId: null,
  dashboardTab: 'overview',
  dateRange: {
    start: subDays(new Date(), 30),
    end: new Date(),
  },
  settings: {
    payPeriodType: 'bi-weekly',
    overtimeRules: {
      dailyThreshold: 8,
      weeklyThreshold: 40,
      overtimeMultiplier: 1.5,
      doubleTimeMultiplier: 2,
    },
    breakRules: {
      autoDeductMinutes: 30,
      afterHoursThreshold: 6,
    },
    departments: ['Drivers', 'Service Crew', 'Office'],
    geofenceEnabled: true,
  },
  timesheetApprovals: new Map(),
  toasts: [],

  setCurrentView: (view) => set({ currentView: view }),
  setTimeClockMode: (mode) => set({ timeClockMode: mode }),
  setCurrentEmployeeId: (id) => set({ currentEmployeeId: id }),
  setSelectedEmployeeId: (id) => set({ selectedEmployeeId: id }),
  setDashboardTab: (tab) => set({ dashboardTab: tab }),
  setDateRange: (range) => set({ dateRange: range }),

  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  approveTimesheet: (entryId) =>
    set((state) => {
      const newMap = new Map(state.timesheetApprovals);
      newMap.set(entryId, 'approved');
      return { timesheetApprovals: newMap };
    }),

  rejectTimesheet: (entryId) =>
    set((state) => {
      const newMap = new Map(state.timesheetApprovals);
      newMap.set(entryId, 'rejected');
      return { timesheetApprovals: newMap };
    }),

  addToast: (message, type) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: crypto.randomUUID(), message, type },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
