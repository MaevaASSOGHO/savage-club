// app/reels/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReelCard from "@/components/reels/ReelCard";
import FeedLayout from "@/components/FeedLayout";

type Post = {
  id: string;
  content: string | null;
  medias: {
    id: string;
    url: string;
    type: "IMAGE" | "VIDEO";
    order: number;
  }[];
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

export default function ReelsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastReelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const loadingRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const fetchReels = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      const res = await fetch(`/api/reels?page=${pageNum}&limit=3`);
      const data = await res.json();
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setReels(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newReels = data.filter((reel: Post) => !existingIds.has(reel.id));
          return [...prev, ...newReels];
        });
      }
    } catch (error) {
      console.error("Erreur chargement reels:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchReels(1);
  }, [fetchReels]);

  useEffect(() => {
    if (loading || !hasMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5, rootMargin: "100px" }
    );

    if (lastReelRef.current) {
      observerRef.current.observe(lastReelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loading, hasMore]);

  useEffect(() => {
    if (page > 1) {
      fetchReels(page);
    }
  }, [page, fetchReels]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      let maxVisibility = 0;
      let mostVisibleIndex = activeIndex;

      reels.forEach((_, index) => {
        const element = document.getElementById(`reel-${index}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const visibleHeight = Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top);
          const visibility = visibleHeight / rect.height;

          if (visibility > maxVisibility) {
            maxVisibility = visibility;
            mostVisibleIndex = index;
          }
        }
      });

      if (mostVisibleIndex !== activeIndex) {
        setActiveIndex(mostVisibleIndex);
        
        const prevVideo = videoRefs.current.get(`reel-${activeIndex}`);
        if (prevVideo) {
          prevVideo.pause();
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [reels, activeIndex]);

  useEffect(() => {
    const currentVideo = videoRefs.current.get(`reel-${activeIndex}`);
    if (currentVideo) {
      currentVideo.play().catch(() => {});
    }

    videoRefs.current.forEach((video, key) => {
      if (key !== `reel-${activeIndex}`) {
        video.pause();
      }
    });
  }, [activeIndex]);

  const setVideoRef = useCallback((index: number, element: HTMLVideoElement | null) => {
    if (element) {
      videoRefs.current.set(`reel-${index}`, element);
    } else {
      videoRefs.current.delete(`reel-${index}`);
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <FeedLayout variant="dark" hideBackground={true}>
      {/* Fond noir fixe */}
      <div className="fixed inset-0 bg-black -z-10" />
      
      {/* Bouton retour */}
      <button
        onClick={() => router.back()}
        className="fixed top-4 left-4 z-50 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>

      {/* Titre Réels */}
      <h1 className="fixed top-4 left-1/2 -translate-x-1/2 z-50 text-white font-bold text-lg">
        Réels
      </h1>

      <div
        ref={containerRef}
        className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {reels.map((reel, index) => (
          <div
            key={`${reel.id}-${index}`}
            id={`reel-${index}`}
            ref={index === reels.length - 1 ? lastReelRef : null}
            className="h-screen snap-start snap-always relative bg-black"
          >
            <ReelCard
              post={reel as any}
              isActive={index === activeIndex}
              setVideoRef={(el: HTMLVideoElement | null) => setVideoRef(index, el)}
            />
          </div>
        ))}

        {loading && (
          <div className="h-screen flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!hasMore && reels.length > 0 && (
          <div className="h-screen flex items-center justify-center bg-black">
            <p className="text-white/40 text-sm">Fin des réels</p>
          </div>
        )}
      </div>
    </FeedLayout>
  );
}