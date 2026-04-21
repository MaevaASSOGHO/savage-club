// hooks/useCurrentUser.ts
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type CurrentUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  role: string;
  isVerified: boolean;
} | null;

export function useCurrentUser() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      setUser(null);
      setLoading(false);
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [status]);

  return { user, loading };
}
