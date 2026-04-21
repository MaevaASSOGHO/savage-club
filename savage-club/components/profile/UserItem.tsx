// components/profile/UserItem.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type UserItemProps = {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    isVerified: boolean;
  };
};

// Petit composant VerifiedBadge simple
function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <span className="bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10" fill="none">
        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

export default function UserItem({ user }: UserItemProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Vérifier si l'utilisateur suit déjà
  useEffect(() => {
    if (!session?.user?.id) return;

    const checkFollow = async () => {
      try {
        const res = await fetch(`/api/follow/status?userId=${user.id}`);
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      } catch (error) {
        console.error("Erreur vérification follow:", error);
      }
    };
    checkFollow();
  }, [session, user.id]);

  // Fonction pour suivre/désuivre
  async function handleFollow() {
    if (!session) return;
    setFollowingLoading(true);

    try {
      const res = await fetch(`/api/follow/${user.id}`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error("Erreur follow:", error);
    } finally {
      setFollowingLoading(false);
    }
  }

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="flex items-center justify-between w-full">
      {/* Infos utilisateur */}
      <Link href={`/profil/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
              {user.username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-sm font-medium truncate">
              {user.displayName || user.username}
            </span>
            {user.isVerified && <VerifiedBadge size={14} />}
          </div>
          <span className="text-white/40 text-xs">@{user.username}</span>
        </div>
      </Link>

      {/* Bouton Follow - comme dans ReelCard */}
      {!isOwnProfile && !isFollowing && (
  <button
    onClick={handleFollow}
    disabled={followingLoading}
    className="px-3 py-1.5 rounded-full text-xs font-bold text-amber-500 border border-amber-500 hover:bg-white/20 transition-all"
  >
    {followingLoading ? "..." : "Suivre"}
  </button>
)}
    </div>
  );
}