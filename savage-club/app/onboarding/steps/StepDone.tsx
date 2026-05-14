// app/onboarding/steps/StepDone.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Props = { role: string };

const MAX_STEP: Record<string, number> = {
  USER:    2,
  CREATOR: 5,
  TRAINER: 5,
};

export default function StepDone({ role }: Props) {
  const router            = useRouter();
  const sessionResult     = useSession() as any;
  const session           = sessionResult?.data;
  const update            = sessionResult?.update;

  const [ready, setReady] = useState(false); // true une fois le step final écrit en DB

  // ── Marquer l'onboarding comme terminé dès le montage ─────────────────
  useEffect(() => {
    const maxStep = MAX_STEP[role] ?? 5;

    fetch("/api/onboarding/progress", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ step: maxStep }),
    })
      .then(() => {
        // Mettre à jour le token session pour que le middleware laisse passer
        if (typeof update === "function") {
          return update({ onboardingStep: maxStep });
        }
      })
      .finally(() => setReady(true));
  }, []); // eslint-disable-line

  const username = (session?.user as any)?.username ?? "";

  const CTA = {
    USER:    { label: "Découvrir les créateurs →", href: "/"                        },
    CREATOR: { label: "Voir mon profil →",         href: `/profil/${username}`      },
    TRAINER: { label: "Voir mon profil →",         href: `/profil/${username}`      },
  }[role] ?? { label: "Continuer →", href: "/" };

  function handleCTA() {
    if (!ready) return;
    // On force un hard navigation pour que le middleware relise le cookie de session
    window.location.href = CTA.href;
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center py-4">
      {/* Icône succès */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/30 to-purple-600/20 flex items-center justify-center border border-amber-400/30">
          <span className="text-5xl">
            {role === "USER" ? "🎉" : role === "TRAINER" ? "🎓" : "🚀"}
          </span>
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
      </div>

      <div>
        <p className="text-amber-400/80 text-xs font-bold uppercase tracking-widest mb-2">
          {role === "USER" ? "Bienvenue" : "Profil créé"}
        </p>
        <h2 className="text-2xl font-black text-white leading-tight">
          {role === "USER"
            ? "Ton feed t'attend !"
            : role === "TRAINER"
            ? "Ton espace est prêt !"
            : "Ton profil est en ligne !"}
        </h2>
        {username && role !== "USER" && (
          <p className="text-white/40 text-sm mt-1">@{username}</p>
        )}
      </div>

      {/* Checklist créateur/formateur */}
      {role !== "USER" && (
        <div className="w-full bg-white/5 border border-white/8 rounded-2xl p-5 text-left flex flex-col gap-3">
          {[
            "Profil public créé",
            "Prix d'abonnement défini",
            role === "TRAINER" ? "Cours publiés" : "Premiers contenus publiés",
            "Paiement configurable depuis le tableau de bord",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2.5L8 3" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-white/70 text-sm">{item}</span>
            </div>
          ))}
        </div>
      )}

      {role !== "USER" && (
        <div className="w-full bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 text-left">
          <p className="text-violet-300/80 text-xs leading-relaxed">
            💡 <strong>Conseil :</strong> partage le lien de ton profil sur tes réseaux sociaux pour attirer tes premiers abonnés rapidement.
          </p>
        </div>
      )}

      <button
        onClick={handleCTA}
        disabled={!ready}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-wait text-black font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-amber-400/20"
      >
        {ready ? CTA.label : (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Finalisation…
          </span>
        )}
      </button>
    </div>
  );
}