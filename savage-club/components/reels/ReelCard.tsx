// components/reels/ReelCard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReportButton from "@/components/ReportButton";
import { FormattedReel } from "@/types/reel";

type Comment = {
  id: string;
  text: string;
  user: { username: string; avatar: string | null };
  createdAt: string;
};

type Media = {
  id: string;
  url: string;
  type: string;
  order: number;
};

type Post = {
  id: string;
  content: string | null;
  medias: Media[];
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    isVerified: boolean;
  };
  likes: { id: string }[];
  comments: { id: string }[];
  _count: {
    comments: number;
  };
};

function VerifiedBadge({ size = 15 }: { size?: number }) {
  return (
    <span className="bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10" fill="none">
        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

function IconComment() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function IconIdea() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18"/>
      <line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
    </svg>
  );
}

function IconMusic() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  );
}

function IconBookmark({ filled }: { filled: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  );
}

export default function ReelCard({ 
  post, 
  isActive,
  setVideoRef 
}: { 
  post: FormattedReel;  // ✅ Utiliser le type formaté
  isActive: boolean;
  setVideoRef: (el: HTMLVideoElement | null) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [muted, setMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Réactions
  const [fired, setFired] = useState(false);
  const [fireCount, setFireCount] = useState(post.likesCount ?? 0);
  const [sparked, setSparked] = useState(false);
  const [idea, setIdea] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  const caption = post.content || "";
  const captionShort = caption.length > 80 ? caption.slice(0, 80) + "..." : caption;

  // Vérifier si l'utilisateur suit déjà
  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch(`/api/subscriptions?creatorId=${post.user.id}`);
        if (res.ok) {
          const data = await res.json();
          // Si l'utilisateur a un abonnement actif, on considère qu'il "suit"
          setIsFollowing(!!data.sub && data.sub.status === "ACTIVE");
        }
      } catch (error) {
        console.error("Erreur vérification abonnement:", error);
      }
    };
    checkSubscription();
  }, [session, post.user.id]);

  // Charger l'état des réactions
  useEffect(() => {
    fetch(`/api/posts/${post.id}/reactions`)
      .then((r) => r.json())
      .then((data) => {
        setFired(data.liked ?? false);
        setSparked(data.sparked ?? false);
        setIdea(data.idea ?? false);
        setFireCount(data.likeCount ?? post.likes.length);
      })
      .catch(() => {});
  }, [post.id]);

  // Actions de réaction
  async function handleFire() {
    if (!session) return router.push("/auth");
    const next = !fired;
    setFired(next);
    setFireCount((c) => c + (next ? 1 : -1));
    await fetch(`/api/posts/${post.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "LIKE" }),
    });
  }

  async function handleSparkle() {
    if (!session) return router.push("/auth");
    setSparked((v) => !v);
    await fetch(`/api/posts/${post.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "SPARKLE" }),
    });
  }

  async function handleIdea() {
    if (!session) return router.push("/auth");
    setIdea((v) => !v);
    await fetch(`/api/posts/${post.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "IDEA" }),
    });
  }

  async function handleSave() {
    if (!session) return router.push("/auth");
    setSaved(!saved);
    await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
  }

  async function handleShare() {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
  }

  async function handleFollow() {
    if (!session) return router.push("/auth");
    setFollowingLoading(true);
    
    try {
      if (isFollowing) {
        // Se désabonner
        const res = await fetch(`/api/subscriptions?creatorId=${post.user.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsFollowing(false);
        }
      } else {
        // S'abonner (tier FREE par défaut)
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorId: post.user.id,
            tier: "FREE",
            amount: 0,
          }),
        });
        if (res.ok) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error("Erreur follow:", error);
    } finally {
      setFollowingLoading(false);
    }
  }

  async function submitComment() {
    if (!session) return router.push("/auth");
    if (!commentText.trim() || submitting) return;
    
    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, text: commentText }),
    });
    
    if (res.ok) {
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    }
    setSubmitting(false);
  }

  // Trouver la première vidéo
  const videoMedia = post.medias.find(m => m.type === "VIDEO");
  const videoUrl = videoMedia?.url;

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center">
      {/* Conteneur avec marges extérieures et bordure arrondie */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="relative w-full h-full max-w-[400px] max-h-[calc(100vh-2rem)] rounded-2xl overflow-hidden shadow-2xl bg-black">
          
          {/* Vidéo */}
          {videoUrl && (
            <video
              ref={setVideoRef}
              src={videoUrl}
              loop
              playsInline
              muted={muted}
              className="w-full h-full object-cover"
            />
          )}

          {/* Overlay gradient pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

          {/* Bouton signalement (3 petits points) en haut à droite */}
          <div className="absolute top-4 right-4 z-10">
            <ReportButton type="post" id={post.id} variant="icon" />
          </div>

          {/* Bouton mute */}
          <button
            onClick={() => setMuted(!muted)}
            className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>

          {/* Sidebar actions (droite) */}
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
            <button
              onClick={handleFire}
              className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
            >
              <span className={`text-3xl transition-all duration-200 ${fired ? "" : "grayscale opacity-80"}`}>
                🔥
              </span>
              {fireCount > 0 && (
                <span className="text-white text-xs font-medium">{fireCount}</span>
              )}
            </button>

            <button
              onClick={handleSparkle}
              className={`flex flex-col items-center gap-1 hover:scale-110 transition-transform ${sparked ? "text-amber-400" : "text-white/70 hover:text-white"}`}
            >
              <IconSparkle />
            </button>

            <button
              onClick={handleIdea}
              className={`flex flex-col items-center gap-1 hover:scale-110 transition-transform ${idea ? "text-yellow-300" : "text-white/70 hover:text-white"}`}
            >
              <IconIdea />
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex flex-col items-center gap-1 text-white/70 hover:text-white hover:scale-110 transition-transform"
            >
              <IconComment />
              {post.commentsCount > 0 && (
                <span className="text-xs">{post.commentsCount}</span>
              )}
            </button>

            <button
              onClick={handleSave}
              className={`flex flex-col items-center gap-1 hover:scale-110 transition-transform ${saved ? "text-amber-400" : "text-white/70 hover:text-white"}`}
            >
              <IconBookmark filled={saved} />
            </button>

            <button
              onClick={handleShare}
              className={`flex flex-col items-center gap-1 hover:scale-110 transition-transform ${shared ? "text-green-400" : "text-white/70 hover:text-white"}`}
            >
              <IconShare />
            </button>
          </div>

          {/* Informations (bas gauche) */}
          <div className="absolute left-3 bottom-20 right-16 z-10">
            {/* Profil + bouton Follow */}
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/profil/${post.user.username}`}>
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20 hover:ring-amber-400 transition-all">
                  {post.user.avatar ? (
                    <img src={post.user.avatar} alt={post.user.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold">
                      {post.user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="flex items-center gap-1">
                <Link 
                  href={`/profil/${post.user.username}`}
                  className="text-white font-semibold text-sm hover:text-amber-400 transition-colors"
                >
                  {post.user.displayName ?? post.user.username}
                </Link>
                {post.user.isVerified && <VerifiedBadge />}
              </div>

              {/* Bouton Suivre - style border amber avec disparition si déjà suivi */}
{session?.user?.id !== post.user.id && !isFollowing && (
  <button
    onClick={handleFollow}
    disabled={followingLoading}
    className="ml-2 px-3 py-1 rounded-full text-xs font-bold text-amber-500 border border-amber-500 hover:bg-white/20 transition-all"
  >
    {followingLoading ? "..." : "Suivre"}
  </button>
)}
            </div>

            {/* Description avec bouton "plus" */}
            {caption && (
              <div className="max-w-[85%] mb-2">
                <p className="text-white/90 text-sm leading-relaxed">
                  {showFullCaption ? caption : captionShort}
                  {caption.length > 80 && (
                    <button
                      onClick={() => setShowFullCaption(!showFullCaption)}
                      className="text-white/60 text-xs ml-1 font-medium hover:text-white transition-colors"
                    >
                      {showFullCaption ? "moins" : "plus"}
                    </button>
                  )}
                </p>
              </div>
            )}

            {/* Son (placeholder) */}
            <div className="flex items-center gap-1 text-white/60">
              <IconMusic />
              <span className="text-xs">Son original</span>
            </div>
          </div>

          {/* Panneau commentaires */}
          {showComments && (
            <div className="absolute bottom-0 left-0 right-0 bg-[#1A1A1A] rounded-t-2xl z-20 max-h-[70vh] flex flex-col animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-white font-bold">Commentaires ({post.commentsCount})</h3>
                <button onClick={() => setShowComments(false)} className="text-white/50 hover:text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-600 overflow-hidden flex-shrink-0">
                      {comment.user.avatar ? (
                        <img src={comment.user.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                          {comment.user.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <Link href={`/profil/${comment.user.username}`} className="text-white font-semibold text-xs hover:text-amber-400">
                        {comment.user.username}
                      </Link>
                      <p className="text-white/80 text-xs mt-0.5">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitComment()}
                    placeholder="Ajouter un commentaire..."
                    className="flex-1 bg-white/5 text-white text-sm px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    onClick={submitComment}
                    disabled={!commentText.trim() || submitting}
                    className="bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}