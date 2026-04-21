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
  role: string; // "USER" | "CREATOR" | "TRAINER"
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
  if (price === null) return { show: false, free: false, blocked: false, label: "" };
  if (tier === "NONE" || tier === "FREE") {
    return { show: true, free: false, blocked: true, label: "Abonnement Savage requis" };
  }
  if (tier === "VIP" && actionType === "message") {
    return { show: true, free: true, blocked: false, label: "Gratuit" };
  }
  const isFree = price === 0;
  return { show: true, free: isFree, blocked: false, label: isFree ? "Gratuit" : `${price.toLocaleString("fr-FR")} FCFA` };
}

function ActionButton({ icon, label, sublabel, free, blocked, onClick }: {
  icon: React.ReactNode; label: string; sublabel?: string;
  free?: boolean; blocked?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={blocked ? undefined : onClick}
      disabled={blocked}
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
          }`}>{sublabel}</span>
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

// ── Modale contenu personnalisé ────────────────────────────────────────────
function CustomContentModal({
  isVIP, creatorName, creatorId, onClose,
}: {
  isVIP: boolean; creatorName: string; creatorId: string; onClose: () => void;
}) {
  const router  = useRouter();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSend() {
    if (!message.trim() || sending) return;
    setSending(true);
    const convRes = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: creatorId, type: "CUSTOM_CONTENT" }),
    });
    const { conversationId } = await convRes.json();
    if (conversationId) {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.trim() }),
      });
    }
    setSending(false);
    setSent(true);
    setTimeout(() => { onClose(); router.push("/messages"); }, 1500);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <p className="text-white font-bold text-sm">Contenu personnalisé</p>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-4">
            {!isVIP ? (
              <>
                <div className="text-center space-y-3 py-2">
                  <span className="text-4xl">👑</span>
                  <p className="text-white font-semibold">Réservé aux abonnés VIP</p>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Pour demander du contenu personnalisé à{" "}
                    <strong className="text-white">{creatorName}</strong>, vous devez être abonné Savage VIP.
                  </p>
                </div>
                <button onClick={onClose}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-2.5 rounded-xl transition-all text-sm">
                  Devenir VIP
                </button>
              </>
            ) : sent ? (
              <div className="text-center space-y-3 py-4">
                <span className="text-4xl">✅</span>
                <p className="text-white font-semibold">Demande envoyée !</p>
                <p className="text-white/40 text-xs">Redirection vers vos messages...</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-white/60 text-xs mb-1.5">
                    Décrivez votre demande à <span className="text-white font-medium">{creatorName}</span>
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ex : Je voudrais une vidéo de motivation personnalisée pour..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/40 resize-none transition-colors"
                  />
                </div>
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
                  <p className="text-amber-400/70 text-xs">
                    👑 Avantage VIP — contenu personnalisé inclus dans votre abonnement.
                  </p>
                </div>
                <button onClick={handleSend} disabled={!message.trim() || sending}
                  className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-bold py-2.5 rounded-xl transition-all text-sm">
                  {sending ? "Envoi..." : "Envoyer la demande"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
export default function ProfileActions({
  userId, username, displayName, avatar, role,
  savagePrice, vipPrice,
  messagePrice, audioCallPrice, videoCallPrice,
  viewerTier: initialTier,
}: Props) {
  const router = useRouter();
  const [modalOpen,       setModalOpen]       = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [tier,            setTier]            = useState<SubscriptionTier>(initialTier);

  const isCreatorOrTrainer = role === "CREATOR" || role === "TRAINER";
  const isVIP              = tier === "VIP";

  // Message — toujours visible, bloqué seulement si le créateur a fixé un prix ET abonnement insuffisant
  const messageBlocked = (tier === "NONE" || tier === "FREE") && messagePrice !== null && messagePrice > 0;
  const messageFree    = tier === "VIP" || !messagePrice || messagePrice === 0;
  const messageLabel   = messageBlocked
    ? "Savage requis"
    : tier === "VIP" ? "Gratuit"
    : messagePrice ? `${messagePrice.toLocaleString("fr-FR")} FCFA`
    : "Gratuit";

  const audio = getAccess(audioCallPrice, tier, "audio");
  const video = getAccess(videoCallPrice, tier, "video");

  const subscribeLabel =
    tier === "NONE" ? "S'abonner" :
    tier === "FREE" ? "✓ Abonné" :
    tier === "VIP"  ? "✓ VIP"    : "✓ Savage";

  const subscribeStyle = tier === "NONE"
    ? "flex-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm py-2.5 px-5 rounded-xl transition-all min-w-[110px]"
    : "flex-1 bg-white/10 hover:bg-white/15 border border-amber-400/40 text-amber-400 font-bold text-sm py-2.5 px-5 rounded-xl transition-all min-w-[110px]";

  return (
    <>
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex gap-2 flex-wrap">

          {/* S'abonner */}
          <button className={subscribeStyle} onClick={() => setModalOpen(true)}>
            {subscribeLabel}
          </button>

          {/* Message — toujours présent */}
          <ActionButton
            icon={<IconMessage />} label="Message"
            sublabel={messageLabel}
            free={messageFree} blocked={messageBlocked}
            onClick={() => router.push(`/messages?user=${username}`)}
          />

          {/* Appel audio — créateurs/formateurs uniquement */}
          {isCreatorOrTrainer && audio.show && (
            <ActionButton
              icon={<IconAudio />} label="Appel audio"
              sublabel={audio.blocked ? "Savage requis" : audio.label}
              free={audio.free} blocked={audio.blocked}
              onClick={() => router.push(`/appel/audio?user=${userId}`)}
            />
          )}

          {/* Appel vidéo — créateurs/formateurs uniquement */}
          {isCreatorOrTrainer && video.show && (
            <ActionButton
              icon={<IconVideo />} label="Appel vidéo"
              sublabel={video.blocked ? "Savage requis" : video.label}
              free={video.free} blocked={video.blocked}
              onClick={() => router.push(`/appel/video?user=${userId}`)}
            />
          )}
        </div>

        {/* Contenu personnalisé — créateurs/formateurs uniquement */}
        {isCreatorOrTrainer && (
          <button onClick={() => setCustomModalOpen(true)}
            className={`w-full border text-sm py-2.5 rounded-xl transition-all ${
              isVIP
                ? "bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/30 text-amber-400"
                : "bg-white/5 hover:bg-white/8 border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {isVIP ? "👑 Demander un contenu personnalisé" : "Demander un contenu personnalisé"}
          </button>
        )}
      </div>

      {modalOpen && (
        <SubscribeModal
          username={username} displayName={displayName} avatar={avatar}
          creatorId={userId} savagePrice={savagePrice} vipPrice={vipPrice}
          currentTier={tier}
          onClose={() => setModalOpen(false)}
          onSuccess={(newTier) => setTier(newTier as SubscriptionTier)}
        />
      )}

      {customModalOpen && (
        <CustomContentModal
          isVIP={isVIP}
          creatorName={displayName ?? username}
          creatorId={userId}
          onClose={() => setCustomModalOpen(false)}
        />
      )}
    </>
  );
}
