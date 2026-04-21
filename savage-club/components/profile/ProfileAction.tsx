// components/profile/ProfileActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SubscribeModal from "@/components/profile/SubscribeModal";

export type SubscriptionTier = "NONE" | "FREE" | "SAVAGE" | "VIP";

type Props = {
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  savagePrice: number | null;
  vipPrice: number | null;
  messagePrice:   number | null;
  audioCallPrice: number | null;
  videoCallPrice: number | null;
  viewerTier: SubscriptionTier;
};

type Access = { show: boolean; free: boolean; blocked: boolean; label: string };
type ActionType = "message" | "audio" | "video";

function getAccess(price: number | null, tier: SubscriptionTier, actionType: ActionType): Access {
  // Créateur n'a pas activé
  if (price === null) return { show: false, free: false, blocked: false, label: "" };

  // Non connecté ou abonné FREE → bloqué
  if (tier === "NONE" || tier === "FREE") {
    return { show: true, free: false, blocked: true, label: "Abonnement Savage requis" };
  }

  // VIP → message gratuit
  if (tier === "VIP" && actionType === "message") {
    return { show: true, free: true, blocked: false, label: "Gratuit" };
  }

  // SAVAGE ou VIP (audio/vidéo) → prix créateur
  const isFree = price === 0;
  return {
    show: true, free: isFree, blocked: false,
    label: isFree ? "Gratuit" : `${price.toLocaleString("fr-FR")} FCFA`,
  };
}

function ActionButton({ icon, label, sublabel, free, blocked, onClick }: {
  icon: React.ReactNode; label: string; sublabel?: string;
  free?: boolean; blocked?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={blocked ? undefined : onClick}
      disabled={blocked}
      title={blocked ? "Abonnement Savage requis" : undefined}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all text-sm font-medium border ${
        blocked
          ? "bg-white/3 border-white/8 text-white/30 cursor-not-allowed"
          : "bg-white/8 hover:bg-white/12 border-white/10 text-white"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex flex-col items-start leading-tight">
        <span>{label}</span>
        {sublabel && (
          <span className={`text-[10px] font-normal ${
            blocked ? "text-white/20" : free ? "text-green-400" : "text-amber-400/80"
          }`}>
            {sublabel}
          </span>
        )}
      </span>
      {blocked && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto opacity-25">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      )}
    </button>
  );
}

const IconMessage = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const IconAudio = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);
const IconVideo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

export default function ProfileActions({
  userId, username, displayName, avatar,
  savagePrice, vipPrice,
  messagePrice, audioCallPrice, videoCallPrice,
  viewerTier: initialTier,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [tier, setTier] = useState<SubscriptionTier>(initialTier);

  const msg   = getAccess(messagePrice,   tier, "message");
  const audio = getAccess(audioCallPrice, tier, "audio");
  const video = getAccess(videoCallPrice, tier, "video");

  // Label et style du bouton selon tier
  const subscribeLabel =
    tier === "NONE"   ? "S'abonner" :
    tier === "FREE"   ? "✓ Abonné" :
    tier === "VIP"    ? "✓ VIP" :
                        "✓ Savage";

  const subscribeStyle =
    tier === "NONE"
      ? "flex-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm py-2.5 px-5 rounded-xl transition-all min-w-[110px]"
      : "flex-1 bg-white/10 hover:bg-white/15 border border-amber-400/40 text-amber-400 font-bold text-sm py-2.5 px-5 rounded-xl transition-all min-w-[110px]";

  return (
    <>
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex gap-2 flex-wrap">

          <button className={subscribeStyle} onClick={() => setModalOpen(true)}>
            {subscribeLabel}
          </button>

          {msg.show && (
            <ActionButton
              icon={<IconMessage />} label="Message"
              sublabel={msg.blocked ? "Savage requis" : msg.label}
              free={msg.free} blocked={msg.blocked}
              onClick={() => router.push(`/messages?user=${username}`)}
            />
          )}

          {audio.show && (
            <ActionButton
              icon={<IconAudio />} label="Appel audio"
              sublabel={audio.blocked ? "Savage requis" : audio.label}
              free={audio.free} blocked={audio.blocked}
              onClick={() => router.push(`/appel/audio?user=${userId}`)}
            />
          )}

          {video.show && (
            <ActionButton
              icon={<IconVideo />} label="Appel vidéo"
              sublabel={video.blocked ? "Savage requis" : video.label}
              free={video.free} blocked={video.blocked}
              onClick={() => router.push(`/appel/video?user=${userId}`)}
            />
          )}
        </div>

        <button className="w-full bg-white/5 hover:bg-white/8 border border-white/10 text-white/60 hover:text-white text-sm py-2.5 rounded-xl transition-all">
          Demander un contenu personnalisé
        </button>
      </div>

      {modalOpen && (
        <SubscribeModal
          username={username}
          displayName={displayName}
          avatar={avatar}
          creatorId={userId}
          savagePrice={savagePrice}
          vipPrice={vipPrice}
          currentTier={tier}
          onClose={() => setModalOpen(false)}
          onSuccess={(newTier) => setTier(newTier as SubscriptionTier)}
        />
      )}
    </>
  );
}
