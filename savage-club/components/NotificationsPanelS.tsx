// components/NotificationsPanel.tsx
"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    username: string;
    avatar: string | null;
  } | null;
  post: {
    id: string;
    medias: { url: string; type: string }[];
    content: string;
  } | null;
};

type NotificationsResponse = {
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  LIKE:              "a aimé votre publication",
  COMMENT:           "a commenté votre publication",
  MENTION:           "vous a mentionné",
  FOLLOW:            "a commencé à vous suivre",
  BOOKING:           "a demandé un appel avec vous",
  BOOKING_CONFIRMED: "a confirmé votre réservation",
};

const TYPE_ICON: Record<string, string> = {
  LIKE:              "🔥",
  COMMENT:           "💬",
  MENTION:           "@",
  FOLLOW:            "👤",
  BOOKING:           "📅",
  BOOKING_CONFIRMED: "✅",
};

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "maintenant";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchNotifications();
  }, [status]);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Charger les notifications initiales
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (cursor?: string) => {
    try {
      if (!cursor) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const url = cursor 
        ? `/api/notifications?cursor=${cursor}` 
        : "/api/notifications";
      
      const res = await fetch(url);
      const data: NotificationsResponse = await res.json();
      
      if (cursor) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Marquer comme lues à l'ouverture
  useEffect(() => {
    const markAsRead = async () => {
      if (markingAsRead || notifications.length === 0) return;
      
      const hasUnread = notifications.some(n => !n.isRead);
      if (!hasUnread) return;
      
      setMarkingAsRead(true);
      
      try {
        // Mise à jour optimiste de l'UI
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );

        await fetch("/api/notifications/read-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        window.dispatchEvent(new CustomEvent('notifications-read'));
      } catch (error) {
        console.error("Erreur marquage notifications:", error);
        // Recharger en cas d'erreur
        fetchNotifications();
      } finally {
        setMarkingAsRead(false);
      }
    };

    if (!loading) {
      markAsRead();
    }
  }, [loading, notifications.length]);

  // Intersection Observer pour l'infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        if (nextCursor) {
          fetchNotifications(nextCursor);
        }
      }
    }, { threshold: 0.5 });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, nextCursor]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      {/* Overlay transparent pour fermer en cliquant dehors */}
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed left-[130px] top-0 h-full w-[380px] bg-[#1E0A3C] border-r border-white/10 z-40 flex flex-col shadow-2xl animate-slideIn">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-base">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
            {markingAsRead && (
              <svg className="animate-spin w-3 h-3 text-amber-400 ml-1" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Liste avec infinite scroll */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-3xl">🔔</span>
              <p className="text-white/30 text-sm">Aucune notification</p>
              <p className="text-white/20 text-xs">Les notifications apparaîtront ici</p>
            </div>
          )}

          <div className="flex flex-col">
            {notifications.map((notif, index) => (
              <Link
                key={notif.id}
                href={notif.post ? `/post/${notif.post.id}` : notif.sender ? `/profil/${notif.sender.username}` : "#"}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                  !notif.isRead ? "bg-amber-400/5" : ""
                }`}
              >
                {/* Avatar + icône type */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-700">
                    {notif.sender?.avatar ? (
                      <img src={notif.sender.avatar} alt="" className="w-full h-full object-cover"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                        {notif.sender?.username?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1E0A3C] rounded-full flex items-center justify-center text-xs">
                    {TYPE_ICON[notif.type] ?? "•"}
                  </div>
                </div>

                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm leading-relaxed line-clamp-2">
                    <span className="font-semibold text-white">{notif.sender?.username ?? "Quelqu'un"}</span>
                    {" "}{TYPE_LABEL[notif.type] ?? "a interagi avec vous"}
                  </p>
                  <p className="text-white/40 text-xs mt-1">{timeAgo(notif.createdAt)}</p>
                </div>

                {/* Miniature post */}
                {notif.post?.medias?.[0] && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                    {notif.post.medias[0].type === "VIDEO" ? (
                      <video src={notif.post.medias[0].url} className="w-full h-full object-cover" muted/>
                    ) : (
                      <img src={notif.post.medias[0].url} alt="" className="w-full h-full object-cover"/>
                    )}
                  </div>
                )}

                {/* Dot non lu */}
                {!notif.isRead && (
                  <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0"/>
                )}
              </Link>
            ))}
          </div>

          {/* Loader pour pagination */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {loadingMore ? (
                <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <span className="text-white/20 text-xs">Chargez plus...</span>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}