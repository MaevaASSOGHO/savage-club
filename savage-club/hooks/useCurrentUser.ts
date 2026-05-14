// hooks/useCurrentUser.ts
"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";

type CurrentUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  role: string;
  isVerified: boolean;
} | null;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCurrentUser() {
  const { status } = useSession();

  const { data, isLoading } = useSWR(
    status === "authenticated" ? "/api/me" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    user: (data ?? null) as CurrentUser,
    loading: isLoading,
  };
}