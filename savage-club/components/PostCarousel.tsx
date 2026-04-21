// components/PostCarousel.tsx
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
  posts: Post[];
  initialIndex: number;
  onClose: () => void;
  collections?: Array<{ id: string; name: string }>;
  onMoveToCollection?: (postId: string, collectionId: string) => void;
}

export default function PostCarousel({ 
  posts, 
  initialIndex, 
  onClose,
  collections = [],
  onMoveToCollection 
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const currentPost = posts[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < posts.length - 1 ? prev + 1 : prev));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
    
    setTouchStart(null);
  };

  // Gestion des touches clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Bouton menu pour déplacer vers collection */}
      {collections.length > 0 && (
        <div className="absolute top-4 right-16 z-10">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-4 py-2 bg-[#2D1B3F] text-white rounded-xl hover:bg-[#3D2B4F] transition-colors"
          >
            Déplacer vers...
          </button>
          
          {showMenu && (
            <div className="absolute top-12 right-0 bg-[#2D1B3F] rounded-xl border border-white/10 py-2 min-w-[200px]">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => {
                    onMoveToCollection?.(currentPost.id, collection.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {collection.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteneur principal avec swipe */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Flèche gauche */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl"
          >
            ←
          </button>
        )}

        {/* Post actuel */}
        <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4">
          <div className="bg-[#2D1B3F] rounded-2xl p-6">
            {/* En-tête du post */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#C9A3FF] to-[#A37DFF] flex items-center justify-center text-white font-bold">
                {currentPost.user.avatar ? (
                  <Image 
                    src={currentPost.user.avatar} 
                    alt={currentPost.user.username} 
                    width={40} 
                    height={40} 
                    className="rounded-full object-cover"
                  />
                ) : (
                  currentPost.user.displayName?.[0] || currentPost.user.username[0]
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{currentPost.user.displayName || currentPost.user.username}</span>
                  {currentPost.user.isVerified && (
                    <span className="text-[#C9A3FF] text-xs">✓</span>
                  )}
                </div>
                <span className="text-white/40 text-xs">@{currentPost.user.username}</span>
              </div>
            </div>

            {/* Médias */}
            {currentPost.medias.length > 0 && (
              <div className="mb-4">
                {currentPost.medias.map((media) => (
                  media.type.startsWith("image/") ? (
                    <Image
                      key={media.id}
                      src={media.url}
                      alt=""
                      width={600}
                      height={400}
                      className="rounded-xl w-full h-auto"
                    />
                  ) : (
                    <video
                      key={media.id}
                      src={media.url}
                      controls
                      className="rounded-xl w-full"
                    />
                  )
                ))}
              </div>
            )}

            {/* Contenu */}
            <p className="text-white/90 mb-4 whitespace-pre-wrap">{currentPost.content}</p>

            {/* Stats */}
            <div className="flex gap-4 text-white/40 text-sm">
              <span>{currentPost.likes.length} likes</span>
              <span>{currentPost.comments.length} commentaires</span>
            </div>
          </div>
        </div>

        {/* Flèche droite */}
        {currentIndex < posts.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl"
          >
            →
          </button>
        )}
      </div>

      {/* Indicateur de progression */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {posts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-[#C9A3FF] w-4"
                : "bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}