// components/MobileHeader.tsx
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Settings, Users, BookOpen } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Link from "next/link";

interface MobileHeaderProps {
  onTabChange?: (tab: "creators" | "formateurs") => void;
  defaultTab?: "creators" | "formateurs";
}

export default function MobileHeader({ onTabChange, defaultTab = "creators" }: MobileHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<"creators" | "formateurs">(defaultTab);

  const handleTabChange = (tab: "creators" | "formateurs") => {
    setActiveTab(tab);
    onTabChange?.(tab);
    
    // Navigation selon l'onglet
    if (tab === "creators") {
      router.push("/creators");
    } else {
      router.push("/formateurs");
    }
  };

  const userInitial = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#1a0533]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo et navigation par onglets */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          
          {/* Onglets Créateurs / Formateurs */}
          <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
            <button
              onClick={() => handleTabChange("creators")}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${activeTab === "creators" 
                  ? "bg-purple-500 text-white" 
                  : "text-white/60 hover:text-white/80"
                }
              `}
            >
              <Users size={14} />
              <span>Créateurs</span>
            </button>
            
            <button
              onClick={() => handleTabChange("formateurs")}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${activeTab === "formateurs" 
                  ? "bg-purple-500 text-white" 
                  : "text-white/60 hover:text-white/80"
                }
              `}
            >
              <BookOpen size={14} />
              <span>Formateurs</span>
            </button>
          </div>
        </div>

        {/* Paramètres et Avatar */}
        <div className="flex items-center gap-3">
          <Link
            href="/parametres"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Settings size={18} className="text-white/70" />
          </Link>
          
          <Link
            href={user ? `/profil/${user.username}` : "/auth"}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                  {userInitial}
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}