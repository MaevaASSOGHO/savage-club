"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-[#1a0533] flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="text-white font-bold text-lg">Une erreur est survenue</p>
          <p className="text-white/40 text-sm">Notre équipe a été notifiée automatiquement.</p>
          <button
            onClick={reset}
            className="bg-amber-400 text-black font-bold px-6 py-2 rounded-xl text-sm"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}