// components/messages/useConversations.ts
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { Conversation, ConvType } from "./types";

export function useConversations(
  userId: string | undefined,
  status: string,
  isCreator: boolean
) {
  const searchParams = useSearchParams();

  const [activeTab,  setActiveTab]  = useState<ConvType | "ALL">(isCreator ? "SAVAGE" : "ALL");
  const [convos,     setConvos]     = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading,    setLoading]    = useState(true);

  // Ref pour éviter les doubles appels sur le query param
  const handledUsernameRef = useRef<string | null>(null);

  // ── Charger les conversations (par tab) ───────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    const q = activeTab === "ALL" ? "" : `?type=${activeTab}`;
    fetch(`/api/conversations${q}`)
      .then((r) => r.ok ? r.json() : { conversations: [] })
      .then((d) => setConvos(d.conversations ?? []))
      .catch(() => setConvos([]))
      .finally(() => setLoading(false));
  }, [status, activeTab]);

  // ── Ouvrir une conversation depuis ?user=username ──────────────
  // FIX : on utilise un ref pour s'assurer de n'appeler POST qu'une seule fois
  // même si le composant re-render plusieurs fois avec les mêmes searchParams
  useEffect(() => {
    const username = searchParams.get("user");

    // Conditions de déclenchement
    if (!username || !userId || status !== "authenticated") return;

    // Déjà traité ce username dans ce montage → ne pas rappeler
    if (handledUsernameRef.current === username) return;
    handledUsernameRef.current = username;

    let cancelled = false;

    async function openConversation() {
      // 1. Récupérer l'ID du destinataire
      const userRes = await fetch(`/api/users/${username}`);
      if (!userRes.ok || cancelled) return;
      const recipient = await userRes.json();
      if (!recipient?.id || cancelled) return;

      // 2. Créer ou trouver la conversation (idempotent côté API)
      const convRes = await fetch("/api/conversations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ recipientId: recipient.id }),
      });
      if (!convRes.ok || cancelled) return;
      const { conversationId } = await convRes.json();
      if (!conversationId || cancelled) return;

      // 3. Mettre à jour la liste des conversations et ouvrir la bonne
      // On merge plutôt que de recharger pour éviter une requête supplémentaire
      setConvos((prev) => {
        const exists = prev.find((c) => c.id === conversationId);
        if (exists) {
          // La conversation existe déjà dans la liste — juste l'ouvrir
          if (!cancelled) setActiveConv(exists);
          return prev;
        }
        // Pas encore dans la liste — recharger
        fetch("/api/conversations")
          .then((r) => r.ok ? r.json() : { conversations: [] })
          .then((d) => {
            if (cancelled) return;
            const list  = d.conversations ?? [];
            const found = list.find((c: Conversation) => c.id === conversationId);
            setConvos(list);
            if (found) setActiveConv(found);
          })
          .catch(() => {});
        return prev;
      });
    }

    openConversation().catch(() => {});
    return () => { cancelled = true; };
  }, [searchParams.get("user"), userId, status]);

  function handleDeleteConv(id: string) {
    setConvos((prev) => prev.filter((c) => c.id !== id));
    setActiveConv(null);
  }

  function updateConv(updated: Conversation) {
    setConvos((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    if (activeConv?.id === updated.id) setActiveConv(updated);
  }

  return {
    activeTab, setActiveTab,
    convos, setConvos,
    activeConv, setActiveConv,
    loading,
    handleDeleteConv,
    updateConv,
  };
}
