// Lightweight built-in analytics — no external dependencies
// Logs events in dev console, stores in memory for potential export

const IS_DEV = import.meta.env.DEV;

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

const eventLog: AnalyticsEvent[] = [];

export function initPostHog() {
  if (typeof window !== 'undefined') {
    trackEvent('page_view', { path: window.location.pathname });
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  const entry: AnalyticsEvent = {
    event,
    properties,
    timestamp: new Date().toISOString(),
    path: typeof window !== 'undefined' ? window.location.pathname : '',
  };

  eventLog.push(entry);

  if (IS_DEV) {
    console.log(`[analytics] ${event}`, properties || '');
  }
}

export function getEventLog(): AnalyticsEvent[] {
  return [...eventLog];
}
