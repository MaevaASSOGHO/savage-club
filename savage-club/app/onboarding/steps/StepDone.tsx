// app/onboarding/steps/StepDone.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Props = { role: string };

const MESSAGES = {
  USER:    { title: "Ton feed t'attend !",     cta: "Découvrir les créateurs →", href: "/"         },
  CREATOR: { title: "Ton profil est en ligne !", cta: "Voir mon profil →",        href: "/profil"   },
  TRAINER: { title: "Ton espace est prêt !",   cta: "Voir mon profil →",        href: "/profil"   },
};

export default function StepDone({ role }: Props) {
  const router         = useRouter();
  const { data: session } = useSession();
  const [dots, setDots]   = useState(0);

  const msg = MESSAGES[role as keyof typeof MESSAGES] ?? MESSAGES.USER;

  // Animation de confettis légers via CSS keyframes inline
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);

  const username = (session?.user as any)?.username ?? "";

  return (
    <div className="flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-500 py-4">
      {/* Icône succès */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/30 to-purple-600/20 flex items-center justify-center border border-amber-400/30">
          <span className="text-5xl">
            {role === "USER" ? "🎉" : role === "TRAINER" ? "🎓" : "🚀"}
          </span>
        </div>
        {/* Halo animé */}
        <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
      </div>

      <div>
        <p className="text-amber-400/80 text-xs font-bold uppercase tracking-widest mb-2">
          {role === "USER" ? "Bienvenue" : "Profil créé"}
        </p>
        <h2 className="text-2xl font-black text-white leading-tight">
          {msg.title}
        </h2>
        {username && (
          <p className="text-white/40 text-sm mt-1">@{username}</p>
        )}
      </div>

      {/* Checklist récap pour créateur/formateur */}
      {role !== "USER" && (
        <div className="w-full bg-white/5 border border-white/8 rounded-2xl p-5 text-left flex flex-col gap-3">
          {[
            "Profil public créé",
            "Prix d'abonnement défini",
            role === "TRAINER" ? "Cours publiés" : "Premiers contenus publiés",
            "Paiement configuré au tableau de bord",
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
        onClick={() => router.push(username && role !== "USER" ? `/profil/${username}` : msg.href)}
        className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-amber-400/20"
      >
        {msg.cta}
      </button>
    </div>
  );
}
