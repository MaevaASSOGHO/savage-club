// app/reels/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ID du reel à afficher en premier (passé via ?id=POST_ID depuis PostCard / MediaCard)
  const targetId = searchParams.get("id");

  const [reels, setReels]             = useState<Post[]>([]);
  const [loading, setLoading]         = useState(true);
  const [hasMore, setHasMore]         = useState(true);
  const [page, setPage]               = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);

  // true une fois le scroll deep-link effectué — évite de re-scroller si on charge plus de reels
  const [deepLinkDone, setDeepLinkDone] = useState(!targetId);

  const observerRef  = useRef<IntersectionObserver | null>(null);
  const lastReelRef  = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs    = useRef<Map<string, HTMLVideoElement>>(new Map());
  const loadingRef   = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  const fetchReels = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    try {
      loadingRef.current = true;
      setLoading(true);
      const res  = await fetch(`/api/reels?page=${pageNum}&limit=3`);
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

  useEffect(() => { fetchReels(1); }, [fetchReels]);

  // ── Deep link : scroller sur le reel ciblé dès qu'il apparaît dans la liste ──
  useEffect(() => {
    if (deepLinkDone || !targetId || reels.length === 0 || !containerRef.current) return;

    const index = reels.findIndex(r => r.id === targetId);
    if (index === -1) return; // pas encore chargé — on réessaiera au prochain batch

    const container  = containerRef.current;
    const itemHeight = container.clientHeight; // 100vh grâce au snap container fixed

    // Scroll instantané (pas d'animation pour ne pas perturber le snap)
    container.scrollTo({ top: index * itemHeight, behavior: "instant" });
    setActiveIndex(index);
    setDeepLinkDone(true);

    // Nettoyer l'URL sans recharger la page
    window.history.replaceState(null, "", window.location.pathname);
  }, [reels, targetId, deepLinkDone]);

  // ── Infinite scroll ──
  useEffect(() => {
    if (loading || !hasMore) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5, rootMargin: "100px" }
    );
    if (lastReelRef.current) observerRef.current.observe(lastReelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore]);

  useEffect(() => { if (page > 1) fetchReels(page); }, [page, fetchReels]);

  // ── Détection du reel visible + pause des autres ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      let maxVisibility    = 0;
      let mostVisibleIndex = activeIndex;

      reels.forEach((_, index) => {
        const element = document.getElementById(`reel-${index}`);
        if (!element) return;
        const rect          = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const visibleHeight =
          Math.min(rect.bottom, containerRect.bottom) -
          Math.max(rect.top,    containerRect.top);
        const visibility = visibleHeight / rect.height;

        if (visibility > maxVisibility) {
          maxVisibility    = visibility;
          mostVisibleIndex = index;
        }
      });

      if (mostVisibleIndex !== activeIndex) {
        videoRefs.current.get(`reel-${activeIndex}`)?.pause();
        setActiveIndex(mostVisibleIndex);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [reels, activeIndex]);

  // ── Lecture automatique du reel actif ──
  useEffect(() => {
    videoRefs.current.get(`reel-${activeIndex}`)?.play().catch(() => {});
    videoRefs.current.forEach((video, key) => {
      if (key !== `reel-${activeIndex}`) video.pause();
    });
  }, [activeIndex]);

  const setVideoRef = useCallback((index: number, element: HTMLVideoElement | null) => {
    if (element) videoRefs.current.set(`reel-${index}`, element);
    else         videoRefs.current.delete(`reel-${index}`);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <FeedLayout variant="dark" hideBackground={true}>
      <div className="fixed inset-0 bg-black -z-10" />

      <button
        onClick={() => router.back()}
        className="fixed top-20 left-4 z-50 text-white/30 hover:text-white/60 transition-colors w-10 h-10 rounded-full flex items-center justify-center"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>

      <h1 className="fixed top-4 left-1/2 -translate-x-1/2 z-50 text-white font-bold text-lg">
        Réels
      </h1>

      <div
        ref={containerRef}
        className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: "smooth" }}
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
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
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