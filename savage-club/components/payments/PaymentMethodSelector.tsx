// components/payments/PaymentMethodSelector.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PaymentProvider = "moneyfusion" | "stripe";

type Props = {
  amount: number;
  label?: string;
  onClose: () => void;
  mfPayload: {
    type:         string;
    recipientId:  string;
    description?: string;
    tier?:        string;
    returnTo?:    string;
    route:        "subscription" | "booking" | "unlock";
    extra?:       Record<string, any>;
  };
  stripePayload: {
    type:            string;
    recipientId:     string;
    description?:    string;
    tier?:           string;
    returnTo?:       string;
    bookingData?:    Record<string, any>;
    messageId?:      string;
    conversationId?: string;
    postId?:         string;
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
    bgActive: "bg-amber-400/15 border-amber-400/60",
    bgIdle:   "bg-amber-400/5 border-amber-400/20 opacity-70 hover:opacity-90",
    check:    "border-amber-400 bg-amber-400",
    dot:      "text-amber-400",
    badgeCls: "bg-amber-400/20 text-amber-400",
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
    bgActive: "bg-blue-400/15 border-blue-400/60",
    bgIdle:   "bg-blue-400/5 border-blue-400/20 opacity-70 hover:opacity-90",
    check:    "border-blue-400 bg-blue-400",
    dot:      "text-blue-400",
    badgeCls: "bg-blue-400/20 text-blue-400",
  },
];

const FCFA_TO_EUR = 0.00152;

export default function PaymentMethodSelector({
  amount, label, onClose, mfPayload, stripePayload,
}: Props) {
  const router     = useRouter();
  const [selected, setSelected] = useState<PaymentProvider>("moneyfusion");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const amountEur = (amount * FCFA_TO_EUR).toFixed(2);

  async function handlePay() {
    setLoading(true);
    setError(null);
    selected === "moneyfusion" ? await handleMoneyFusion() : await handleStripe();
    setLoading(false);
  }

  async function handleMoneyFusion() {
    const res  = await fetch("/api/payments/moneyfusion/create", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        amount,
        type:        mfPayload.type,
        recipientId: mfPayload.recipientId,
        description: mfPayload.description,
        tier:        mfPayload.tier,
        returnTo:    mfPayload.returnTo,
        ...mfPayload.extra,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erreur paiement"); return; }
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    } else {
      setError("Mobile Money non disponible. Réessayez plus tard.");
    }
  }

  async function handleStripe() {
    const res  = await fetch("/api/payments/stripe/create", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        amount,
        type:           stripePayload.type,
        recipientId:    stripePayload.recipientId,
        description:    stripePayload.description,
        tier:           stripePayload.tier,
        bookingData:    stripePayload.bookingData,
        messageId:      stripePayload.messageId,
        conversationId: stripePayload.conversationId,
        postId:         stripePayload.postId,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erreur paiement"); return; }

    // Passer le vrai type (message/booking/subscription) et returnTo à la page Stripe
    // pour que le return_url soit correct
    const params = new URLSearchParams({
      clientSecret: data.clientSecret,
      amount:       amount.toString(),
      amountEur:    data.amountEur ?? amountEur,
      description:  stripePayload.description ?? "Paiement Savage Club",
      type:         stripePayload.type,  // ← vrai type, pas "stripe"
    });
    if (stripePayload.returnTo) params.set("returnTo", stripePayload.returnTo);

    router.push(`/payments/stripe?${params.toString()}`);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" onClick={onClose}/>

      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-[60] pointer-events-none">
        <div className="pointer-events-auto w-full md:max-w-sm bg-[#1E0A3C] md:rounded-2xl rounded-t-2xl border border-white/10 shadow-2xl overflow-hidden">

          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 bg-white/20 rounded-full"/>
          </div>

          <div className="px-6 pt-4 pb-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <p className="text-white font-bold">Méthode de paiement</p>
              <p className="text-white/40 text-sm mt-0.5">
                {label ?? `${Math.round(amount * 1.03).toLocaleString("fr-FR")} FCFA débités (frais 3% inclus)`}
              </p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 space-y-3">
            {PROVIDERS.map((p) => (
              <button key={p.id} onClick={() => setSelected(p.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  selected === p.id ? p.bgActive : p.bgIdle
                }`}>
                <div className={`${p.dot} flex-shrink-0`}>{p.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold text-sm">{p.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.badgeCls}`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{p.subtitle}</p>
                  <p className={`text-xs font-semibold mt-1 ${p.dot}`}>
                    {p.id === "moneyfusion"
                      ? `${Math.round(amount * 1.03).toLocaleString("fr-FR")} FCFA débités (frais 3% inclus)`
                      : `≈ ${amountEur} EUR`
                    }
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  selected === p.id ? p.check : "border-white/20"
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

          <div className="px-6 pb-6 pt-2 border-t border-white/8">
            <button onClick={handlePay} disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {selected === "moneyfusion" ? "Redirection..." : "Chargement..."}
                </>
              ) : selected === "moneyfusion"
                ? `Payer ${amount.toLocaleString("fr-FR")} FCFA`
                : `Payer ≈ ${amountEur} EUR`
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
