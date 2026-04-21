// components/parametres/sections/SectionCreateursSuivis.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SectionTitle from "@/components/parametres/ui/SectionTitle";

type FollowedUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  category: string | null;
  isVerified: boolean;
  role: string;
};

type Props = {
  role: "CREATOR" | "TRAINER";
};

const LABELS = {
  CREATOR: { title: "Créateurs suivis", empty: "Vous ne suivez aucun créateur.", icon: "🎨" },
  TRAINER: { title: "Formateurs suivis", empty: "Vous ne suivez aucun formateur.", icon: "🎓" },
};

export default function SectionSuivis({ role }: Props) {
  const [users, setUsers] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const config = LABELS[role];

  useEffect(() => {
    fetch(`/api/me/following?role=${role}`)
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [role]);

  async function handleUnfollow(userId: string) {
    await fetch(`/api/follow/${userId}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  return (
    <div className="space-y-5">
      <SectionTitle>{config.title}</SectionTitle>
      <p className="text-white/40 text-sm">
        {role === "CREATOR" ? "Les créateurs que vous suivez." : "Les formateurs que vous suivez."}
      </p>

      {loading && (
        <div className="flex justify-center py-10">
          <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-3">
          <span className="text-3xl">{config.icon}</span>
          <p className="text-white/30 text-sm">{config.empty}</p>
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl p-3">
            <Link href={`/profil/${user.username}`} className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-700">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                      {user.username[0].toUpperCase()}
                    </div>
                }
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={`/profil/${user.username}`} className="text-white font-semibold text-sm hover:text-amber-400 transition-colors truncate">
                  {user.displayName ?? user.username}
                </Link>
                {user.isVerified && (
                  <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-white/30 text-xs">@{user.username}</p>
              {user.category && <p className="text-white/20 text-xs">{user.category}</p>}
            </div>

            <button
              onClick={() => handleUnfollow(user.id)}
              className="flex-shrink-0 text-xs text-white/30 hover:text-red-400 border border-white/10 hover:border-red-400/30 px-3 py-1.5 rounded-lg transition-all"
            >
              Ne plus suivre
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
