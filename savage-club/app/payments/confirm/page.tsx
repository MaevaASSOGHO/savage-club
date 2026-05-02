// app/payments/confirm/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter }    from "next/navigation";

function ConfirmInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending">("loading");
  
  // type = "message" | "booking" | "subscription" | null
  const type     = searchParams.get("type");
  // returnTo = URL vers laquelle revenir (profil du créateur par ex.)
  // PAS de valeur par défaut — null si absent
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    // Cas Stripe — redirect_status est dans l'URL
    const redirectStatus = searchParams.get("redirect_status");
    if (redirectStatus === "succeeded") { setStatus("success"); return; }
    if (redirectStatus === "failed")    { setStatus("failed");  return; }

    // Cas MoneyFusion — token dans l'URL
    if (!token) { setStatus("failed"); return; }

    async function check() {
      try {
        const res  = await fetch(`/api/payments/moneyfusion/status?token=${token}`);
        const data = await res.json();
        const s    = data.statut;
        if (s === "paid")                        setStatus("success");
        else if (s === "failure" || s === "no paid") setStatus("failed");
        else                                     setStatus("pending");
      } catch {
        setStatus("failed");
      }
    }

    check();
  }, [token]);

  // Destination selon le type de paiement
  function getDestination(): string {
    if (type === "message")  return "/messages";
    if (type === "booking")  return "/parametres?section=reservations";
    if (returnTo)            return returnTo;
    return "/";
  }

  function getButtonLabel(): string {
    if (type === "message") return "Retour aux messages";
    if (type === "booking") return "Voir mes réservations";
    if (returnTo)           return "Retour ";
    return "Retour à l'accueil";
  }

  return (
    <div className="min-h-screen bg-[#1a0533] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">

        {status === "loading" && (
          <>
            <svg className="animate-spin w-12 h-12 text-amber-400 mx-auto" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-white/60">Vérification du paiement...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <span className="text-4xl">✅</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">Paiement réussi !</p>
              <p className="text-white/40 text-sm mt-2">Votre paiement a été confirmé.</p>
            </div>
            <button
              onClick={() => router.push(getDestination())}
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl transition-all">
              {getButtonLabel()}
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-4xl">❌</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">Paiement échoué</p>
              <p className="text-white/40 text-sm mt-2">Le paiement n'a pas pu être effectué.</p>
            </div>
            <button onClick={() => router.back()}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all">
              Réessayer
            </button>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-400/20 flex items-center justify-center mx-auto">
              <span className="text-4xl">⏳</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">Paiement en cours</p>
              <p className="text-white/40 text-sm mt-2">Validez le paiement sur votre téléphone.</p>
            </div>
            <button onClick={() => router.push(getDestination())}
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl transition-all">
              {getButtonLabel()}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentConfirmPage() {
  return (
    <Suspense>
      <ConfirmInner />
    </Suspense>
  );
}
