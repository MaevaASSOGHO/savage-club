// components/profile/FollowModal.tsx

"use client";

import { useState } from "react";
import { useFollows } from "@/hooks/useFollows";
import UserItem from "./UserItem";

export default function FollowModal({ type, username, onClose }: any) {
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useFollows(type, username);

  const filtered = users.filter((u: any) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const uniqueUsers = Array.from(
    new Map(filtered.map((u: any) => [u.id, u])).values()
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center">
      <div className="bg-[#1E0A3C]  w-full max-w-md rounded-2xl p-4">

        <div className="flex justify-between mb-4">
          <h2 className="text-white font-bold">
            {type === "followers" ? "Abonnés" : "Abonnements"}
          </h2>
          <button onClick={onClose}>✕</button>
        </div>

        <input
          className="w-full mb-4 p-2 rounded bg-white/10 text-white"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {isLoading && <p className="text-white/50">Chargement...</p>}

          {uniqueUsers.map((user: any) => (
            <UserItem key={user.id} user={user} />
           ))}
           
          {uniqueUsers.length === 0 && !isLoading && (
            <p className="text-white/50">Aucun utilisateur trouvé.</p>
          )}
        </div>

      </div>
    </div>
  );
}