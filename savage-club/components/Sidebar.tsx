"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState, useEffect } from "react";
import { 
  Home, 
  Book,
  Search, 
  Bell, 
  MessageCircle, 
  User,
  Star,
  Sparkles,
  Film,
  Bookmark,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import NotificationsPanel from "@/components/NotificationsPanel";

type ConversationResponse = {
  conversations: {
    id: string;
    type: string;
    lastMessageAt: string;
    unreadCount: number;
    lastMessage: {
      id: string;
      content: string;
      mediaType: string | null;
      createdAt: string;
      senderId: string;
      sender: { id: string; username: string };
    } | null;
    other: {
      id: string;
      username: string;
      displayName: string | null;
      avatar: string | null;
      isVerified: boolean;
      role: string;
    } | null;
  }[];
  nextCursor: string | null;
  hasMore: boolean;
};

const menuItems = [
  { name: "Créateurs", icon: Star, href: "/creators" },
  { name: "Formateurs", icon: Book, href: "/formateurs" },
  { name: "Réels", icon: Film, href: "/reels" },
  { name: "Mes favoris", icon: Bookmark, href: "/ma-liste" },
  { name: "Découvrir", icon: Sparkles, href: "/decouvrir" },
  { name: "Notifications", icon: Bell, action: "notif" as const },
  { name: "Messages", icon: MessageCircle, href: "/messages", action: "message" as const },
];

export default function Sidebar() {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();

  // États
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  interface Conversation {
    id: string;
    unreadCount: number;
    // ... autres props optionnelles
  }
  // Vérifier si on est sur mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Récupérer le nombre de notifications non lues
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          setNotifCount(data.count);
        }
      } catch (error) {
        console.error("Erreur chargement compteur notifications:", error);
      }
    };

    fetchUnreadCount();

    const handleNotificationsRead = () => {
      setNotifCount(0);
    };
    window.addEventListener("notifications-read", handleNotificationsRead);
    return () => window.removeEventListener("notifications-read", handleNotificationsRead);
  }, [user]);

  // Récupérer le nombre de messages non lus
  useEffect(() => {
    if (!user) return;

    // Ajoute cette interface
interface Conversation {
  id: string;
  unreadCount: number;
  // ... autres props optionnelles
}

const fetchUnreadMessages = async () => {
  try {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    
    const data = await res.json();
    
    // Extraction robuste du tableau de conversations
    const conversations = (() => {
      if (Array.isArray(data)) return data;
      if (data?.conversations && Array.isArray(data.conversations)) return data.conversations;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    })();
    
    const totalUnread = conversations.reduce(
      (sum: number, conv: Conversation) => sum + (conv.unreadCount || 0),
      0
    );
    
    setMessageCount(totalUnread);
  } catch (error) {
    console.error("Erreur chargement compteur messages:", error);
  }
};

    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Navigation
  const handleNavigation = (href?: string, action?: "notif" | "message") => {
    if (action === "notif") {
      setNotifOpen(true);
      setIsMobileOpen(false);
      return;
    }

    if (action === "message") {
      setMessageCount(0);
      if (href) router.push(href);
      setIsMobileOpen(false);
      return;
    }

    if (href) {
      router.push(href);
      setIsMobileOpen(false);
    }
  };

  const sidebarWidth = () => {
    if (isMobile) return isMobileOpen ? "w-[260px]" : "w-0";
    if (isHovered) return "w-[220px]";
    return "w-[80px]";
  };

  // Savoir si le texte doit être visible
  const showText = isMobile || isHovered;

  if (!user) {
    return null;
  }

  const userInitial = user.username?.[0]?.toUpperCase() || "?";

  return (
    <>
      {/* Bouton hamburger mobile */}
      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-50 bg-[#1a0533]/95 backdrop-blur-xl p-3 rounded-xl border border-white/10"
        >
          <Menu size={22} className="text-white" />
        </button>
      )}

      {/* Overlay mobile */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={`
          fixed left-0 top-0 h-screen z-50
          transition-all duration-300 ease-in-out
          bg-[#1a0533]/95 backdrop-blur-xl
          border-r border-white/10
          overflow-hidden
          flex flex-col
          ${sidebarWidth()}
          ${isMobile ? "shadow-2xl" : ""}
        `}
      >
        <div className="flex flex-col justify-between h-full py-6">
          {/* Logo - Version corrigée avec taille fixe */}
          <div
            onClick={() => handleNavigation("/")}
            className="flex items-center gap-3 px-4 mb-10 cursor-pointer"
          >
            {/* Logo toujours visible et bien dimensionné */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>

            {/* Texte visible seulement quand la sidebar est ouverte */}
            {showText && (
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
                  {/* Icon + Badge - Taille fixe */}
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

                  {/* Text */}
                  {showText && (
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
            {/* Paramètres */}
            <button
              onClick={() => handleNavigation("/parametres")}
              className="flex items-center gap-4 px-4 py-3 mx-2 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200 w-full"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <Settings size={22} />
              </div>
              {showText && (
                <span className="text-sm whitespace-nowrap transition-opacity duration-300">
                  Paramètres
                </span>
              )}
            </button>

            {/* Déconnexion */}
            <button
              onClick={() => signOut({ callbackUrl: "/auth" })}
              className="flex items-center gap-4 px-4 py-3 mx-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <LogOut size={22} />
              </div>
              {showText && (
                <span className="text-sm whitespace-nowrap transition-opacity duration-300">
                  Déconnexion
                </span>
              )}
            </button>

            {/* USER */}
            <button
              onClick={() => handleNavigation(user ? `/profil/${user.username}` : "/auth")}
              className="flex items-center gap-4 px-4 py-3 mt-4 w-full"
            >
              {/* Avatar - Taille fixe */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                    {userInitial}
                  </div>
                )}
              </div>

              {/* Infos utilisateur */}
              {showText && (
                <div className="transition-opacity duration-300">
                  <p className="text-sm text-white font-medium">
                    {user?.username}
                  </p>
                  <p className="text-xs text-white/50">
                    @{user?.username}
                  </p>
                </div>
              )}
            </button>

            {/* Mentions légales */}
            <div className="mt-4 pt-2 border-t border-white/10">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => router.push("/cgu")}
                  className="flex items-center gap-4 px-4 py-2 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  <span className="text-[10px]">©</span>
                  {showText && (
                    <span className="whitespace-nowrap">
                      Conditions générales
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => router.push("/confidentialite")}
                  className="flex items-center gap-4 px-4 py-2 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  <span className="text-[10px]">🔒</span>
                  {showText && (
                    <span className="whitespace-nowrap">
                      Confidentialité
                    </span>
                  )}
                </button>
                
                <div className="px-4 py-2 text-[10px] text-white/20">
                  {showText && (
                    <span>© 2024 Savage Club</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Panel de notifications */}
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