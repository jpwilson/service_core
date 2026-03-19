import { create } from 'zustand';
import { subDays } from 'date-fns';
import type { DateRange, AppSettings, TimesheetStatus } from '@servicecore/shared';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  currentView: 'timeclock' | 'dashboard';
  timeClockMode: 'simple' | 'advanced';
  timeClockTab: 'time' | 'schedule' | 'profile';
  currentEmployeeId: string;
  selectedEmployeeId: string | null;
  dashboardTab: 'overview' | 'hours' | 'attendance' | 'labor-cost' | 'projects' | 'employees' | 'import' | 'approvals' | 'settings' | 'routes';
  dateRange: DateRange;
  settings: AppSettings;
  timesheetApprovals: Map<string, TimesheetStatus>;
  toasts: Toast[];
  isClockedIn: boolean;
  clockInTime: string | null;
  clockInProject: string | null;
  showGuidedTour: boolean;

  setCurrentView: (view: 'timeclock' | 'dashboard') => void;
  setTimeClockMode: (mode: 'simple' | 'advanced') => void;
  setTimeClockTab: (tab: AppState['timeClockTab']) => void;
  setCurrentEmployeeId: (id: string) => void;
  setSelectedEmployeeId: (id: string | null) => void;
  setDashboardTab: (tab: AppState['dashboardTab']) => void;
  setDateRange: (range: DateRange) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  approveTimesheet: (entryId: string) => void;
  rejectTimesheet: (entryId: string) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  clockIn: (projectId?: string) => void;
  clockOut: () => void;
  setShowGuidedTour: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'timeclock',
  timeClockMode: 'simple',
  timeClockTab: 'time',
  currentEmployeeId: 'emp-001',
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
  isClockedIn: false,
  clockInTime: null,
  clockInProject: null,
  showGuidedTour: false,

  setCurrentView: (view) => set({ currentView: view }),
  setTimeClockMode: (mode) => set({ timeClockMode: mode }),
  setTimeClockTab: (tab) => set({ timeClockTab: tab }),
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

  clockIn: (projectId) =>
    set({
      isClockedIn: true,
      clockInTime: new Date().toISOString(),
      clockInProject: projectId || null,
    }),

  clockOut: () =>
    set({
      isClockedIn: false,
      clockInTime: null,
      clockInProject: null,
    }),

  setShowGuidedTour: (show) => set({ showGuidedTour: show }),
}));
