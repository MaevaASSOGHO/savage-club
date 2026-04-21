// hooks/useFollows.ts

"use client";

import { useQuery } from "@tanstack/react-query";

export function useFollows(type: "followers" | "following", username: string) {
  return useQuery({
    queryKey: ["follows", type, username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/${type}`);
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });
}