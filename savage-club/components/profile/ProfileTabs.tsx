// components/profile/ProfileTabs.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Media = {
  id: string;
  url: string;
  type: string;
  order: number;
};

type Post = {
  id: string;
  content: string;
  medias: Media[];
  visibility: string;
  likes: { id: string }[];
  comments: { id: string }[];
  user: {
    id: string;
    username: string;
    avatar: string | null;
    isVerified: boolean;
  };
};

type Props = {
  posts: Post[];
  isOwner: boolean;
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

// ── Grille générique réutilisable ──────────────────────────────────────────
function PostGrid({ posts, emptyLabel }: { posts: Post[]; emptyLabel: string }) {
  if (posts.length === 0) {
    return (
      <p className="col-span-3 text-center text-white/25 text-sm py-10">{emptyLabel}</p>
    );
  }
  return (
    <>
      {posts.map((post) => {
        const firstMedia = post.medias[0];
        const hasMultiple = post.medias.length > 1;
        return (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="relative aspect-square bg-white/5 overflow-hidden group"
          >
            {firstMedia ? (
              firstMedia.type === "VIDEO" ? (
                <video
                  src={firstMedia.url}
                  className="w-full h-full object-cover"
                  muted playsInline preload="metadata"
                  onMouseEnter={(e) => {
                    const v = e.currentTarget as HTMLVideoElement;
                    v.play().catch(() => {});  // ← ignorer l'AbortError
                  }}
                  onMouseLeave={(e) => {
                    const v = e.currentTarget as HTMLVideoElement;
                    v.pause();
                    v.currentTime = 0;
                  }}
                />
              ) : (
                <img
                  src={firstMedia.url}
                  alt={post.content}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center p-3">
                <p className="text-white/40 text-xs text-center line-clamp-4">{post.content}</p>
              </div>
            )}

            {/* Overlay hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <span className="text-white text-xs font-bold">🔥 {post.likes.length}</span>
              <span className="text-white text-xs font-bold">💬 {post.comments.length}</span>
            </div>

            {/* Icône carousel */}
            {hasMultiple && (
              <div className="absolute top-2 right-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity="0.9">
                  <rect x="7" y="3" width="14" height="14" rx="2"/>
                  <path d="M3 7v11a2 2 0 002 2h11" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            )}

            {/* Icône vidéo seule */}
            {!hasMultiple && firstMedia?.type === "VIDEO" && (
              <div className="absolute top-2 right-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
            )}

            {/* Cadenas payant */}
            {post.visibility === "PAID" && (
              <div className="absolute top-2 left-2 bg-amber-400 rounded-full w-5 h-5 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="black">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
            )}
          </Link>
        );
      })}
    </>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
export default function ProfileTabs({ posts, isOwner }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  // Posts sauvegardés — chargés à la demande
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedLoaded, setSavedLoaded] = useState(false);

  // Charger les favoris quand l'onglet est ouvert (owner uniquement)
  useEffect(() => {
    if (activeTab !== "saved" || !isOwner || savedLoaded) return;
    setSavedLoading(true);
    fetch("/api/saved-posts")
      .then((r) => r.json())
      .then((data) => {
        setSavedPosts(Array.isArray(data) ? data : []);
        setSavedLoaded(true);
      })
      .catch(() => setSavedPosts([]))
      .finally(() => setSavedLoading(false));
  }, [activeTab, isOwner, savedLoaded]);

  // Filtres
  const gridPosts = posts.filter(
    (p) => isOwner || p.visibility === "PUBLIC" || p.visibility === "SUBSCRIBERS"
  );
  const reelPosts = posts.filter(
    (p) =>
      (isOwner || p.visibility !== "PAID") &&
      p.medias.length === 1 &&
      p.medias[0].type === "VIDEO"
  );
  const shopPosts = posts.filter((p) => p.visibility === "PAID");

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
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-white/15 hover:border-amber-400/40 rounded-xl py-4 mb-4 text-white/30 hover:text-amber-400/60 transition-all text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Créer un nouveau post
        </Link>
      )}

      {/* ── Grille Posts ── */}
      {activeTab === "posts" && (
        <div className="grid grid-cols-3 gap-0.5">
          <PostGrid posts={gridPosts} emptyLabel="Aucune publication." />
        </div>
      )}

      {/* ── Réels ── */}
      {activeTab === "reels" && (
        <div className="grid grid-cols-3 gap-0.5">
          {reelPosts.length === 0 && (
            <p className="col-span-3 text-center text-white/25 text-sm py-10">Aucun réel.</p>
          )}
          {reelPosts.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-[9/16] bg-white/5 overflow-hidden group">
              <video
                src={post.medias[0].url}
                className="w-full h-full object-cover"
                muted playsInline preload="metadata"
                onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center group-hover:opacity-0 transition-opacity">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
              {post.content && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs line-clamp-2">{post.content}</p>
                </div>
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-[10px] font-bold bg-black/40 px-1.5 py-0.5 rounded-full">🔥 {post.likes.length}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Favoris ── */}
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
              <PostGrid posts={savedPosts} emptyLabel="Aucun post sauvegardé." />
            </div>
          )}
        </>
      )}

      {/* ── Shop ── */}
      {activeTab === "shop" && (
        <div className="grid grid-cols-3 gap-0.5">
          {shopPosts.length === 0 && (
            <p className="col-span-3 text-center text-white/25 text-sm py-10">Aucun contenu payant.</p>
          )}
          {shopPosts.map((post) => {
            const firstMedia = post.medias[0];
            return (
              <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square bg-white/5 overflow-hidden group">
                {firstMedia ? (
                  firstMedia.type === "VIDEO" ? (
                    <video src={firstMedia.url} className="w-full h-full object-cover blur-sm" muted playsInline preload="metadata"/>
                  ) : (
                    <img src={firstMedia.url} alt="" className="w-full h-full object-cover blur-sm group-hover:scale-105 transition-transform duration-300"/>
                  )
                ) : (
                  <div className="w-full h-full bg-purple-900/30"/>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-amber-400 rounded-full w-8 h-8 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
