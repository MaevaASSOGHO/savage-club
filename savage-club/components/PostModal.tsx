// components/PostModal.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Post {
  id: string;
  content: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    isVerified: boolean;
  };
  medias: Array<{
    id: string;
    url: string;
    type: string;
    order: number;
  }>;
  likes: Array<{ id: string }>;
  comments: Array<{ id: string }>;
  createdAt: Date;
}

interface Props {
  post: Post;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function PostModal({ post, onClose, onNext, onPrev, hasNext, hasPrev }: Props) {
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && onNext) {
        onNext();
      } else if (diff < 0 && onPrev) {
        onPrev();
      }
    }
    
    setTouchStart(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation flèches */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
        >
          ←
        </button>
      )}

      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
        >
          →
        </button>
      )}

      {/* Contenu du post */}
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-[#2D1B3F] rounded-2xl p-6 m-4">
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#C9A3FF] to-[#A37DFF] flex items-center justify-center text-white font-bold overflow-hidden">
              {post.user.avatar ? (
                <Image src={post.user.avatar} alt={post.user.username} width={48} height={48} className="object-cover" />
              ) : (
                <span className="text-lg">{post.user.displayName?.[0] || post.user.username[0]}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-lg">
                  {post.user.displayName || post.user.username}
                </span>
                {post.user.isVerified && (
                  <span className="text-[#C9A3FF]">✓</span>
                )}
              </div>
              <span className="text-white/40 text-sm">@{post.user.username}</span>
            </div>
          </div>

          {/* Médias */}
          {post.medias.length > 0 && (
            <div className="mb-4 space-y-2">
              {post.medias.map((media) => (
                <div key={media.id} className="relative rounded-xl overflow-hidden">
                  {media.type.startsWith("image/") ? (
                    <Image
                      src={media.url}
                      alt=""
                      width={800}
                      height={600}
                      className="w-full h-auto"
                    />
                  ) : (
                    <video
                      src={media.url}
                      controls
                      className="w-full"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Contenu */}
          <p className="text-white/90 mb-4 whitespace-pre-wrap text-lg">
            {post.content}
          </p>

          {/* Stats */}
          <div className="flex gap-6 text-white/40 border-t border-white/10 pt-4">
            <span className="flex items-center gap-2">
              <span>❤️</span> {post.likes.length} likes
            </span>
            <span className="flex items-center gap-2">
              <span>💬</span> {post.comments.length} commentaires
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}