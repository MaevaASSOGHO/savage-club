// components/MobileBottomNav.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { Compass, Bell, PlusCircle, Film, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import NotificationsPanel from "@/components/NotificationsPanel";

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const navItems = [
    { name: "Découvrir", icon: Compass, href: "/decouvrir" },
    { name: "Notifications", icon: Bell, href: "#", action: "notif" as const },
    { name: "Créer", icon: PlusCircle, href: "/create", action: "create" as const },
    { name: "Réels", icon: Film, href: "/reels" },
    { name: "Messages", icon: MessageCircle, href: "/messages", action: "message" as const },
  ];

  // Récupérer le nombre de notifications non lues
  useEffect(() => {
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
  }, []);

  // Récupérer le nombre de messages non lus
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) return;
        
        const data = await res.json();
        const conversations = (() => {
          if (Array.isArray(data)) return data;
          if (data?.conversations && Array.isArray(data.conversations)) return data.conversations;
          if (data?.data && Array.isArray(data.data)) return data.data;
          return [];
        })();
        
        const totalUnread = conversations.reduce(
          (sum: number, conv: any) => sum + (conv.unreadCount || 0),
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
  }, []);

  const handleNavigation = (href?: string, action?: "notif" | "create" | "message") => {
    if (action === "notif") {
      setNotifOpen(true);
      return;
    }

    if (action === "create") {
      router.push("/create");
      return;
    }

    if (action === "message") {
      if (href) router.push(href);
      return;
    }

    if (href) {
      router.push(href);
    }
  };

  const isActive = (href: string) => {
    if (href === "#") return false;
    return pathname === href;
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1a0533]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = item.href !== "#" && isActive(item.href);
            
            return (
              <button
                key={index}
                onClick={() => handleNavigation(item.href, item.action)}
                className={`
                  relative flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg
                  transition-all duration-200
                  ${active 
                    ? "text-purple-400" 
                    : "text-white/60 hover:text-white/80"
                  }
                `}
              >
                <div className="relative">
                  <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                  
                  {item.name === "Notifications" && notifCount > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center text-[9px] font-bold text-white bg-orange-500 rounded-full shadow-md">
                      {notifCount > 99 ? "99+" : notifCount}
                    </span>
                  )}
                  
                  {item.name === "Messages" && messageCount > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center text-[9px] font-bold text-white bg-orange-500 rounded-full shadow-md">
                      {messageCount > 99 ? "99+" : messageCount}
                    </span>
                  )}
                </div>
                
                <span className="text-[10px] font-medium">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Panel de notifications - Version full screen mobile */}
      {notifOpen && (
        <NotificationsPanel
          onClose={() => {
            setNotifOpen(false);
            setNotifCount(0);
          }}
          isMobile={true}
        />
      )}
    </>
  );
}