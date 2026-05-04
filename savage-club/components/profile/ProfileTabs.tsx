// components/profile/ProfileTabs.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

type Media = { id: string; url: string; type: string; order: number };

type Post = {
  id:          string;
  content:     string;
  medias:      Media[];
  visibility:  string;
  price?:      number | null;
  previewUrl?: string | null;
  likes:       { id: string }[];
  comments:    { id: string }[];
  locked?:     boolean;
};

type Props = {
  username:    string;
  isOwner:     boolean;
  viewerTier?: "NONE" | "FREE" | "SAVAGE" | "VIP";
};

type Tab = "posts" | "reels" | "saved" | "shop";

const TABS: { key: Tab; icon: React.ReactNode }[] = [
  {
    key: "posts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    key: "reels",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="2"/>
        <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>
      </svg>
    ),
  },
  {
    key: "saved",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    key: "shop",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
      </svg>
    ),
  },
];

// ── Grille de posts ────────────────────────────────────────────────────────
function PostGrid({
  posts, isOwner, isSubscriber, loading, sentinelRef,
}: {
  posts:       Post[];
  isOwner:     boolean;
  isSubscriber: boolean;
  loading:     boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!loading && posts.length === 0) {
    return (
      <p className="col-span-3 text-center text-white/25 text-sm py-10">Aucune publication.</p>
    );
  }

  return (
    <>
      {posts.map((post) => {
        const firstMedia   = post.medias[0];
        const hasMultiple  = post.medias.length > 1;
        const isPaid       = !!(post.price && post.price > 0);
        const isSubscriberOnly = post.visibility === "SUBSCRIBERS" && !isPaid;
        const isLocked = post.locked || (!isOwner && isSubscriberOnly && !isSubscriber);

        const mediaToShow  = isPaid && post.previewUrl
          ? { url: post.previewUrl, type: post.previewUrl.includes("/video/") ? "VIDEO" : "IMAGE" }
          : firstMedia; // toujours afficher, blur géré par CSS

        return (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="relative aspect-square bg-white/5 overflow-hidden group"
          >
            {mediaToShow ? (
              mediaToShow.type === "VIDEO" ? (
                <video
                  src={mediaToShow.url}
                  className={`w-full h-full object-cover transition-all ${isLocked ? "blur-md scale-105" : ""}`}
                  muted playsInline preload="metadata"
                  onMouseEnter={(e) => { if (!isLocked) (e.currentTarget as HTMLVideoElement).play().catch(() => {}); }}
                  onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                />
              ) : (
                <img
                  src={mediaToShow.url}
                  alt={post.content}
                  className={`w-full h-full object-cover transition-all ${isLocked ? "blur-md scale-105" : "group-hover:scale-105"} duration-300`}
                />
              )
            ) : (
              <div className={`w-full h-full flex items-center justify-center p-3 ${isLocked ? "blur-md" : ""}`}>
                <p className="text-white/40 text-xs text-center line-clamp-4">{post.content}</p>
              </div>
            )}

            {/* Overlay abonnés */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <p className="text-white text-[10px] font-bold text-center px-2">Abonnés uniquement</p>
              </div>
            )}

            {/* Overlay payant */}
            {isPaid && !isOwner && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5">
                <div className="bg-amber-400 rounded-full w-7 h-7 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="black">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>
                <p className="text-amber-400 text-[10px] font-bold">{post.price?.toLocaleString("fr-FR")} FCFA</p>
                <p className="text-white/60 text-[9px]">Appuyer pour déverrouiller</p>
              </div>
            )}

            {/* Overlay hover normal */}
            {!isLocked && !isPaid && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <span className="text-white text-xs font-bold">🔥 {post.likes.length}</span>
                <span className="text-white text-xs font-bold">💬 {post.comments.length}</span>
              </div>
            )}

            {/* Icônes */}
            {hasMultiple && !isLocked && !isPaid && (
              <div className="absolute top-2 right-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity="0.9">
                  <rect x="7" y="3" width="14" height="14" rx="2"/>
                  <path d="M3 7v11a2 2 0 002 2h11" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            )}
            {!hasMultiple && firstMedia?.type === "VIDEO" && !isLocked && !isPaid && (
              <div className="absolute top-2 right-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
            )}
          </Link>
        );
      })}

      {/* Skeleton loading */}
      {loading && Array.from({ length: 6 }).map((_, i) => (
        <div key={`skeleton-${i}`} className="aspect-square bg-white/5 animate-pulse"/>
      ))}

      {/* Sentinel pour IntersectionObserver */}
      <div ref={sentinelRef} className="col-span-3 h-4"/>
    </>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
