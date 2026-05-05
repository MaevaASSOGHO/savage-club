// components/parametres/sections/SectionHistorique.tsx
"use client";

import { useEffect, useState } from "react";
import SectionTitle from "@/components/parametres/ui/SectionTitle";

type Payment = {
  id:          string;
  amount:      number;
  status:      string;
  type:        string;
  description: string | null;
  createdAt:   string;
  User_Payment_payerIdToUser:      { id: string; username: string; displayName: string | null; avatar: string | null };
  User_Payment_recipientIdToUser:  { id: string; username: string; displayName: string | null; avatar: string | null };
};

const TYPE_LABELS: Record<string, string> = {
  SUBSCRIPTION:   "Abonnement",
  MESSAGE:        "Contenu payant",
  AUDIO_CALL:     "Appel audio",
  VIDEO_CALL:     "Appel vidéo",
  CUSTOM_CONTENT: "Contenu personnalisé",
};

const TYPE_ICONS: Record<string, string> = {
  SUBSCRIPTION:   "💳",
  MESSAGE:        "🔓",
  AUDIO_CALL:     "📞",
  VIDEO_CALL:     "🎥",
  CUSTOM_CONTENT: "✨",
};

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "text-green-400",
  PENDING: "text-amber-400",
  FAILED:  "text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Confirmé",
  PENDING: "En attente",
  FAILED:  "Échoué",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function SectionHistorique() {
  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [cursor,     setCursor]     = useState<string | null>(null);
  const [hasMore,    setHasMore]    = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  async function fetchPayments(nextCursor?: string) {
    const params = new URLSearchParams({ type: "sent", limit: "15" });
    if (nextCursor) params.set("cursor", nextCursor);

    const res  = await fetch(`/api/payments?${params}`);
    const data = await res.json();
    return data;
  }

  useEffect(() => {
    fetchPayments()
      .then((data) => {
        setPayments(data.payments ?? []);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchPayments(cursor);
    setPayments((prev) => [...prev, ...(data.payments ?? [])]);
    setCursor(data.nextCursor);
    setHasMore(data.hasMore);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SectionTitle>Historique d'achats</SectionTitle>
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionTitle>Historique d'achats</SectionTitle>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <p className="text-white/25 text-sm">Aucun achat pour l'instant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments
            .filter((p) => p.status === "SUCCESS")
            .map((p) => {
              const recipient = p.User_Payment_recipientIdToUser;
              return (
                <div key={p.id} className="bg-white/5 border border-white/8 rounded-xl p-4 flex items-center gap-3">
                  {/* Icône */}
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
                    {TYPE_ICONS[p.type] ?? "💰"}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {TYPE_LABELS[p.type] ?? p.type}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5 truncate">
                      {recipient?.displayName ?? recipient?.username ?? "Créateur"}
                    </p>
                    <p className="text-white/20 text-xs mt-0.5">{formatDate(p.createdAt)}</p>
                  </div>

                  {/* Montant + statut */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-white font-bold text-sm">
                      -{p.amount.toLocaleString("fr-FR")} FCFA
                    </p>
                    <span className={`text-[10px] font-bold ${STATUS_COLORS[p.status] ?? "text-white/40"}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </div>
                </div>
              );
            })}

          {hasMore && (
            <button onClick={loadMore} disabled={loadingMore}
              className="w-full text-white/40 hover:text-white text-sm py-3 transition-colors disabled:opacity-30 flex items-center justify-center gap-2">
              {loadingMore ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Chargement...
                </>
              ) : "Voir plus"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
