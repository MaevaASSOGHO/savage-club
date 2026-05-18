import * as Sentry from "@sentry/nextjs";

// instrumentation-client.ts

Sentry.init({
  dsn: "https://d300460e49eb7f27b0d8c59d100ee074@o4511411807977472.ingest.de.sentry.io/4511411809878096",
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",

  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: 0.1,
  enableLogs: true,
  sendDefaultPii: false,

  // Replay : enregistre 5% des sessions normales
  // mais 100% des sessions avec erreur — le meilleur compromis
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Network request failed",
    "Load failed",
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;