// components/PostCard.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ProtectedMedia from "@/components/ProtectedMedia";
import MediaWatermark from "@/components/MediaWatermark";
import ReportButton from "@/components/ReportButton";


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
  content: string;
  price?: number | null;
  previewUrl?: string | null;
  medias: Media[];
  user: {
    id: string;
    username: string;
    displayName?: string | null;
    avatar: string | null;
    isVerified: boolean;
  };
  likes: { id: string }[];
  comments: { id: string }[];
};

type Collection = {
  id: string;
  name: string;
};

function IconComment() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function IconIdea() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18"/>
      <line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
    </svg>
  );
}

function IconBookmark({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  );
}

function VerifiedBadge({ size = 15 }: { size?: number }) {
  return (
    <span className="bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10" fill="none">
        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const [mediaIndex, setMediaIndex] = useState(0);

  // Réactions
  const [fired, setFired] = useState(false);
  const [fireCount, setFireCount] = useState(post.likes?.length ?? 0);
  const [sparked, setSparked] = useState(false);
  const [idea, setIdea] = useState(false);
  const [shared, setShared] = useState(false);

  // Sauvegarde
  const [saved, setSaved] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [loadingCollections, setLoadingCollections] = useState(false);

  // Commentaires
  const [showComments, setShowComments] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(post.comments?.length ?? 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  const { status } = useSession();
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/collections")
      .then((r) => r.json())
      .then((data) => setCollections(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [status]);

  // Charger les réactions
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

  // Charger l'état de sauvegarde et les collections
  useEffect(() => {
    // Vérifier si le post est sauvegardé
    fetch(`/api/saved-posts/${post.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSaved(data.saved ?? false);
        setSelectedCollection(data.collectionId ?? null);
      })
      .catch(() => {});

    // Charger les collections de l'utilisateur
    fetch("/api/collections")
      .then((r) => r.json())
      .then((data) => setCollections(data))
      .catch(() => {});
  }, [post.id]);

  // Charger les commentaires
  useEffect(() => {
    if (!showComments) return;
    setLoadingComments(true);
    fetch(`/api/posts/${post.id}/comments`)
      .then((r) => r.json())
      .then((data) => { 
        setComments(data); 
        setCommentCount(data.length); 
      })
      .finally(() => setLoadingComments(false));
  }, [showComments, post.id]);

  // Charger l'état de suivi
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const checkFollow = async () => {
      try {
        const res = await fetch(`/api/follow/status?userId=${post.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error("Erreur vérification follow:", error);
      }
    };
    checkFollow();
  }, [session, post.user.id]);

  async function handleFollow() {
    if (!session) return;
    setFollowingLoading(true);
    
    try {
      const res = await fetch(`/api/follow/${post.user.id}`, {
        method: "POST",
      });
      
      if (res.ok) {
        setIsFollowing(true); // Le bouton va disparaître
      } else {
        console.error("Erreur follow:", await res.text());
      }
    } catch (error) {
      console.error("Erreur follow:", error);
    } finally {
      setFollowingLoading(false);
    }
  }
  async function handleFire() {
    const next = !fired;
    setFired(next);
    setFireCount((c) => c + (next ? 1 : -1));
    await fetch(`/api/posts/${post.id}/reactions`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "LIKE" }),
    });
    if (next) {
      await fetch("/api/notifications", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LIKE", postId: post.id, receiverId: post.user.id }),
      });
    }
  }

  async function handleSparkle() {
    setSparked((v) => !v);
    await fetch(`/api/posts/${post.id}/reactions`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "SPARKLE" }),
    });
  }

  async function handleIdea() {
    setIdea((v) => !v);
    await fetch(`/api/posts/${post.id}/reactions`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "IDEA" }),
    });
  }

  async function handleShare() {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
  }

  async function handleSave(collectionId?: string) {
    if (savingLoading) return;
    setSavingLoading(true);
    
    const next = !saved;
    
    // Si on veut sauvegarder et qu'on a des collections, on propose de choisir
    if (next && collections.length > 0 && collectionId === undefined) {
      setShowCollectionMenu(true);
      setSavingLoading(false);
      return;
    }
    
    try {
      const res = await fetch("/api/saved-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          postId: post.id, 
          collectionId: collectionId || null 
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved);
        setSelectedCollection(data.collectionId || null);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
    
    setSavingLoading(false);
    setShowCollectionMenu(false);
  }

  async function handleSelectCollection(collectionId: string) {
    await handleSave(collectionId);
  }

  async function handleRemoveFromSaved() {
    try {
      const res = await fetch(`/api/saved-posts/${post.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setSaved(false);
        setSelectedCollection(null);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  }

  async function submitComment() {
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
      setCommentCount((c) => c + 1);
      setCommentText("");
      await fetch("/api/notifications", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "COMMENT", postId: post.id, receiverId: post.user.id }),
      });
    }
    setSubmitting(false);
  }

  const visibleComments = showAll ? comments : comments.slice(-2);

  const isReel     = post.medias.length === 1 && post.medias[0]?.type === "VIDEO";
  const isPaid     = !!(post.price && post.price > 0);
  const [showPreview, setShowPreview] = useState(false);
  const isCarousel = post.medias.length > 1;
  const current    = post.medias[mediaIndex];

  return (
    <div className="bg-transparent mb-8 relative w-full">

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <Link href={`/profil/${post.user.username}`}>
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-amber-400/60 transition-all cursor-pointer flex-shrink-0">
            {post.user.avatar
              ? <img src={post.user.avatar} alt={post.user.username} className="w-full h-full object-cover"/>
              : <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">{post.user.username[0].toUpperCase()}</div>
            }
          </div>
        </Link>
        
        <div className="flex items-center gap-1.5 flex-1">
          <Link href={`/profil/${post.user.username}`} className="text-white font-semibold text-sm hover:text-amber-400 transition-colors">
            {post.user.displayName ?? post.user.username}
          </Link>
          {post.user.isVerified && <VerifiedBadge />}
          
          {/* Bouton Follow - s'affiche UNIQUEMENT si l'utilisateur ne suit PAS déjà */}
          {session?.user?.id !== post.user.id && !isFollowing && (
            <button
              onClick={handleFollow}
              disabled={followingLoading}
              className="ml-5 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-500 border border-amber-500 hover:bg-white/20 transition-all"
            >
              {followingLoading ? "..." : "Suivre"}
            </button>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <ReportButton type="post" id={post.id} variant="icon" />
        </div>
      </div>

      {/* ── Médias — ratio 4/5 pour tout ── */}
      {post.medias.length > 0 && current && (
        <Link href={`/post/${post.id}`}>
          <div className="relative overflow-hidden bg-black rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] aspect-[4/5] max-w-[420px]">
            {/* Post payant → afficher l'aperçu avec overlay */}
            {isPaid && post.previewUrl ? (
              <>
                {post.previewUrl.includes("/video/") || post.previewUrl.match(/\.(mp4|mov|webm)/) ? (
                  <video src={post.previewUrl} playsInline muted className="w-full h-full object-cover"/>
                ) : (
                  <img src={post.previewUrl} alt="" className="w-full h-full object-cover"/>
                )}
                <MediaWatermark postId={post.id}/>
                {/* Overlay payant */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-20">
                  <div className="bg-black/60 rounded-2xl px-5 py-4 flex flex-col items-center gap-3 border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-lg">💰</span>
                      <span className="text-white font-bold text-sm">{post.price?.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.preventDefault(); setShowPreview(true); }}
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        Aperçu
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); window.location.href = `/post/${post.id}`; }}
                        className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                        Déverrouiller
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {current.type === "VIDEO" ? (
                  <video key={current.url} src={current.url} playsInline muted className="w-full h-full object-cover"/>
                ) : (
                  <img src={current.url} alt={post.content} className="w-full h-full object-cover"/>
                )}
                <MediaWatermark postId={post.id}/>
              </>
            )}
            {/* Badge Réel — seulement si non payant */}
            {!isPaid && isReel && (
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="2"/>
                  <path d="M7 2v20M17 2v20M2 12h20"/>
                </svg>
                RÉEL
              </div>
            )}

            {/* Carousel controls */}
            {isCarousel && (
              <>
                {mediaIndex > 0 && (
                  <button
                    onClick={(e) => { e.preventDefault(); setMediaIndex((i) => i - 1); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                )}
                {mediaIndex < post.medias.length - 1 && (
                  <button
                    onClick={(e) => { e.preventDefault(); setMediaIndex((i) => i + 1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {post.medias.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); setMediaIndex(i); }}
                      className={`h-1.5 rounded-full transition-all ${i === mediaIndex ? "bg-white w-3" : "bg-white/40 w-1.5"}`}
                    />
                  ))}
                </div>
                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {mediaIndex + 1}/{post.medias.length}
                </div>
              </>
            )}
          </div>
        </Link>
      )}

      {/* Actions : réactions à gauche, bookmark à droite */}
      <div className="flex items-center justify-between mt-3 px-1 max-w-[380px]">
        {/* Groupe de boutons à gauche */}
        <div className="flex items-center gap-4">
          <button onClick={handleFire} className="flex items-center gap-1.5 hover:scale-110 transition-transform" title="J'adore">
            <span className={`text-lg leading-none transition-all duration-200 ${fired ? "" : "grayscale opacity-60"}`}>🔥</span>
            {fireCount > 0 && <span className="text-white/50 text-xs">{fireCount}</span>}
          </button>

          <button onClick={handleSparkle} className={`hover:scale-110 transition-all duration-200 ${sparked ? "text-amber-400" : "text-white/50 hover:text-white/80"}`} title="Incroyable">
            <IconSparkle />
          </button>

          <button onClick={handleIdea} className={`hover:scale-110 transition-all duration-200 ${idea ? "text-yellow-300" : "text-white/50 hover:text-white/80"}`} title="Inspirant">
            <IconIdea />
          </button>

          <button
            onClick={() => { setShowComments((v) => !v); setShowAll(false); }}
            className={`flex items-center gap-1.5 hover:scale-110 transition-all duration-200 ${showComments ? "text-violet-400" : "text-white/50 hover:text-white/80"}`}
          >
            <IconComment />
            {commentCount > 0 && <span className="text-xs">{commentCount}</span>}
          </button>

          <button onClick={handleShare} className={`hover:scale-110 transition-all duration-200 ${shared ? "text-green-400" : "text-white/50 hover:text-white/80"}`}>
            <IconShare />
          </button>
        </div>

        {/* Bouton sauvegarde à droite */}
        <div className="relative left-11">
          <button
            onClick={() => saved ? handleRemoveFromSaved() : handleSave()}
            disabled={savingLoading}
            title={saved ? "Retirer de ma liste" : "Sauvegarder"}
            className={`hover:scale-110 transition-all duration-200 ${
              saved ? "text-amber-400" : "text-white/50 hover:text-white/80"
            }`}
          >
            <IconBookmark filled={saved} />
          </button>

          {/* Menu des collections */}
          {showCollectionMenu && collections.length > 0 && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#2D1B3F] rounded-xl border border-white/10 shadow-xl py-2 z-50">
              <div className="px-3 py-2 text-white/50 text-xs border-b border-white/10">
                Choisir une collection
              </div>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleSelectCollection(collection.id)}
                  className="w-full text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm flex items-center justify-between"
                >
                  {collection.name}
                  {selectedCollection === collection.id && (
                    <span className="text-amber-400">✓</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => handleSelectCollection("")}
                className="w-full text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm border-t border-white/10"
              >
                Non classé
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      <div className="flex items-center flex-wrap gap-1.5 mt-2.5 px-1">
        <Link href={`/profil/${post.user.username}`} className="text-white font-bold text-sm hover:text-amber-400 transition-colors">
          {post.user.displayName ?? post.user.username}
        </Link>
        {post.user.isVerified && <VerifiedBadge size={14} />}
        <span className="text-white/70 text-sm">{post.content}</span>
      </div>

      {/* Commentaires */}
      {showComments && (
        <div className="mt-3 px-1">
          {loadingComments && <p className="text-white/30 text-xs mb-2 animate-pulse">Chargement...</p>}

          {!showAll && comments.length > 2 && (
            <button onClick={() => setShowAll(true)} className="text-white/40 text-xs hover:text-white/70 transition-colors mb-2 block">
              Voir les {comments.length} commentaires
            </button>
          )}

          <div className="flex flex-col gap-2.5 mb-3">
            {visibleComments.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 overflow-hidden flex-shrink-0 mt-0.5">
                  {c.user.avatar
                    ? <img src={c.user.avatar} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full bg-purple-500 flex items-center justify-center text-[10px] text-white font-bold">{c.user.username[0].toUpperCase()}</div>
                  }
                </div>
                <p className="text-xs leading-relaxed">
                  <Link href={`/profil/${c.user.username}`} className="text-white font-semibold hover:text-amber-400 transition-colors mr-1.5">
                    {c.user.username}
                  </Link>
                  <span className="text-white/70">{c.text}</span>
                </p>
              </div>
            ))}
            {!loadingComments && comments.length === 0 && (
              <p className="text-white/25 text-xs">Soyez le premier à commenter.</p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-white/8 pt-3">
            <input
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Ajouter un commentaire..."
              className="flex-1 bg-transparent text-white text-xs placeholder-white/25 outline-none"
            />
            <button 
              onClick={submitComment} 
              disabled={!commentText.trim() || submitting}
              className="text-amber-400 text-xs font-bold disabled:opacity-25 hover:text-amber-300 transition-colors"
            >
              Publier
            </button>
          </div>
        </div>
      )}

      {shared && <p className="text-green-400 text-xs px-1 mt-1">✓ Lien copié !</p>}

      {/* Modale aperçu */}
      {showPreview && post.previewUrl && (
        <>
          <div className="fixed inset-0 bg-black/90 z-[100]" onClick={() => setShowPreview(false)}/>
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="relative max-w-sm w-full bg-[#1E0A3C] rounded-2xl overflow-hidden border border-white/10">
              <div className="relative aspect-[4/5]">
                {post.previewUrl.match(/\.(mp4|mov|webm)/) || post.previewUrl.includes("/video/") ? (
                  <video src={post.previewUrl} controls className="w-full h-full object-cover"/>
                ) : (
                  <img src={post.previewUrl} alt="" className="w-full h-full object-cover" draggable={false} onContextMenu={(e) => e.preventDefault()}/>
                )}
                <MediaWatermark postId={post.id}/>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-white font-bold text-center">Aperçu — {post.price?.toLocaleString("fr-FR")} FCFA pour le contenu complet</p>
                <a href={`/post/${post.id}`}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                  🔓 Déverrouiller le contenu
                </a>
                <button onClick={() => setShowPreview(false)}
                  className="w-full text-white/40 hover:text-white text-sm transition-colors py-1">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}