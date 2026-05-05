// app/not-found.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router  = useRouter();
  const [count, setCount] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(interval); router.push("/"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1a0533] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Fond décoratif */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"/>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl"/>
      </div>

      <div className="relative text-center space-y-8 max-w-md">

        {/* 404 */}
        <div className="relative">
          <p className="text-[120px] font-black text-white/5 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                  <line x1="11" y1="8" x2="11" y2="11"/>
                  <line x1="11" y1="14" x2="11.01" y2="14"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-white font-black text-2xl">Page introuvable</h1>
          <p className="text-white/40 text-sm leading-relaxed">
            Cette page n'existe pas ou a été supprimée. Tu seras redirigé automatiquement dans{" "}
            <span className="text-amber-400 font-bold">{count}s</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/")}
            className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-6 py-3 rounded-xl transition-all text-sm"
          >
            Retour à l'accueil
          </button>
          <button
            onClick={() => router.back()}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-medium px-6 py-3 rounded-xl transition-all text-sm"
          >
            Page précédente
          </button>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-amber-400/60 rounded-full transition-all duration-1000"
            style={{ width: `${(count / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}