export default function ProfileTabs({ username, isOwner, viewerTier = "NONE" }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const isSubscriber = viewerTier === "SAVAGE" || viewerTier === "VIP";

  // État par onglet
  const [posts,      setPosts]      = useState<Post[]>([]);
  const [cursor,     setCursor]     = useState<string | null>(null);
  const [hasMore,    setHasMore]    = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedLoaded,  setSavedLoaded]  = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchPosts = useCallback(async (tab: Tab, currentCursor: string | null, reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);

    const params = new URLSearchParams({ tab });
    if (currentCursor) params.set("cursor", currentCursor);

    const res  = await fetch(`/api/profil/${username}/posts?${params}`);
    const data = await res.json();

    setPosts((prev) => reset ? data.posts : [...prev, ...data.posts]);
    setCursor(data.nextCursor);
    setHasMore(data.hasMore);
    setLoading(false);
  }, [username, loading, hasMore]);

  // Charger au changement d'onglet
  useEffect(() => {
    if (activeTab === "saved") return;
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    fetchPosts(activeTab, null, true);
  }, [activeTab]);

  // IntersectionObserver pour scroll infini
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(activeTab, cursor);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, cursor, activeTab]);

  // Charger les favoris
  useEffect(() => {
    if (activeTab !== "saved" || !isOwner || savedLoaded) return;
    setSavedLoading(true);
    fetch("/api/saved-posts")
      .then((r) => r.json())
      .then((data) => { setSavedPosts(Array.isArray(data) ? data : []); setSavedLoaded(true); })
      .catch(() => setSavedPosts([]))
      .finally(() => setSavedLoading(false));
  }, [activeTab, isOwner, savedLoaded]);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-white/10 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center py-3 transition-all ${
              activeTab === tab.key
                ? "text-white border-b-2 border-amber-400 -mb-px"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Bouton créer */}
      {isOwner && activeTab === "posts" && (
        <Link href="/create"
          className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-white/15 hover:border-amber-400/40 rounded-xl py-4 mb-4 text-white/30 hover:text-amber-400/60 transition-all text-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Créer un nouveau post
        </Link>
      )}

      {/* Posts & Réels & Shop */}
      {activeTab !== "saved" && (
        <div className="grid grid-cols-3 gap-0.5">
          <PostGrid
            posts={posts}
            isOwner={isOwner}
            isSubscriber={isSubscriber}
            loading={loading}
            sentinelRef={sentinelRef}
          />
        </div>
      )}

      {/* Favoris */}
      {activeTab === "saved" && (
        <>
          {!isOwner ? (
            <p className="text-center text-white/25 text-sm py-10">Section privée.</p>
          ) : savedLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {savedPosts.length === 0 ? (
                <p className="col-span-3 text-center text-white/25 text-sm py-10">Aucun post sauvegardé.</p>
              ) : savedPosts.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square bg-white/5 overflow-hidden group">
                  {post.medias[0] ? (
                    post.medias[0].type === "VIDEO" ? (
                      <video src={post.medias[0].url} className="w-full h-full object-cover" muted playsInline preload="metadata"/>
                    ) : (
                      <img src={post.medias[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3">
                      <p className="text-white/40 text-xs text-center line-clamp-4">{post.content}</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <span className="text-white text-xs font-bold">🔥 {post.likes.length}</span>
                    <span className="text-white text-xs font-bold">💬 {post.comments.length}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
