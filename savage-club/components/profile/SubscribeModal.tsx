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

// ── Option card ────────────────────────────────────────────────────────────
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

// ── Composant principal ────────────────────────────────────────────────────
export default function SubscribeModal({
  username, displayName, avatar, creatorId,
  savagePrice, vipPrice,
  currentTier, onClose, onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Tier | null>(
    currentTier !== "NONE" ? (currentTier as Tier) : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isChanging = currentTier !== "NONE";
  const hasPaidOptions = savagePrice !== null || vipPrice !== null;

  async function handleConfirm() {
    if (!selected) return;
    if (selected === currentTier) { onClose(); return; }

    setLoading(true);
    setError(null);

    // Abonnement gratuit — pas de paiement
    if (selected === "FREE") {
      const res = await fetch("/api/subscriptions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ creatorId, tier: "FREE", amount: 0 }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      onSuccess("FREE");
      onClose();
      return;
    }

    // Abonnement payant → MoneyFusion
    const amount = selected === "VIP" ? (vipPrice ?? 0) : (savagePrice ?? 0);
    
    if (amount === 0) {
      // Prix à 0 → gratuit aussi
      const res = await fetch("/api/subscriptions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ creatorId, tier: selected, amount: 0 }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      onSuccess(selected);
      onClose();
      return;
    }

    // Demander le numéro de téléphone
    const phone = prompt("Entrez votre numéro Mobile Money (ex: 0701020304) :");
    if (!phone) { setLoading(false); return; }

    // Créer d'abord l'abonnement en PENDING
    const subRes = await fetch("/api/subscriptions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ creatorId, tier: selected, amount, status: "PENDING" }),
    });
    const subData = await subRes.json();
    if (!subRes.ok) { setError(subData.error || "Erreur"); setLoading(false); return; }

    // Initier le paiement MoneyFusion
    const payRes = await fetch("/api/payments/moneyfusion/create", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        amount,
        type:        "SUBSCRIPTION",
        recipientId: creatorId,
        phoneNumber: phone,
        description: `Abonnement ${selected} - ${displayName ?? username}`,
      }),
    });
    const payData = await payRes.json();
    setLoading(false);

    if (!payRes.ok) { setError(payData.error || "Erreur paiement"); return; }

    // Rediriger vers la page MoneyFusion
    window.location.href = payData.redirectUrl;
  }

  async function handleUnsubscribe() {
    setLoading(true);
    await fetch(`/api/subscriptions?creatorId=${creatorId}`, { method: "DELETE" });
    setLoading(false);
    onSuccess("FREE"); // retour à l'état non abonné
    queryClient.invalidateQueries({ queryKey: ["followers", username] });
queryClient.invalidateQueries({ queryKey: ["following", username] });
    onClose();
  }

  const confirmLabel = () => {
    if (loading) return "Traitement...";
    if (selected === currentTier) return "Abonnement actuel";
    if (!selected) return "Choisir un abonnement";
    if (selected === "FREE") return "S'abonner gratuitement";
    return isChanging ? `Passer en ${selected}` : `S'abonner en ${selected}`;
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose}/>

      {/* Modale */}
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

            {/* Option FREE — toujours présente */}
            <TierCard
              tier="FREE"
              title="Gratuit"
              price="Gratuit"
              perks={["Accès aux contenus publics", "Commenter et réagir aux posts"]}
              selected={selected === "FREE"}
              current={currentTier === "FREE"}
              onClick={() => setSelected("FREE")}
            />

            {/* Option SAVAGE — seulement si prix défini */}
            {savagePrice !== null && (
              <TierCard
                tier="SAVAGE"
                title="Savage"
                price={formatPrice(savagePrice)!}
                perks={["Contenus exclusifs abonnés", "Messages au tarif abonné"]}
                selected={selected === "SAVAGE"}
                current={currentTier === "SAVAGE"}
                onClick={() => setSelected("SAVAGE")}
              />
            )}

            {/* Option VIP — seulement si prix défini */}
            {vipPrice !== null && (
              <TierCard
                tier="VIP"
                title="Savage VIP"
                badge="PREMIUM"
                price={formatPrice(vipPrice)!}
                perks={[
                  "Tout l'abonnement Savage",
                  "Messages gratuits",
                  "Appels audio & vidéo au tarif créateur",
                ]}
                selected={selected === "VIP"}
                current={currentTier === "VIP"}
                onClick={() => setSelected("VIP")}
              />
            )}

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 space-y-2 border-t border-white/8">
            <button
              onClick={handleConfirm}
              disabled={!selected || loading || selected === currentTier}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all"
            >
              {confirmLabel()}
            </button>

            {isChanging && (
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="w-full text-red-400/60 hover:text-red-400 text-sm py-2 transition-colors"
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
