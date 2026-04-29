// components/profile/SubscribeModal.tsx
"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type Tier = "FREE" | "SAVAGE" | "VIP";

type Props = {
  username: string;
  displayName: string | null;
  avatar: string | null;
  creatorId: string;
  savagePrice: number | null;
  vipPrice: number | null;
  currentTier: "NONE" | "SAVAGE" | "VIP" | "FREE";
  onClose: () => void;
  onSuccess: (tier: "FREE" | "SAVAGE" | "VIP") => void;
};

function formatPrice(price: number | null) {
  if (price === null) return null;
  if (price === 0) return "Gratuit";
  return `${price.toLocaleString("fr-FR")} FCFA / mois`;
}

function TierCard({
  tier, title, badge, price, perks, selected, current, unavailable, onClick,
}: {
  tier: Tier; title: string; badge?: string; price: string;
  perks: string[]; selected: boolean; current: boolean;
  unavailable?: boolean; onClick: () => void;
}) {
  const isHighlight = tier === "VIP";
  return (
    <button
      onClick={unavailable ? undefined : onClick}
      disabled={unavailable}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        unavailable
          ? "border-white/5 bg-white/3 opacity-40 cursor-not-allowed"
          : selected
          ? isHighlight
            ? "border-amber-400/60 bg-gradient-to-br from-amber-400/15 to-purple-900/30"
            : "border-amber-400/60 bg-amber-400/10"
          : isHighlight
          ? "border-amber-400/20 bg-gradient-to-br from-amber-400/5 to-purple-900/20 hover:border-amber-400/30"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-amber-400 font-black text-sm uppercase tracking-wider">{title}</span>
          {badge && (
            <span className="bg-amber-400/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {badge}
            </span>
          )}
          {current && (
            <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Actuel
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-white font-semibold text-sm">{price}</span>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            selected ? "border-amber-400 bg-amber-400" : "border-white/20"
          }`}>
            {selected && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
        </div>
      </div>
      <ul className="mt-2 space-y-1">
        {perks.map((perk) => (
          <li key={perk} className="text-white/40 text-xs flex items-center gap-1.5">
            <span className="text-amber-400/60">✓</span> {perk}
          </li>
        ))}
      </ul>
    </button>
  );
}

export default function SubscribeModal({
  username, displayName, avatar, creatorId,
  savagePrice, vipPrice,
  currentTier, onClose, onSuccess,
}: Props) {
  const queryClient  = useQueryClient();
  const [selected,   setSelected]   = useState<Tier | null>(currentTier !== "NONE" ? (currentTier as Tier) : null);
  const [loading,    setLoading]    = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const isChanging     = currentTier !== "NONE";

  async function handleConfirm() {
    if (!selected) return;
    if (selected === currentTier) { onClose(); return; }

    setLoading(true);
    setError(null);

    const amount = selected === "FREE"  ? 0
                 : selected === "VIP"   ? (vipPrice   ?? 0)
                 : (savagePrice ?? 0);

    // Abonnement gratuit ou prix = 0
    if (selected === "FREE" || amount === 0) {
      const res  = await fetch("/api/subscriptions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ creatorId, tier: selected, amount: 0 }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      onSuccess(selected as "FREE" | "SAVAGE" | "VIP");
      queryClient.invalidateQueries({ queryKey: ["followers", username] });
      onClose();
      return;
    }

    // Abonnement payant → MoneyFusion (sans numéro, MF le demande sur leur page)
    const payRes  = await fetch("/api/payments/moneyfusion/create", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        amount,
        type:        "SUBSCRIPTION",
        tier:        selected,           // ← tier passé pour le webhook
        recipientId: creatorId,
        description: `Abonnement ${selected} - ${displayName ?? username}`,
      }),
    });
    const payData = await payRes.json();

    if (!payRes.ok) {
      setLoading(false);
      setError(payData.error || "Erreur paiement");
      return;
    }

    // Redirection vers MoneyFusion
    setRedirecting(true);
    window.location.href = payData.redirectUrl;
  }

  async function handleUnsubscribe() {
    setLoading(true);
    await fetch(`/api/subscriptions?creatorId=${creatorId}`, { method: "DELETE" });
    setLoading(false);
    onSuccess("FREE");
    queryClient.invalidateQueries({ queryKey: ["followers", username] });
    queryClient.invalidateQueries({ queryKey: ["following", username] });
    onClose();
  }

  const confirmLabel = () => {
    if (selected === currentTier) return "Abonnement actuel";
    if (!selected) return "Choisir un abonnement";
    if (selected === "FREE") return "S'abonner gratuitement";
    return isChanging ? `Passer en ${selected}` : `S'abonner en ${selected}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose}/>

      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto w-full md:max-w-md bg-[#1E0A3C] md:rounded-2xl rounded-t-2xl border border-white/10 shadow-2xl overflow-hidden">

          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 bg-white/20 rounded-full"/>
          </div>

          {/* Header */}
          <div className="px-6 pt-4 pb-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/10 flex-shrink-0">
                {avatar
                  ? <img src={avatar} alt="" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold">
                      {username[0].toUpperCase()}
                    </div>
                }
              </div>
              <div>
                <p className="text-white font-bold">{displayName ?? username}</p>
                <p className="text-white/40 text-xs">@{username}</p>
              </div>
              <button onClick={onClose} className="ml-auto text-white/30 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="text-white/50 text-sm mt-3">
              {isChanging ? "Modifier votre abonnement" : "Choisissez votre abonnement"}
            </p>
          </div>

          {/* Options */}
          <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            <TierCard
              tier="FREE" title="Gratuit" price="Gratuit"
              perks={["Accès aux contenus publics", "Commenter et réagir aux posts"]}
              selected={selected === "FREE"} current={currentTier === "FREE"}
              onClick={() => setSelected("FREE")}
            />
            {savagePrice !== null && (
              <TierCard
                tier="SAVAGE" title="Savage" price={formatPrice(savagePrice)!}
                perks={["Contenus exclusifs abonnés", "Messages au tarif abonné"]}
                selected={selected === "SAVAGE"} current={currentTier === "SAVAGE"}
                onClick={() => setSelected("SAVAGE")}
              />
            )}
            {vipPrice !== null && (
              <TierCard
                tier="VIP" title="Savage VIP" badge="PREMIUM" price={formatPrice(vipPrice)!}
                perks={["Tout l'abonnement Savage", "Messages gratuits", "Appels audio & vidéo au tarif créateur"]}
                selected={selected === "VIP"} current={currentTier === "VIP"}
                onClick={() => setSelected("VIP")}
              />
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 space-y-2 border-t border-white/8">
            <button
              onClick={handleConfirm}
              disabled={!selected || loading || redirecting || selected === currentTier}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {redirecting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Redirection vers le paiement...
                </>
              ) : loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Traitement...
                </>
              ) : confirmLabel()}
            </button>

            {isChanging && (
              <button
                onClick={handleUnsubscribe}
                disabled={loading || redirecting}
                className="w-full text-red-400/60 hover:text-red-400 text-sm py-2 transition-colors disabled:opacity-30"
              >
                Se désabonner
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
