// hooks/useFollowActions.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useFollowActions() {
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: async ({ userId, isFollowing }: any) => {
      return fetch(`/api/follow/${userId}`, {
        method: isFollowing ? "DELETE" : "POST",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follows"] });
    },
  });

  return { toggle };
}