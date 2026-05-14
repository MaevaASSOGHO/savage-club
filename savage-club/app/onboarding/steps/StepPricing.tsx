// app/onboarding/steps/StepPricing.tsx
"use client";

import { useState } from "react";

const SUGGESTIONS = [1000, 2000, 3000, 5000, 10000];

type Props = { onNext: () => void };

export default function StepPricing({ onNext }: Props) {
  const [price,   setPrice]   = useState<number>(2000);
  const [custom,  setCustom]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const net = Math.round(price * 0.85);

  async function handleSave() {
    if (price < 500) { setError("Le prix minimum est 500 FCFA."); return; }
    setSaving(true);
    try {
      await fetch("/api/onboarding/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionPrice: price }),
      });
      onNext();
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  function handleCustom(val: string) {
    setCustom(val);
    const n = parseInt(val.replace(/\D/g, ""));
    if (!isNaN(n)) setPrice(n);
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div>
        <h2 className="text-2xl font-bold text-white leading-tight">
          Fixe ton<br />
          <span className="text-amber-400">prix d'abonnement</span>
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Tu pourras le modifier à tout moment depuis ton profil.
        </p>
      </div>

      {/* Prix sélectionné + net */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
        <p className="text-white/40 text-xs mb-1">Prix mensuel</p>
        <p className="text-3xl font-black text-white">{price.toLocaleString("fr-FR")} <span className="text-lg font-normal text-white/50">FCFA</span></p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-white/30 text-xs">Tu reçois :</span>
          <span className="text-emerald-400 font-bold text-sm">{net.toLocaleString("fr-FR")} FCFA / abonné / mois</span>
        </div>
        <p className="text-white/20 text-xs mt-1">Savage Club garde 15%</p>
      </div>

      {/* Suggestions rapides */}
      <div>
        <p className="text-white/40 text-xs mb-3">Suggestions populaires</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setPrice(s); setCustom(""); }}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                price === s && !custom
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white"
              }`}
            >
              {s.toLocaleString("fr-FR")} FCFA
            </button>
          ))}
        </div>
      </div>

      {/* Montant personnalisé */}
      <div>
        <label className="text-white/40 text-xs mb-1.5 block">Ou entre un montant personnalisé</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={e => handleCustom(e.target.value)}
            placeholder="ex : 7500"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-16 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">FCFA</span>
        </div>
      </div>

      {/* Info paiement */}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 flex gap-3">
        <span className="text-lg flex-shrink-0">💳</span>
        <p className="text-white/60 text-xs leading-relaxed">
          Tu seras payé chaque <strong className="text-white/80">lundi</strong> par Mobile Money ou virement, 
          dès <strong className="text-white/80">5 000 FCFA</strong> cumulés. 
          Tu configureras ton mode de paiement depuis ton tableau de bord.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || price < 500}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-amber-400/20"
      >
        {saving ? "Enregistrement…" : "Confirmer mon tarif →"}
      </button>
    </div>
  );
}
