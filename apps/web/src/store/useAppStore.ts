import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subDays } from 'date-fns';
import type { DateRange, AppSettings, TimesheetStatus, TimeEntry, BreakType } from '@servicecore/shared';

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
  dashboardTab: 'overview' | 'hours' | 'attendance' | 'labor-cost' | 'projects' | 'employees' | 'import' | 'approvals' | 'settings' | 'routes' | 'scheduling' | 'customers' | 'equipment' | 'invoices' | 'quickbooks' | 'audit' | 'timeclock';
  dateRange: DateRange;
  settings: AppSettings;
  timesheetApprovals: Map<string, TimesheetStatus>;
  toasts: Toast[];
  isClockedIn: boolean;
  clockInTime: string | null;
  clockInProject: string | null;
  showGuidedTour: boolean;

  // Demo mode
  demoMode: boolean;
  demoSpeedMultiplier: number;

  // Break tracking (in store, not local state)
  isOnBreak: boolean;
  breakStart: string | null;
  breakType: BreakType;
  totalBreakSeconds: number;

  // Session entries
  sessionEntries: TimeEntry[];

  // Notes/mileage for clock out
  clockOutNotes: string;
  clockOutMileage: number;

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
  setDemoMode: (on: boolean) => void;
  startBreak: (type: BreakType) => void;
  endBreak: () => void;
  setClockOutNotes: (notes: string) => void;
  setClockOutMileage: (miles: number) => void;
  addSessionEntries: (entries: TimeEntry[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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

      // Demo mode
      demoMode: false,
      demoSpeedMultiplier: 1200,

      // Break tracking
      isOnBreak: false,
      breakStart: null,
      breakType: 'lunch',
      totalBreakSeconds: 0,

      // Session entries
      sessionEntries: [],

      // Notes/mileage
      clockOutNotes: '',
      clockOutMileage: 0,

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

      clockOut: () => {
        const state = get();
        if (!state.clockInTime) return;

        // If on break, end it first
        let finalBreakSeconds = state.totalBreakSeconds;
        if (state.isOnBreak && state.breakStart) {
          finalBreakSeconds += Math.floor(
            (Date.now() - new Date(state.breakStart).getTime()) / 1000
          );
        }

        const entry: TimeEntry = {
          id: `te-session-${Date.now()}`,
          employeeId: state.currentEmployeeId,
          projectId: state.clockInProject || 'proj-001',
          clockIn: state.clockInTime,
          clockOut: new Date().toISOString(),
          breaks: finalBreakSeconds > 0
            ? [
                {
                  id: `brk-${Date.now()}`,
                  type: state.breakType || 'lunch',
                  startTime: state.clockInTime, // simplified
                  endTime: new Date().toISOString(),
                },
              ]
            : [],
          status: 'pending',
          notes: state.clockOutNotes || '',
          location: 'Denver Central Logistics Hub',
          mileage: state.clockOutMileage || null,
          flags: [],
          isManualEdit: false,
        };

        set({
          isClockedIn: false,
          clockInTime: null,
          clockInProject: null,
          isOnBreak: false,
          breakStart: null,
          totalBreakSeconds: 0,
          clockOutNotes: '',
          clockOutMileage: 0,
          sessionEntries: [...state.sessionEntries, entry],
        });
      },

      setShowGuidedTour: (show) => set({ showGuidedTour: show }),

      setDemoMode: (on) => set({ demoMode: on }),

      startBreak: (type) =>
        set({
          isOnBreak: true,
          breakStart: new Date().toISOString(),
          breakType: type,
        }),

      endBreak: () => {
        const state = get();
        if (!state.breakStart) {
          set({ isOnBreak: false, breakStart: null });
          return;
        }
        const elapsed = Math.floor(
          (Date.now() - new Date(state.breakStart).getTime()) / 1000
        );
        set({
          isOnBreak: false,
          breakStart: null,
          totalBreakSeconds: state.totalBreakSeconds + elapsed,
        });
      },

      setClockOutNotes: (notes) => set({ clockOutNotes: notes }),
      setClockOutMileage: (miles) => set({ clockOutMileage: miles }),
      addSessionEntries: (entries) =>
        set((state) => ({
          sessionEntries: [...state.sessionEntries, ...entries],
        })),
    }),
    {
      name: 'servicecore-store',
      partialize: (state) => ({
        isClockedIn: state.isClockedIn,
        clockInTime: state.clockInTime,
        clockInProject: state.clockInProject,
        isOnBreak: state.isOnBreak,
        breakStart: state.breakStart,
        totalBreakSeconds: state.totalBreakSeconds,
        sessionEntries: state.sessionEntries,
        timesheetApprovals: state.timesheetApprovals,
        demoMode: state.demoMode,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          if (parsed?.state?.timesheetApprovals) {
            parsed.state.timesheetApprovals = new Map(
              parsed.state.timesheetApprovals
            );
          }
          return parsed;
        },
        setItem: (name, value) => {
          const toStore = JSON.parse(JSON.stringify(value, (_key, val) => {
            if (val instanceof Map) {
              return Array.from(val.entries());
            }
            return val;
          }));
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
