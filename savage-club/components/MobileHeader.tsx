// components/MobileHeader.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Settings, ChevronDown, Users, BookOpen } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Link from "next/link";

type TabType = "creators" | "formateurs";

export default function MobileHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("creators");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Déterminer l'onglet actif basé sur le pathname
  useEffect(() => {
    if (pathname === "/creators") {
      setActiveTab("creators");
    } else if (pathname === "/formateurs") {
      setActiveTab("formateurs");
    }
  }, [pathname]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsDropdownOpen(false);
    
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
        {/* Logo cliquable qui redirige vers / */}
        <button
          onClick={() => router.push("/")}
          className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0 hover:scale-105 transition-transform"
        >
          <span className="text-white font-bold text-sm">S</span>
        </button>
        
        {/* Dropdown pour Créateurs/Formateurs */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronDown 
              size={18} 
              className={`text-white/70 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-[#1a0533] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <button
                onClick={() => handleTabChange("creators")}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                  ${activeTab === "creators" 
                    ? "bg-purple-500/20 text-purple-400" 
                    : "text-white/80 hover:bg-white/5"
                  }
                `}
              >
                <Users size={16} />
                <span>Créateurs</span>
                {activeTab === "creators" && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500" />
                )}
              </button>
              
              <button
                onClick={() => handleTabChange("formateurs")}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                  ${activeTab === "formateurs" 
                    ? "bg-purple-500/20 text-purple-400" 
                    : "text-white/80 hover:bg-white/5"
                  }
                `}
              >
                <BookOpen size={16} />
                <span>Formateurs</span>
                {activeTab === "formateurs" && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500" />
                )}
              </button>
            </div>
          )}
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