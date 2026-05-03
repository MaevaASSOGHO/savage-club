// components/PostDetail.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedMedia from "@/components/ProtectedMedia";
import MediaWatermark from "@/components/MediaWatermark";
import ReportButton from "@/components/ReportButton";
import PaymentMethodSelector from "@/components/payments/PaymentMethodSelector";

type Media = { id: string; url: string; type: string; order: number };
type CommentUser = {
  id: string; username: string; displayName: string | null;
  avatar: string | null; isVerified: boolean;
};
type Comment = {
  id: string; text: string; createdAt: string;
  user: CommentUser;
};
type PostUser = {
  id: string; username: string; displayName: string | null;
  avatar: string | null; isVerified: boolean; role: string;
};
type Post = {
  id: string; content: string; createdAt: string;
  visibility: string;
  price?: number | null;
  previewUrl?: string | null;
  medias: Media[];
  user: PostUser;
  likes: { id: string; userId: string }[];
  comments: Comment[];
};

type Props = {
  post: Post;
  viewerLiked: boolean;
  viewerSaved: boolean;
  viewerId: string | null;
  postUnlocked: boolean;
};

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "maintenant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <span className="bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10" fill="none">
        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

// ── Partie gauche : média ─────────────────────────────────────────────────
function MediaPanel({ medias, postId }: { medias: Media[]; postId?: string }) {
  const [idx, setIdx] = useState(0);
  const current = medias[idx];
  
  if (!current) return null;

  const isReel = medias.length === 1 && current.type === "VIDEO";
  const isCarousel = medias.length > 1;

  return (
    <div className={`relative bg-black flex items-center justify-center
      w-full md:h-full
      ${isReel ? "aspect-[4/5] md:aspect-auto" : "aspect-square md:aspect-auto"}
    `}>
      
      {current.type === "VIDEO" ? (
        <video
          key={current.url}
          src={current.url}
          controls
          playsInline
          autoPlay
          className={`w-full h-full ${isReel ? "object-cover" : "object-contain"}`}
        />
      ) : (
        <img
          src={current.url}
          alt=""
          className="w-full h-full object-contain"
        />
      )}

      {/* ✅ SAFE WATERMARK */}
      {postId && <MediaWatermark postId={postId} />}    

      {isReel && (
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
          {idx > 0 && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          )}
          {idx < medias.length - 1 && (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          )}
          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {medias.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all ${i === idx ? "bg-white w-4 h-1.5" : "bg-white/50 w-1.5 h-1.5"}`}
              />
            ))}
          </div>
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            {idx + 1}/{medias.length}
          </div>
        </>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────
export default function PostDetail({ post, viewerLiked, viewerSaved, viewerId, postUnlocked }: Props) {
  const router = useRouter();
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState(false); // État pour le menu des options

  // États réactions
  const [liked, setLiked] = useState(viewerLiked);
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [saved, setSaved] = useState(viewerSaved);
  const [shared, setShared] = useState(false);

  // Commentaires
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Scroll vers le bas des commentaires au montage
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  // Fermer le menu des options
  const handleClickOutside = () => {
    setShowOptions(false);
  };

  async function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    await fetch(`/api/posts/${post.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "LIKE" }),
    });
  }

  async function handleSave() {
    setSaved((v) => !v);
    await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
  }

  async function handleShare() {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
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
      setCommentText("");
    }
    setSubmitting(false);
  }

  const isReel  = post.medias.length === 1 && post.medias[0]?.type === "VIDEO";
  const isOwner = viewerId === post.user.id;
  const isPaid  = !!(post.price && post.price > 0);
  // Déverrouillé si: pas payant, ou propriétaire, ou paiement confirmé
  const [unlocked, setUnlocked] = useState(!isPaid || isOwner || postUnlocked);
  const [showPayment,  setShowPayment]  = useState(false);

  return (
    <>
      {/* ── Desktop : layout 2 colonnes ── */}
      <div className="hidden md:flex w-full max-w-5xl mx-auto min-h-[80vh] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-white/8">

        {/* Colonne gauche — média */}
        <div className={`flex-shrink-0 bg-black flex items-center justify-center relative ${isReel ? "w-[380px]" : "w-[520px]"}`}>
          {unlocked ? (
            <MediaPanel medias={post.medias} postId={post.id} />
          ) : post.previewUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {post.previewUrl.includes("/video/") ? (
                <video src={post.previewUrl} controls playsInline className="w-full h-full object-contain"/>
              ) : (
                <img src={post.previewUrl} alt="" className="w-full h-full object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()}/>
              )}
              <MediaWatermark postId={post.id}/>
              {/* Overlay paiement */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 max-w-xs">
                  <div className="w-14 h-14 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold">Contenu payant</p>
                    <p className="text-white/40 text-sm mt-1">{post.price?.toLocaleString("fr-FR")} FCFA pour accéder au contenu complet</p>
                  </div>
                  <button onClick={() => setShowPayment(true)}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Déverrouiller
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/40">
              <span className="text-4xl">🔒</span>
              <p className="text-sm">Contenu payant</p>
              <button onClick={() => setShowPayment(true)}
                className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all">
                Payer {post.price?.toLocaleString("fr-FR")} FCFA
              </button>
            </div>
          )}
        </div>

        {/* Colonne droite — infos + commentaires */}
        <div className="flex-1 flex flex-col bg-[#1E0A3C] min-w-0 min-h-0">

          {/* Header avec menu options */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/8 flex-shrink-0">
            <Link href={`/profil/${post.user.username}`} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-amber-400/50 transition-all flex-shrink-0">
                {post.user.avatar
                  ? <img src={post.user.avatar} alt="" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">{post.user.username[0].toUpperCase()}</div>
                }
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">
                    {post.user.displayName ?? post.user.username}
                  </span>
                  {post.user.isVerified && <VerifiedBadge />}
                </div>
                <span className="text-white/30 text-xs">@{post.user.username}</span>
              </div>
            </Link>
            
            <div className="flex items-center gap-2">
              {/* Bouton options (menu ⋮) pour les publications qui ne sont pas les siennes */}
              {!isOwner && (
                <div className="relative">
                  <button 
                    onClick={() => setShowOptions((v) => !v)} 
                    className="text-white/40 hover:text-white p-1 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5"/>
                      <circle cx="12" cy="12" r="1.5"/>
                      <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                  
                  {showOptions && (
                    <>
                      {/* Overlay pour fermer en cliquant ailleurs */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={handleClickOutside}
                      />
                      
                      <div className="absolute right-0 top-8 bg-[#2A1356] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 w-44">
                        <button 
                          onClick={() => {
                            handleShare();
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                        >
                          <span>🔗</span>
                          Partager
                        </button>
                        
                        {/* Séparateur */}
                        <div className="border-t border-white/10"></div>
                        
                        {/* Bouton de signalement avec ReportButton */}
                        <div className="w-full">
                          <ReportButton 
                            type="post" 
                            id={post.id} 
                            variant="text"
                            className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <button
                onClick={() => router.back()}
                className="text-white/30 hover:text-white transition-colors p-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Caption */}
          {post.content && (
            <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {post.user.avatar
                    ? <img src={post.user.avatar} alt="" className="w-full h-full object-cover"/>
                    : <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">{post.user.username[0].toUpperCase()}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">
                    <Link href={`/profil/${post.user.username}`} className="text-white font-semibold hover:text-amber-400 transition-colors mr-1.5">
                      {post.user.displayName ?? post.user.username}
                    </Link>
                    <span className="text-white/70">{post.content}</span>
                  </p>
                  <span className="text-white/25 text-[11px] mt-1 block">{timeAgo(post.createdAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Commentaires — scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
            {comments.length === 0 && (
              <p className="text-white/20 text-sm text-center py-6">Aucun commentaire. Soyez le premier !</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 group">
                <Link href={`/profil/${c.user.username}`} className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    {c.user.avatar
                      ? <img src={c.user.avatar} alt="" className="w-full h-full object-cover"/>
                      : <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">{c.user.username[0].toUpperCase()}</div>
                    }
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="text-sm leading-relaxed flex-1">
                      <Link href={`/profil/${c.user.username}`} className="text-white font-semibold hover:text-amber-400 transition-colors mr-1.5">
                        {c.user.displayName ?? c.user.username}
                      </Link>
                      {c.user.isVerified && <VerifiedBadge size={12} />}
                      {" "}
                      <span className="text-white/70">{c.text}</span>
                    </p>
                    
                    {/* Bouton de signalement pour les commentaires (menu caché au hover) */}
                    {viewerId !== c.user.id && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <ReportButton 
                          type="comment" 
                          id={c.id} 
                          variant="icon"
                          className="text-white/30 hover:text-red-400"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-white/25 text-[11px]">{timeAgo(c.createdAt)}</span>
                    <button className="text-white/25 text-[11px] hover:text-white/60 transition-colors">Répondre</button>
                  </div>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* Actions + compteurs */}
          <div className="border-t border-white/8 flex-shrink-0">
            <div className="flex items-center gap-1 px-4 pt-3 pb-2">
              {/* Like */}
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 hover:scale-110 transition-transform mr-1"
              >
                <span className={`text-xl leading-none transition-all ${liked ? "" : "grayscale opacity-50"}`}>🔥</span>
              </button>

              {/* Commentaire */}
              <button
                onClick={() => document.getElementById("comment-input")?.focus()}
                className="text-white/50 hover:text-white transition-colors hover:scale-110"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </button>

              {/* Partager */}
              <button
                onClick={handleShare}
                className={`transition-all hover:scale-110 ml-1 ${shared ? "text-green-400" : "text-white/50 hover:text-white"}`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>

              {/* Bookmark — aligné à droite */}
              <button
                onClick={handleSave}
                className={`ml-auto transition-all hover:scale-110 ${saved ? "text-amber-400" : "text-white/50 hover:text-white"}`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                </svg>
              </button>
            </div>

            {/* Compteurs */}
            <div className="px-4 pb-2">
              {likeCount > 0 && (
                <p className="text-white font-semibold text-sm">{likeCount} j'aime</p>
              )}
              <p className="text-white/25 text-[11px] mt-0.5">{timeAgo(post.createdAt)}</p>
            </div>

            {/* Saisie commentaire */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-white/8">
              <input
                id="comment-input"
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                placeholder="Ajouter un commentaire..."
                className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none"
              />
              {commentText.trim() && (
                <button
                  onClick={submitComment}
                  disabled={submitting}
                  className="text-amber-400 text-sm font-bold hover:text-amber-300 disabled:opacity-40 transition-colors"
                >
                  Publier
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile : plein écran ── */}
      <div className="md:hidden flex flex-col w-full min-h-screen bg-black">

        {/* Header mobile avec menu options */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm z-10 flex-shrink-0">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          
          <Link href={`/profil/${post.user.username}`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              {post.user.avatar
                ? <img src={post.user.avatar} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">{post.user.username[0].toUpperCase()}</div>
              }
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white font-semibold text-sm">{post.user.displayName ?? post.user.username}</span>
              {post.user.isVerified && <VerifiedBadge size={13} />}
            </div>
          </Link>
          
          {/* Menu options mobile */}
          {!isOwner && (
            <div className="relative">
              <button 
                onClick={() => setShowOptions((v) => !v)} 
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5"/>
                  <circle cx="12" cy="12" r="1.5"/>
                  <circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>
              
              {showOptions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
                  <div className="absolute right-0 top-8 bg-[#2A1356] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 w-44">
                    <button 
                      onClick={() => {
                        handleShare();
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <span>🔗</span>
                      Partager
                    </button>
                    <div className="border-t border-white/10"></div>
                    <div className="w-full">
                      <ReportButton 
                        type="post" 
                        id={post.id} 
                        variant="text"
                        className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Média plein écran */}
        <div className="flex-shrink-0 relative">
          {unlocked ? (
            <MediaPanel medias={post.medias} postId={post.id} />
          ) : post.previewUrl ? (
            <div className="relative aspect-[4/5]">
              {post.previewUrl.includes("/video/") ? (
                <video src={post.previewUrl} playsInline muted className="w-full h-full object-cover"/>
              ) : (
                <img src={post.previewUrl} alt="" className="w-full h-full object-cover" draggable={false} onContextMenu={(e) => e.preventDefault()}/>
              )}
              <MediaWatermark postId={post.id}/>
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 mx-4">
                  <span className="text-3xl">🔒</span>
                  <p className="text-white font-bold text-sm text-center">{post.price?.toLocaleString("fr-FR")} FCFA</p>
                  <button onClick={() => setShowPayment(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all">
                    Déverrouiller
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-[4/5] flex items-center justify-center bg-black">
              <button onClick={() => setShowPayment(true)}
                className="bg-amber-400 text-black font-bold px-6 py-3 rounded-xl text-sm">
                Payer {post.price?.toLocaleString("fr-FR")} FCFA
              </button>
            </div>
          )}
        </div>

        {/* Actions mobile */}
        <div className="bg-black px-4 pt-3 pb-2 flex items-center gap-4 flex-shrink-0">
          <button onClick={handleLike} className="flex items-center gap-1.5 hover:scale-110 transition-transform">
            <span className={`text-2xl leading-none ${liked ? "" : "grayscale opacity-50"}`}>🔥</span>
          </button>
          <button
            onClick={() => document.getElementById("comment-input-mobile")?.focus()}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </button>
          <button
            onClick={handleShare}
            className={`transition-all ${shared ? "text-green-400" : "text-white/60 hover:text-white"}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
          <button
            onClick={handleSave}
            className={`ml-auto ${saved ? "text-amber-400" : "text-white/60 hover:text-white"} transition-all`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
        </div>

        {/* Compteur likes mobile */}
        <div className="bg-black px-4 pb-2 flex-shrink-0">
          {likeCount > 0 && <p className="text-white font-semibold text-sm">{likeCount} j'aime</p>}
        </div>

        {/* Caption mobile */}
        {post.content && (
          <div className="bg-black px-4 pb-3 flex-shrink-0">
            <p className="text-sm">
              <Link href={`/profil/${post.user.username}`} className="text-white font-semibold mr-1.5">
                {post.user.displayName ?? post.user.username}
              </Link>
              <span className="text-white/70">{post.content}</span>
            </p>
          </div>
        )}

        {/* Commentaires mobile — scrollable */}
        <div className="flex-1 overflow-y-auto bg-[#0d0020] px-4 py-3 space-y-4">
          {comments.length === 0 && (
            <p className="text-white/20 text-sm text-center py-4">Aucun commentaire.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3 group">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {c.user.avatar
                  ? <img src={c.user.avatar} alt="" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">{c.user.username[0].toUpperCase()}</div>
                }
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className="text-sm leading-relaxed flex-1">
                    <Link href={`/profil/${c.user.username}`} className="text-white font-semibold mr-1.5">
                      {c.user.displayName ?? c.user.username}
                    </Link>
                    <span className="text-white/70">{c.text}</span>
                  </p>
                  
                  {/* Bouton de signalement pour les commentaires mobile */}
                  {viewerId !== c.user.id && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <ReportButton 
                        type="comment" 
                        id={c.id} 
                        variant="icon"
                        className="text-white/30 hover:text-red-400"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/25 text-[11px]">{timeAgo(c.createdAt)}</span>
                  <button className="text-white/25 text-[11px] hover:text-white/60">Répondre</button>
                </div>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* Saisie commentaire mobile */}
        <div className="bg-[#0d0020] border-t border-white/8 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <input
            id="comment-input-mobile"
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder="Ajouter un commentaire..."
            className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none"
          />
          {commentText.trim() && (
            <button
              onClick={submitComment}
              disabled={submitting}
              className="text-amber-400 text-sm font-bold hover:text-amber-300 disabled:opacity-40"
            >
              Publier
            </button>
          )}
        </div>
      </div>
      {/* Sélecteur de paiement */}
      {showPayment && isPaid && !unlocked && (
        <PaymentMethodSelector
          amount={post.price!}
          label={`Déverrouiller le post — ${post.price?.toLocaleString("fr-FR")} FCFA`}
          onClose={() => setShowPayment(false)}
          mfPayload={{
            type:        "CUSTOM_CONTENT",
            recipientId: post.user.id,
            route:       "subscription",
            returnTo:    `/post/${post.id}`,
            extra: { postId: post.id },
          }}
          stripePayload={{
            type:        "CUSTOM_CONTENT",
            recipientId: post.user.id,
            description: `Post payant — ${post.user.displayName ?? post.user.username}`,
            returnTo:    `/post/${post.id}`,
          }}
        />
      )}
    </>
  );
}