import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', /^https:\/\/servicecore.*\.vercel\.app/],
  });
}
