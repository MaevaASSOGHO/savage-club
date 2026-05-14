// app/onboarding/steps/StepSimulator.tsx
"use client";

import { useState, useEffect, useRef } from "react";

// Taux de commission Savage Club (source : COMMISSION_RATES)
const COMMISSION = {
  SUBSCRIPTION:   0.15,  // créateur garde 85%
  PAID_CONTENT:   0.10,  // créateur garde 90%
};

type Props = { role: string; onNext: () => void };

function useAnimatedNumber(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<{ from: number; time: number } | null>(null);

  useEffect(() => {
    const from = display;
    startRef.current = { from, time: performance.now() };
    const tick = (now: number) => {
      if (!startRef.current) return;
      const elapsed  = now - startRef.current.time;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startRef.current.from + (target - startRef.current.from) * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]); // eslint-disable-line

  return display;
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export default function StepSimulator({ role, onNext }: Props) {
  const isTrainer = role === "TRAINER";

  const [subscribers,   setSubscribers]   = useState(100);
  const [subPrice,      setSubPrice]      = useState(2000);
  const [paidContents,  setPaidContents]  = useState(2);
  const [paidPrice,     setPaidPrice]     = useState(5000);
  const [showPaid,      setShowPaid]      = useState(false);

  const subRevenue    = Math.round(subscribers * subPrice * (1 - COMMISSION.SUBSCRIPTION));
  const paidRevenue   = showPaid
    ? Math.round(subscribers * 0.15 * paidContents * paidPrice * (1 - COMMISSION.PAID_CONTENT))
    : 0;
  const totalRevenue  = subRevenue + paidRevenue;

  const animatedTotal = useAnimatedNumber(totalRevenue);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div>
        <h2 className="text-2xl font-bold text-white leading-tight">
          Ton potentiel<br />
          <span className="text-amber-400">de revenus</span>
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Savage Club garde seulement <strong className="text-white/70">15%</strong> sur les abonnements.
          Tu encaisses le reste.
        </p>
      </div>

      {/* Carte de résultat */}
      <div className="bg-gradient-to-br from-amber-400/15 to-purple-600/10 border border-amber-400/20 rounded-2xl p-5 text-center">
        <p className="text-white/40 text-xs mb-1 uppercase tracking-widest">Revenus mensuels estimés</p>
        <p className="text-4xl font-black text-amber-400 tabular-nums leading-none">
          {fmt(animatedTotal)}
        </p>
        <p className="text-white/25 text-xs mt-2">
          Abonnements {fmt(subRevenue)}
          {showPaid && ` · Contenus ${fmt(paidRevenue)}`}
        </p>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-5">
        <SliderField
          label={isTrainer ? "Nombre d'élèves" : "Nombre d'abonnés"}
          value={subscribers}
          min={10} max={10000} step={10}
          onChange={setSubscribers}
          format={v => v.toLocaleString("fr-FR")}
        />
        <SliderField
          label={isTrainer ? "Prix de la formation / mois" : "Prix de l'abonnement"}
          value={subPrice}
          min={500} max={50000} step={500}
          onChange={setSubPrice}
          format={v => v.toLocaleString("fr-FR") + " FCFA"}
        />
      </div>

      {/* Toggle contenus payants */}
      <div>
        <button
          onClick={() => setShowPaid(v => !v)}
          className={`flex items-center gap-2 text-sm font-semibold transition-colors ${showPaid ? "text-amber-400" : "text-white/40 hover:text-white/70"}`}
        >
          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${showPaid ? "border-amber-400 bg-amber-400" : "border-white/20"}`}>
            {showPaid && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="black" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          </span>
          + Ajouter les revenus des contenus payants
        </button>

        {showPaid && (
          <div className="flex flex-col gap-4 mt-4 pl-2 border-l-2 border-amber-400/20">
            <SliderField
              label="Contenus payants par mois"
              value={paidContents}
              min={1} max={30} step={1}
              onChange={setPaidContents}
              format={v => `${v} contenus`}
            />
            <SliderField
              label="Prix moyen d'un contenu"
              value={paidPrice}
              min={1000} max={100000} step={1000}
              onChange={setPaidPrice}
              format={v => v.toLocaleString("fr-FR") + " FCFA"}
            />
            <p className="text-white/30 text-xs">
              Hypothèse : 15% de tes abonnés achètent un contenu payant par mois.<br/>
              Savage Club garde 10% sur les contenus payants.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onNext}
        className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-amber-400/20 mt-2"
      >
        Je veux gagner ça → Continuer
      </button>
    </div>
  );
}

function SliderField({
  label, value, min, max, step, onChange, format,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-white/60 text-xs font-medium">{label}</label>
        <span className="text-amber-400 text-xs font-bold tabular-nums">{format(value)}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-400 to-purple-500 transition-none"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ WebkitAppearance: "none" }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 shadow-lg shadow-amber-400/40 border-2 border-white/20 pointer-events-none transition-none"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}