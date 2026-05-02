// app/payments/stripe/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter }     from "next/navigation";
import { loadStripe }                     from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Formulaire de paiement ─────────────────────────────────────────────────
function CheckoutForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const router   = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payments/confirm?type=stripe`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Erreur de paiement");
      setLoading(false);
    }
    // Si succès, Stripe redirige automatiquement vers return_url
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }}/>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Traitement...
          </>
        ) : `Payer ${amount.toLocaleString("fr-FR")} FCFA`}
      </button>
    </form>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
function StripePageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const clientSecret = searchParams.get("clientSecret");
  const amount       = parseInt(searchParams.get("amount") ?? "0");
  const description  = searchParams.get("description") ?? "Paiement Savage Club";

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a0533]">
        <p className="text-white/40">Paiement introuvable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a0533] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-white font-black text-xl">Savage Club</h1>
          <p className="text-white/40 text-sm mt-1">{description}</p>
          <p className="text-amber-400 font-bold text-2xl mt-2">
            {amount.toLocaleString("fr-FR")} FCFA
          </p>
        </div>

        {/* Formulaire Stripe */}
        <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl p-6">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  colorPrimary:    "#F59E0B",
                  colorBackground: "#1E0A3C",
                  colorText:       "#ffffff",
                  borderRadius:    "12px",
                },
              },
            }}
          >
            <CheckoutForm amount={amount} onSuccess={() => router.push("/")}/>
          </Elements>
        </div>

        <button onClick={() => router.back()} className="w-full text-white/30 hover:text-white text-sm transition-colors">
          ← Annuler
        </button>
      </div>
    </div>
  );
}

export default function StripePage() {
  return (
    <Suspense>
      <StripePageInner />
    </Suspense>
  );
}
