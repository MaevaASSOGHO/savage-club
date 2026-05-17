// components/FeedInfiniteScroll.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "@/components/PostCard";

type FeedItem = {
  post: {
    id: string;
    content: string;
    createdAt: string;
    price?: number | null;
    previewUrl?: string | null;
    medias: { id: string; url: string; type: string; order: number }[];
    likes: { id: string }[];
    comments: { id: string }[];
    user: {
      id: string;
      username: string;
      displayName?: string | null;
      avatar: string | null;
      isVerified: boolean;
      subscriptionPrice?: number | null;
      subscriptionVIP?: number | null;
    };
  };
  initialData: {
    collections?: { id: string; name: string }[];
    saved?: boolean;
    collectionId?: string | null;
    fired?: boolean;
    sparked?: boolean;
    idea?: boolean;
    likeCount?: number;
    subscriptionTier?: "NONE" | "FREE" | "SAVAGE" | "VIP";
  };
};

type Props = {
  initialItems: FeedItem[];
  initialCursor: string | null;
  initialHasMore: boolean;
  feedType: "home" | "creators" | "formateurs";
  collections: { id: string; name: string }[];
};

export default function FeedInfiniteScroll({
  initialItems,
  initialCursor,
  initialHasMore,
  feedType,
  collections,
}: Props) {
  const [items, setItems]       = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor]     = useState<string | null>(initialCursor);
  const [hasMore, setHasMore]   = useState(initialHasMore);
  const [loading, setLoading]   = useState(false);
  const sentinelRef             = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);

    try {
      const res  = await fetch(`/api/posts/feed?type=${feedType}&cursor=${cursor}`);
      const data = await res.json();

      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, feedType]);

  // IntersectionObserver — déclenche loadMore quand le sentinel est visible
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" } // commence à charger 200px avant la fin
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="flex flex-col items-center w-full">
      {items.map(({ post, initialData }) => (
        <div key={post.id} className="w-full mb-4">
          <PostCard
            post={post}
            initialData={{ ...initialData, collections }}
          />
        </div>
      ))}

      {/* Sentinel — élément invisible en bas du feed */}
      <div ref={sentinelRef} className="w-full h-4" />

      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-white/20 text-xs text-center py-8">
          Tu as tout vu 👀
        </p>
      )}
    </div>
  );
}