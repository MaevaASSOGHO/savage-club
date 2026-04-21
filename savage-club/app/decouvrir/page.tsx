// app/decouvrir/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import MediaCard from '@/components/Discover/MediaCard';
import { useSession } from 'next-auth/react';
import Sidebar from "@/components/Sidebar";

type Media = {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  caption?: string;
  likes: { id: string }[];
  comments: { id: string }[];
  user: {
    id: string;
    username: string;
    avatar: string | null;
    isVerified: boolean;
  };
  visibility: 'PUBLIC' | 'SUBSCRIBERS' | 'PAID';
  medias: {
    id: string;
    url: string;
    type: string;
    order: number;
  }[];
};

export default function DecouvrirPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const fetchPosts = useCallback(async (pageNum: number) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/posts/discover?page=${pageNum}&limit=9`);
      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();

      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...data.posts.filter((p: Media) => !ids.has(p.id))];
        });
      }

      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);
  
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loading) {
      fetchPosts(page + 1);
    }
  }, [hasMore, loading, page, fetchPosts]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  return (
    <main className="flex min-h-screen bg-[#1a0533]">
        <Sidebar />
      <div className="container mx-auto px-4 py-6">
        {/* Header simple */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Découvrir</h1>
          <p className="text-white/40 text-sm">Explorez les dernières publications</p>
        </div>

        {/* Grille de médias */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => fetchPosts(1)}
              className="px-4 py-2 bg-[#2A1356] text-white rounded-lg hover:bg-[#3A2366] transition-colors text-sm"
            >
              Réessayer
            </button>
          </div>
        ) : posts.length === 0 && !loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-white/25 text-sm">Aucune publication pour le moment</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-0.5">
              {posts.map((post) => (
                <MediaCard key={post.id} post={post} />
              ))}
            </div>

            {/* Loader et observer */}
            <div ref={loadMoreRef} className="w-full py-8 flex justify-center">
              {loading && (
                <div className="flex items-center gap-2 text-white/40">
                  <svg className="animate-spin w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span className="text-xs">Chargement...</span>
                </div>
              )}
              
              {!hasMore && posts.length > 0 && (
                <p className="text-white/20 text-xs">
                  Vous avez vu toutes les publications
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}