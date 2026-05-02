// app/payments/stripe/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe }                 from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({
  amountFcfa, amountEur, returnUrl,
}: {
  amountFcfa: number;
  amountEur: string;
  returnUrl: string;
}) {
  const stripe   = useStripe();
  const elements = useElements();
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
        // return_url inclut le vrai type et returnTo
        return_url: returnUrl,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Erreur de paiement");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-white/50">Montant</span>
          <span className="text-white font-bold">{amountFcfa.toLocaleString("fr-FR")} FCFA</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/30">Équivalent facturé</span>
          <span className="text-white/40">≈ {amountEur} EUR</span>
        </div>
      </div>

      <PaymentElement options={{ layout: "tabs" }}/>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button type="submit" disabled={!stripe || loading}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Traitement...
          </>
        ) : `Payer ${amountFcfa.toLocaleString("fr-FR")} FCFA`}
      </button>
    </form>
  );
}

function StripePageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const clientSecret = searchParams.get("clientSecret");
  const amountFcfa   = parseInt(searchParams.get("amount") ?? "0");
  const amountEur    = searchParams.get("amountEur") ?? (amountFcfa * 0.00152).toFixed(2);
  const description  = searchParams.get("description") ?? "Paiement Savage Club";
  // type et returnTo passés depuis PaymentMethodSelector
  const type         = searchParams.get("type") ?? "";
  const returnTo     = searchParams.get("returnTo") ?? "";

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a0533]">
        <p className="text-white/40">Paiement introuvable.</p>
      </div>
    );
  }

  // Construire la return_url avec le vrai type et returnTo
  const origin    = typeof window !== "undefined" ? window.location.origin : "https://savage-club.vercel.app";
  const params    = new URLSearchParams();
  if (type)     params.set("type",     type);
  if (returnTo) params.set("returnTo", returnTo);
  const returnUrl = `${origin}/payments/confirm?${params.toString()}`;

  return (
    <div className="min-h-screen bg-[#1a0533] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">

        <div className="text-center space-y-1">
          <h1 className="text-white font-black text-xl">Savage Club</h1>
          <p className="text-white/40 text-sm">{description}</p>
        </div>

        <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl p-6">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  colorPrimary:       "#F59E0B",
                  colorBackground:    "#1E0A3C",
                  colorText:          "#ffffff",
                  colorTextSecondary: "rgba(255,255,255,0.5)",
                  borderRadius:       "12px",
                  fontFamily:         "system-ui, sans-serif",
                },
              },
            }}
          >
            <CheckoutForm amountFcfa={amountFcfa} amountEur={amountEur} returnUrl={returnUrl}/>
          </Elements>
        </div>

        <button onClick={() => router.back()}
          className="w-full text-white/30 hover:text-white text-sm transition-colors py-2">
          ← Annuler et revenir
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
