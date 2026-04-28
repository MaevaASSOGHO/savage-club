// components/payments/PaymentMethodSelector.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PaymentProvider = "moneyfusion" | "stripe";

type Props = {
  amount: number;
  label?: string;
  onClose: () => void;
  onSuccess?: () => void; // Ajout : callback en cas de succès
  mfPayload: {
    type:        string;
    recipientId: string;
    description?: string;
    tier?:       string;
    route:       "subscription" | "booking" | "unlock";
    extra?:      Record<string, any>;
  };
  stripePayload: {
    type:        string;
    recipientId: string;
    description?: string;
    currency?:   string;
  };
};

const PROVIDERS = [
  {
    id:       "moneyfusion" as PaymentProvider,
    name:     "Mobile Money",
    subtitle: "Orange, MTN, Wave, Moov...",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="2" width="14" height="20" rx="2"/>
        <line x1="12" y1="18" x2="12" y2="18.01"/>
      </svg>
    ),
    badge:    "Afrique",
    color:    "text-amber-400",
    bg:       "bg-amber-400/10 border-amber-400/30",
    bgActive: "bg-amber-400/15 border-amber-400/60",
  },
  {
    id:       "stripe" as PaymentProvider,
    name:     "Carte bancaire",
    subtitle: "Visa, Mastercard, Apple Pay...",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="1" y="4" width="22" height="16" rx="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    badge:    "International",
    color:    "text-blue-400",
    bg:       "bg-blue-400/10 border-blue-400/30",
    bgActive: "bg-blue-400/15 border-blue-400/60",
  },
];

export default function PaymentMethodSelector({
  amount, label, onClose, onSuccess, mfPayload, stripePayload,
}: Props) {
  const router  = useRouter();
  const [selected, setSelected] = useState<PaymentProvider>("moneyfusion");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Validation early return
  if (amount <= 0) {
    console.error("PaymentMethodSelector: amount must be > 0");
    onClose();
    return null;
  }

  async function handlePay() {
    setLoading(true);
    setError(null);

    try {
      if (selected === "moneyfusion") {
        await handleMoneyFusion();
      } else {
        await handleStripe();
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMoneyFusion() {
    if (!mfPayload.route) {
      setError("Configuration de paiement invalide");
      return;
    }

    const res = await fetch("/api/payments/moneyfusion/create", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        amount,
        type:        mfPayload.type,
        recipientId: mfPayload.recipientId,
        description: mfPayload.description,
        tier:        mfPayload.tier,
        ...mfPayload.extra,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur paiement");
      return;
    }

    if (data.redirectUrl) {
      // Appeler onSuccess avant la redirection
      onSuccess?.();
      window.location.href = data.redirectUrl;
    } else {
      setError("Paiement non disponible. Réessayez plus tard.");
    }
  }

  async function handleStripe() {
    const res = await fetch("/api/payments/stripe/create", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        amount,
        currency:    stripePayload.currency ?? "xof",
        type:        stripePayload.type,
        recipientId: stripePayload.recipientId,
        description: stripePayload.description,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur paiement");
      return;
    }

    // Appeler onSuccess avant la redirection
    onSuccess?.();

    // Rediriger vers la page de paiement Stripe
    const params = new URLSearchParams({
      clientSecret: data.clientSecret,
      amount:       amount.toString(),
      description:  stripePayload.description ?? "Paiement Savage Club",
    });
    router.push(`/payments/stripe?${params.toString()}`);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose}/>

      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto w-full md:max-w-sm bg-[#1E0A3C] md:rounded-2xl rounded-t-2xl border border-white/10 shadow-2xl overflow-hidden">

          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 bg-white/20 rounded-full"/>
          </div>

          {/* Header */}
          <div className="px-6 pt-4 pb-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <p className="text-white font-bold">Choisir le paiement</p>
              <p className="text-white/40 text-sm mt-0.5">
                {label ?? `${amount.toLocaleString("fr-FR")} FCFA`}
              </p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Providers */}
          <div className="px-6 py-4 space-y-3">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  selected === p.id ? p.bgActive : `${p.bg} opacity-60 hover:opacity-80`
                }`}
              >
                <div className={`${p.color} flex-shrink-0`}>{p.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{p.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      p.id === "moneyfusion"
                        ? "bg-amber-400/20 text-amber-400"
                        : "bg-blue-400/20 text-blue-400"
                    }`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{p.subtitle}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  selected === p.id
                    ? p.id === "moneyfusion" ? "border-amber-400 bg-amber-400" : "border-blue-400 bg-blue-400"
                    : "border-white/20"
                }`}>
                  {selected === p.id && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            ))}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 border-t border-white/8">
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {selected === "moneyfusion" ? "Redirection..." : "Chargement..."}
                </>
              ) : `Payer ${amount.toLocaleString("fr-FR")} FCFA`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}