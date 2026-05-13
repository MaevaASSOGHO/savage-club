// components/Discover/MediaCard.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import MediaWatermark from "@/components/MediaWatermark";
import SubscribeModal from "@/components/profile/SubscribeModal";

type DiscoverPost = {
  id:         string;
  content:    string;
  createdAt:  string | Date;
  visibility: "PUBLIC" | "SUBSCRIBERS" | "PAID";
  price?:     number | null;
  previewUrl?: string | null;
  medias: {
    id:    string;
    url:   string;
    type:  string;
    order: number;
  }[];
  likes:    { id: string }[];
  comments: { id: string }[];
  user: {
    id:                string;
    username:          string;
    displayName?:      string | null;
    avatar:            string | null;
    isVerified:        boolean;
    subscriptionPrice?: number | null;
    subscriptionVIP?:   number | null;
  };
  _count?: { PostMedia: number };
};

export default function MediaCard({ post }: { post: DiscoverPost }) {
  const { data: session } = useSession();
  const [currentTier, setCurrentTier] = useState<"NONE" | "FREE" | "SAVAGE" | "VIP">("NONE");
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);

  // Charger le tier d'abonnement au créateur
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/subscriptions?creatorId=${post.user.id}`)
      .then((r) => r.json())
      .then((data) => setCurrentTier(data.tier ?? "NONE"))
      .catch(() => {});
  }, [session?.user?.id, post.user.id]);

  const firstMedia = post.medias[0];
  if (!firstMedia) return null;

  const isOwner        = session?.user?.id === post.user.id;
  const isSubscribed   = currentTier !== "NONE";
  const isPaid         = !!(post.price && post.price > 0);
  const isSubscribersOnly = post.visibility === "SUBSCRIBERS";

  // Peut voir le contenu complet ?
  const canView = isOwner || isSubscribed;

  const isVideo = firstMedia.type === "VIDEO";
  const hasMultiple = (post._count?.PostMedia ?? post.medias.length) > 1;

  // --- Cas 1 : Post payant (price > 0) ---
  if (isPaid && !canView) {
    const thumb = post.previewUrl ?? firstMedia.url;
    const isPreviewVideo =
      thumb.includes("/video/") || /\.(mp4|mov|webm)$/i.test(thumb);

    return (
      <>
        <div className="relative aspect-square bg-black overflow-hidden group">
          {/* Aperçu flou */}
          {isPreviewVideo ? (
            <video
              src={thumb}
              muted
              playsInline
              loop
              autoPlay
              className="w-full h-full object-cover scale-105 blur-sm"
            />
          ) : (
            <img
              src={thumb}
              alt=""
              className="w-full h-full object-cover scale-105 blur-sm"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}

          {/* Overlay payant */}
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-amber-400 text-xl">🔒</span>
              <span className="text-white font-bold text-xs text-center leading-tight px-2">
                {post.price?.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
            <div className="flex gap-1.5 mt-1">
              {/* Bouton Aperçu → page du post */}
              <Link
                href={`/post/${post.id}`}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                Aperçu
              </Link>
              {/* Bouton S'abonner */}
              <button
                onClick={(e) => { e.preventDefault(); setSubscribeModalOpen(true); }}
                className="bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
              >
                Déverrouiller
              </button>
            </div>
          </div>

          {/* Indicateur vidéo */}
          {isPreviewVideo && (
            <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-20 pointer-events-none">
              ▶ RÉEL
            </div>
          )}
        </div>

        {subscribeModalOpen && (
          <SubscribeModal
            username={post.user.username}
            displayName={post.user.displayName ?? null}
            avatar={post.user.avatar}
            creatorId={post.user.id}
            savagePrice={post.user.subscriptionPrice ?? null}
            vipPrice={post.user.subscriptionVIP ?? null}
            currentTier={currentTier}
            onClose={() => setSubscribeModalOpen(false)}
            onSuccess={(newTier) => setCurrentTier(newTier)}
          />
        )}
      </>
    );
  }

  // --- Cas 2 : Post abonnés uniquement, utilisateur non abonné ---
  if (isSubscribersOnly && !canView) {
    return (
      <>
        <div className="relative aspect-square bg-black overflow-hidden group">
          {/* Média flouté */}
          {isVideo ? (
            <video
              src={firstMedia.url}
              muted
              playsInline
              className="w-full h-full object-cover scale-105 blur-md"
            />
          ) : (
            <img
              src={firstMedia.url}
              alt=""
              className="w-full h-full object-cover scale-105 blur-md"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}

          {/* Overlay abonnés */}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 z-10 px-3 text-center">
            <span className="text-2xl">🔐</span>
            <p className="text-white font-bold text-[11px] leading-snug">
              Abonnés uniquement
            </p>
            <button
              onClick={(e) => { e.preventDefault(); setSubscribeModalOpen(true); }}
              className="mt-1 bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              S&apos;abonner
            </button>
          </div>
        </div>

        {subscribeModalOpen && (
          <SubscribeModal
            username={post.user.username}
            displayName={post.user.displayName ?? null}
            avatar={post.user.avatar}
            creatorId={post.user.id}
            savagePrice={post.user.subscriptionPrice ?? null}
            vipPrice={post.user.subscriptionVIP ?? null}
            currentTier={currentTier}
            onClose={() => setSubscribeModalOpen(false)}
            onSuccess={(newTier) => setCurrentTier(newTier)}
          />
        )}
      </>
    );
  }

  // --- Cas 3 : Contenu visible (PUBLIC, ou abonné, ou propriétaire) ---
  return (
    <Link href={`/post/${post.id}`} className="block">
      <div className="relative aspect-square bg-black overflow-hidden group">
        {isVideo ? (
          <video
            src={firstMedia.url}
            muted
            playsInline
            loop
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <img
            src={firstMedia.url}
            alt={post.content ?? ""}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}

        {/* Watermark obligatoire sur tout contenu visible */}
        <MediaWatermark postId={post.id} />

        {/* Indicateur vidéo */}
        {isVideo && (
          <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-20 pointer-events-none">
            ▶ RÉEL
          </div>
        )}

        {/* Indicateur carousel */}
        {hasMultiple && (
          <div className="absolute top-1.5 right-1.5 bg-black/50 text-white z-20 pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="13" height="13" rx="2"/>
              <path d="M9 9h13v13H9z" opacity="0.5"/>
            </svg>
          </div>
        )}

        {/* Hover overlay : stats */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 z-10">
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <span>🔥</span>
            <span>{post.likes.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span>{post.comments.length}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
