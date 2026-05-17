// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState, useEffect } from "react";
import {
  Book,
  Bell,
  MessageCircle,
  Star,
  Sparkles,
  Film,
  Bookmark,
  Settings,
  LogOut,
} from "lucide-react";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getAblyClient } from "@/lib/pusher-client";


const menuItems = [
  { name: "Créateurs",     icon: Star,          href: "/creators" },
  { name: "Formateurs",    icon: Book,           href: "/formateurs" },
  { name: "Réels",         icon: Film,           href: "/reels" },
  { name: "Mes favoris",   icon: Bookmark,       href: "/ma-liste" },
  { name: "Découvrir",     icon: Sparkles,       href: "/decouvrir" },
  { name: "Notifications", icon: Bell,           action: "notif" as const },
  { name: "Messages",      icon: MessageCircle,  href: "/messages", action: "message" as const },
];

export default function Sidebar() {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();

  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Détecter mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch initial des compteurs + listener "notifications-read"
  useEffect(() => {
    if (!user) return;

    Promise.all([
      fetch("/api/notifications/unread-count").then(r => r.json()),
      fetch("/api/conversations").then(r => r.json()),
    ]).then(([notifs, convs]) => {
      setNotifCount(notifs.count ?? 0);
      const conversations = Array.isArray(convs)
        ? convs
        : convs?.conversations ?? convs?.data ?? [];
      setMessageCount(
        conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0)
      );
    }).catch(() => {});

    const handleNotificationsRead = () => setNotifCount(0);
    window.addEventListener("notifications-read", handleNotificationsRead);
    return () => window.removeEventListener("notifications-read", handleNotificationsRead);
  }, [user]);

  // Ably — mises à jour temps réel, zéro polling
  useEffect(() => {
    if (!user) return;

    const ably = getAblyClient();
    if (!ably) return; // SSR

    const channel = ably.channels.get(`private-user-${user.id}`);

    channel.subscribe("new-message", (msg) => {
      setMessageCount(msg.data.unreadCount);
    });

    channel.subscribe("new-notification", (msg) => {
      setNotifCount(msg.data.count);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const handleNavigation = (href?: string, action?: "notif" | "message") => {
    if (action === "notif") {
      setNotifOpen(true);
      return;
    }
    if (action === "message") {
      setMessageCount(0);
      if (href) router.push(href);
      return;
    }
    if (href) router.push(href);
  };

  // Retourner null APRÈS tous les hooks
  if (!user || isMobile) return null;

  const userInitial = user.username?.[0]?.toUpperCase() || "?";

  return (
    <>
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed left-0 top-0 h-screen z-50
          transition-all duration-300 ease-in-out
          bg-[#1a0533]/95 backdrop-blur-xl
          border-r border-white/10
          overflow-hidden flex flex-col
          ${isHovered ? "w-[220px]" : "w-[80px]"}
        `}
      >
        <div className="flex flex-col justify-between h-full py-6">

          {/* Logo */}
          <div
            onClick={() => handleNavigation("/")}
            className="flex items-center gap-3 px-4 mb-10 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            {isHovered && (
              <span className="text-white font-bold whitespace-nowrap transition-opacity duration-300">
                Savage Club
              </span>
            )}
          </div>

          {/* Menu */}
          <nav className="flex-1 flex flex-col gap-2">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.href, item.action)}
                  className={`
                    flex items-center gap-4 px-4 py-3 mx-2 rounded-xl
                    transition-all duration-200
                    ${isActive || (item.action === "notif" && notifOpen)
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <div className="relative flex items-center justify-center w-6 h-6">
                    <Icon size={22} />

                    {item.action === "notif" && notifCount > 0 && (
                      <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-orange-500 rounded-full shadow-md">
                        {notifCount > 99 ? "99+" : notifCount}
                      </span>
                    )}

                    {item.action === "message" && messageCount > 0 && (
                      <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-orange-500 rounded-full shadow-md">
                        {messageCount > 99 ? "99+" : messageCount}
                      </span>
                    )}
                  </div>

                  {isHovered && (
                    <span className="text-sm whitespace-nowrap transition-opacity duration-300">
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-3 pt-4 border-t border-white/10">
            <button
              onClick={() => handleNavigation("/parametres")}
              className="flex items-center gap-4 px-4 py-3 mx-2 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200 w-full"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <Settings size={22} />
              </div>
              {isHovered && (
                <span className="text-sm whitespace-nowrap transition-opacity duration-300">
                  Paramètres
                </span>
              )}
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/auth" })}
              className="flex items-center gap-4 px-4 py-3 mx-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <LogOut size={22} />
              </div>
              {isHovered && (
                <span className="text-sm whitespace-nowrap transition-opacity duration-300">
                  Déconnexion
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavigation(user ? `/profil/${user.username}` : "/auth")}
              className="flex items-center gap-4 px-4 py-3 mt-4 w-full"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                    {userInitial}
                  </div>
                )}
              </div>
              {isHovered && (
                <div className="transition-opacity duration-300">
                  <p className="text-sm text-white font-medium">{user?.username}</p>
                  <p className="text-xs text-white/50">@{user?.username}</p>
                </div>
              )}
            </button>

            <div className="mt-4 pt-2 border-t border-white/10">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => router.push("/cgu")}
                  className="flex items-center gap-4 px-4 py-2 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  <span className="text-[10px]">©</span>
                  {isHovered && <span className="whitespace-nowrap">Conditions générales</span>}
                </button>

                <button
                  onClick={() => router.push("/confidentialite")}
                  className="flex items-center gap-4 px-4 py-2 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  <span className="text-[10px]">🔒</span>
                  {isHovered && <span className="whitespace-nowrap">Confidentialité</span>}
                </button>

                <div className="px-4 py-2 text-[10px] text-white/20">
                  {isHovered && <span>© 2024 Savage Club</span>}
                </div>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {notifOpen && (
        <NotificationsPanel
          onClose={() => {
            setNotifOpen(false);
            setNotifCount(0);
          }}
        />
      )}
    </>
  );
}