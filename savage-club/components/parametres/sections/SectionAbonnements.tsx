// components/parametres/sections/SectionAbonnements.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SectionTitle from "@/components/parametres/ui/SectionTitle";

type Sub = {
  id: string;
  tier: "FREE" | "SAVAGE" | "VIP";
  status: string;
  startedAt: string;
  renewsAt: string | null;
  creator?: {  // 👈 Rendre optionnel pour éviter les erreurs
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    category: string | null;
  };
};

const TIER_LABEL: Record<string, string> = {
  FREE: "Gratuit",
  SAVAGE: "Savage",
  VIP: "Savage VIP",
};

const TIER_COLOR: Record<string, string> = {
  FREE: "text-white/50 bg-white/5 border-white/10",
  SAVAGE: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  VIP: "text-amber-400 bg-gradient-to-r from-amber-400/20 to-purple-500/20 border-amber-400/30",
};

function timeUntil(date: string | null) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  if (diff < 0) return "Expiré";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `dans ${days} j`;
}

export default function SectionAbonnements() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/subscriptions")
      .then((r) => r.json())
      .then((data) => {
        // 🔧 Normalisation des données
        let subscriptions: Sub[] = [];
        
        if (Array.isArray(data)) {
          subscriptions = data.filter((sub: Sub) => sub.creator); // Garde seulement ceux avec creator
        } else if (data?.subscriptions && Array.isArray(data.subscriptions)) {
          subscriptions = data.subscriptions.filter((sub: Sub) => sub.creator);
        }
        
        setSubs(subscriptions);
      })
      .catch((err) => {
        console.error("Erreur chargement abonnements:", err);
        setSubs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(creatorId: string) {
    try {
      await fetch(`/api/subscriptions?creatorId=${creatorId}`, { method: "DELETE" });
      setSubs((prev) => prev.filter((s) => s.creator?.id !== creatorId));
    } catch (err) {
      console.error("Erreur annulation:", err);
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Mes abonnements</SectionTitle>
      <p className="text-white/40 text-sm">Vos abonnements actifs.</p>

      {loading && (
        <div className="flex justify-center py-10">
          <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      )}

      {!loading && subs.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-3">
          <span className="text-3xl">💳</span>
          <p className="text-white/30 text-sm">Aucun abonnement actif.</p>
        </div>
      )}

      <div className="space-y-3">
        {subs.map((sub) => (
          // 🔧 Garde supplémentaire : si creator manque, on skip
          !sub.creator ? null : (
            <div key={sub.id} className={`rounded-2xl border p-4 flex items-center gap-4 ${TIER_COLOR[sub.tier]}`}>
              {/* Avatar */}
              <Link href={`/profil/${sub.creator.username}`} className="flex-shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-purple-700">
                  {sub.creator.avatar
                    ? <img src={sub.creator.avatar} alt="" className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {sub.creator.username?.[0]?.toUpperCase() || "?"}
                      </div>
                  }
                </div>
              </Link>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <Link href={`/profil/${sub.creator.username}`} className="hover:text-white transition-colors">
                  <p className="text-white font-semibold text-sm truncate">
                    {sub.creator.displayName ?? sub.creator.username}
                  </p>
                </Link>
                <p className="text-white/30 text-xs">@{sub.creator.username}</p>
                {sub.creator.category && (
                  <p className="text-white/20 text-xs">{sub.creator.category}</p>
                )}
              </div>

              {/* Tier + renouvellement */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${TIER_COLOR[sub.tier]}`}>
                  {TIER_LABEL[sub.tier]}
                </span>
                {sub.renewsAt && sub.tier !== "FREE" && (
                  <span className="text-white/25 text-[10px]">
                    Renouvelle {timeUntil(sub.renewsAt)}
                  </span>
                )}
                {sub.tier !== "FREE" && (
                  <button
                    onClick={() => handleCancel(sub.creator!.id)}
                    className="text-red-400/40 hover:text-red-400 text-[10px] transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}