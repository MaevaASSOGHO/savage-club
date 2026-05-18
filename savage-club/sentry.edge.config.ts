import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d300460e49eb7f27b0d8c59d100ee074@o4511411807977472.ingest.de.sentry.io/4511411809878096",
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  enableLogs: true,
  sendDefaultPii: false, // ← évite d'envoyer emails/IPs par défaut
});