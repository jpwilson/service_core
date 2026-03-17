import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    const store = useAppStore.getState();
    store.setCurrentView('timeclock');
    store.setTimeClockMode('simple');
    store.setDashboardTab('overview');
    store.setSelectedEmployeeId(null);
    store.updateSettings({ payPeriodType: 'bi-weekly' });
  });

  it('has correct initial state', () => {
    const state = useAppStore.getState();
    expect(state.currentView).toBe('timeclock');
    expect(state.timeClockMode).toBe('simple');
    expect(state.dashboardTab).toBe('overview');
    expect(state.selectedEmployeeId).toBeNull();
  });

  it('switches views', () => {
    useAppStore.getState().setCurrentView('dashboard');
    expect(useAppStore.getState().currentView).toBe('dashboard');
  });

  it('switches time clock mode', () => {
    useAppStore.getState().setTimeClockMode('advanced');
    expect(useAppStore.getState().timeClockMode).toBe('advanced');
  });

  it('sets dashboard tab', () => {
    useAppStore.getState().setDashboardTab('hours');
    expect(useAppStore.getState().dashboardTab).toBe('hours');
  });

  it('sets selected employee', () => {
    useAppStore.getState().setSelectedEmployeeId('emp-1');
    expect(useAppStore.getState().selectedEmployeeId).toBe('emp-1');
  });

  it('updates settings', () => {
    useAppStore.getState().updateSettings({
      payPeriodType: 'weekly',
    });
    expect(useAppStore.getState().settings.payPeriodType).toBe('weekly');
  });

  it('manages toasts', () => {
    useAppStore.getState().addToast('Test message', 'success');
    const toasts = useAppStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('success');

    useAppStore.getState().removeToast(toasts[0].id);
    expect(useAppStore.getState().toasts.length).toBe(0);
  });

  it('has default settings', () => {
    const settings = useAppStore.getState().settings;
    expect(settings.payPeriodType).toBe('bi-weekly');
    expect(settings.overtimeRules.dailyThreshold).toBe(8);
    expect(settings.overtimeRules.weeklyThreshold).toBe(40);
    expect(settings.overtimeRules.overtimeMultiplier).toBe(1.5);
    expect(settings.breakRules.autoDeductMinutes).toBe(30);
  });

  it('sets date range', () => {
    const newRange = {
      start: new Date(2023, 0, 1),
      end: new Date(2023, 0, 31),
    };
    useAppStore.getState().setDateRange(newRange);
    const { dateRange } = useAppStore.getState();
    expect(dateRange.start.getTime()).toBe(newRange.start.getTime());
    expect(dateRange.end.getTime()).toBe(newRange.end.getTime());
  });
});
