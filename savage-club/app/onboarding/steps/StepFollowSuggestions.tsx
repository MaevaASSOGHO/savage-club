// app/onboarding/steps/StepFollowSuggestions.tsx
"use client";

import { useEffect, useState } from "react";
import SubscribeModal from "@/components/profile/SubscribeModal";

type SuggestedUser = {
  id:                string;
  username:          string;
  displayName:       string | null;
  avatar:            string | null;
  isVerified:        boolean;
  category:          string;
  followersCount:    number;
  subscriptionPrice: number | null;
  subscriptionVIP:   number | null;
};

type Props = { onNext: () => void };

export default function StepFollowSuggestions({ onNext }: Props) {
  const [users,    setUsers]    = useState<SuggestedUser[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [modalUser, setModalUser] = useState<SuggestedUser | null>(null);

  useEffect(() => {
    fetch("/api/onboarding/suggestions")
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSubscribeSuccess(userId: string) {
    setFollowed(prev => new Set(prev).add(userId));
    setModalUser(null);
  }

  async function handleFinish() {
    setSaving(true);
    await fetch("/api/onboarding/progress", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ step: 2 }),
    }).catch(() => {});
    onNext();
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div>
        <h2 className="text-2xl font-bold text-white leading-tight">
          Des créateurs<br />
          <span className="text-amber-400">faits pour toi</span>
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Suis ceux qui t'intéressent pour remplir ton feed.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map(user => {
            const isFollowed = followed.has(user.id);
            return (
              <div
                key={user.id}
                className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 py-3"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/10">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-700 flex items-center justify-center text-white text-sm font-bold">
                      {(user.displayName ?? user.username)[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold text-sm truncate">
                      {user.displayName ?? user.username}
                    </span>
                    {user.isVerified && (
                      <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-white/30 text-xs mt-0.5">
                    {user.category} · {user.followersCount.toLocaleString("fr-FR")} abonnés
                  </p>
                </div>

                <button
                  onClick={() => isFollowed ? null : setModalUser(user)}
                  disabled={isFollowed}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isFollowed
                      ? "bg-white/10 text-white/50 border border-white/15 cursor-default"
                      : "bg-amber-400 hover:bg-amber-300 text-black"
                  }`}
                >
                  {isFollowed ? "✓ Suivi" : "Suivre"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleFinish}
        disabled={saving}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-amber-400/20 mt-2"
      >
        {saving
          ? "Chargement…"
          : followed.size > 0
          ? `Continuer avec ${followed.size} suivi${followed.size > 1 ? "s" : ""} →`
          : "Passer cette étape →"}
      </button>

      {modalUser && (
        <SubscribeModal
          username={modalUser.username}
          displayName={modalUser.displayName}
          avatar={modalUser.avatar}
          creatorId={modalUser.id}
          savagePrice={modalUser.subscriptionPrice}
          vipPrice={modalUser.subscriptionVIP}
          currentTier="NONE"
          onClose={() => setModalUser(null)}
          onSuccess={() => handleSubscribeSuccess(modalUser.id)}
        />
      )}
    </div>
  );
}