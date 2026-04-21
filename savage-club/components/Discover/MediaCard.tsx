// components/Discover/MediaCard.tsx
"use client";

import Link from 'next/link';
import { useState } from 'react';

type MediaCardProps = {
  post: {
    id: string;
    medias: {
      id: string;
      url: string;
      type: string;
      order: number;
    }[];
    content?: string;
    likes: { id: string }[];
    comments: { id: string }[];
    user: {
      id: string;
      username: string;
      avatar: string | null;
      isVerified: boolean;
    };
    visibility: 'PUBLIC' | 'SUBSCRIBERS' | 'PAID';
  };
};

export default function MediaCard({ post }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const firstMedia = post.medias[0];
  const hasMultiple = post.medias.length > 1;

  if (!firstMedia) return null;

  return (
    <Link
      href={`/post/${post.id}`}
      className="relative aspect-square bg-white/5 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Média */}
      {firstMedia.type === 'VIDEO' ? (
        <video
          src={firstMedia.url}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onMouseEnter={(e) => {
            const v = e.currentTarget as HTMLVideoElement;
            v.play().catch(() => {});
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
          alt={post.content || ''}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      )}

      {/* Overlay hover avec likes et commentaires */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <span className="text-white text-xs font-bold">🔥 {post.likes.length}</span>
        <span className="text-white text-xs font-bold">💬 {post.comments.length}</span>
      </div>

      {/* Icône multiple médias */}
      {hasMultiple && (
        <div className="absolute top-2 right-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity="0.9">
            <rect x="7" y="3" width="14" height="14" rx="2"/>
            <path d="M3 7v11a2 2 0 002 2h11" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
        </div>
      )}

      {/* Icône vidéo seule */}
      {!hasMultiple && firstMedia.type === 'VIDEO' && (
        <div className="absolute top-2 right-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
      )}

      {/* Cadenas pour contenu payant */}
      {post.visibility === 'PAID' && (
        <div className="absolute top-2 left-2 bg-amber-400 rounded-full w-5 h-5 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="black">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
      )}

      {/* Info utilisateur en bas au survol */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-[#2A1356] flex-shrink-0">
            {post.user.avatar ? (
              <img 
                src={post.user.avatar} 
                alt={post.user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-[8px] font-bold">
                {post.user.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-white text-xs truncate">@{post.user.username}</span>
          {post.user.isVerified && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#3B82F6" className="flex-shrink-0">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
            </svg>
          )}
        </div>
      </div>
    </Link>
  );
}