// lib/sentry.ts
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export function captureApiError(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
  console.error(error);
  return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
}