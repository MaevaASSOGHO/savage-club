// components/parametres/ParametresClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import SectionInformations from "@/components/parametres/sections/SectionInformations";
import SectionConnexion from "@/components/parametres/sections/SectionConnexion";
import SectionPrix from "@/components/parametres/sections/SectionPrix";
import SectionCertification from "@/components/parametres/sections/SectionCertification";
import SectionChangerCompte from "@/components/parametres/sections/SectionChangerCompte";
import SectionSupprimer from "@/components/parametres/sections/SectionSupprimer";
import SectionAbonnements from "@/components/parametres/sections/SectionAbonnements";
import SectionSuivis from "@/components/parametres/sections/SectionSuivis";
import SectionReservations from "@/components/parametres/sections/SectionReservations";
import SectionPlaceholder from "@/components/parametres/sections/SectionPlaceholder";

type User = {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  isVerified: boolean;
  idVerified: boolean;
  idDocumentUrl: string | null;
  category: string | null;
  location: string | null;
  website: string | null;
  subscriptionPrice: number | null;
  subscriptionVIP: number | null;
  audioCallPrice: number | null;
  videoCallPrice: number | null;
  messagePrice: number | null;
  createdAt: Date;
};

type Section =
  | "outils" | "abonnements" | "reservations"
  | "createurs_suivis" | "formateurs_suivis" | "historique"
  | "certification" | "informations" | "changer_compte"
  | "notifications_prefs" | "connexion" | "langue" | "supprimer";

const MENU_ITEMS: { key: Section; label: string; icon: string; roles?: string[] }[] = [
  { key: "outils",              label: "Outils Savage Models",        icon: "⚡", roles: ["CREATOR", "TRAINER"] },
  { key: "abonnements",         label: "Mes abonnements",             icon: "💳" },
  { key: "reservations",        label: "Mes réservations",            icon: "📅" },
 // { key: "createurs_suivis",    label: "Créateurs suivis",            icon: "🎨" },
  //{ key: "formateurs_suivis",   label: "Formateurs suivis",           icon: "🎓" },
  { key: "historique",          label: "Historique d'achats",         icon: "🧾" },
  { key: "certification",       label: "Certification du compte",     icon: "✓",  roles: ["CREATOR", "TRAINER"] },
  { key: "informations",        label: "Informations personnelles",   icon: "👤" },
  { key: "changer_compte",      label: "Changer de type de compte",   icon: "🔄" },
  //{ key: "notifications_prefs", label: "Préférences notifications",   icon: "🔔" },
  { key: "connexion",           label: "Données de connexion",        icon: "🔐" },
  //{ key: "langue",              label: "Langue",                      icon: "🌍" },
  { key: "supprimer",           label: "Supprimer le compte",         icon: "🗑" },
];

function renderSection(section: Section, user: User) {
  switch (section) {
    case "informations":      return <SectionInformations user={user} />;
    case "connexion":         return <SectionConnexion />;
    case "outils":            return (
      <SectionPrix user={{
        subscriptionPrice: user.subscriptionPrice,
        subscriptionVIP:   user.subscriptionVIP,
        audioCallPrice:    user.audioCallPrice,
        videoCallPrice:    user.videoCallPrice,
        messagePrice:      user.messagePrice,
      }}/>
    );
    case "certification":     return <SectionCertification user={user} />;
    case "changer_compte":    return <SectionChangerCompte user={user} />;
    case "supprimer":         return <SectionSupprimer />;
    case "abonnements":       return <SectionAbonnements />;
    case "createurs_suivis":  return <SectionSuivis role="CREATOR" />;
    case "formateurs_suivis": return <SectionSuivis role="TRAINER" />;
    case "reservations":      return <SectionReservations userRole={user.role} />;
    case "historique":        return <SectionPlaceholder title="Historique d'achats" desc="Vos achats de contenus apparaîtront ici." />;
    case "notifications_prefs": return <SectionPlaceholder title="Notifications"     desc="Préférences de notifications à venir." />;
    case "langue":            return <SectionPlaceholder title="Langue"              desc="Sélection de langue à venir." />;
    default:                  return null;
  }
}

export default function ParametresClient({ user }: { user: User }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get("section") as Section | null;
  
  const [active, setActive] = useState<Section>(() => {
    // Vérifier si le paramètre est valide
    if (sectionParam && MENU_ITEMS.some(item => item.key === sectionParam)) {
      return sectionParam;
    }
    return "informations";
  });
  
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mettre à jour l'URL quand la section change
  const handleSectionChange = (section: Section) => {
    setActive(section);
    router.push(`/parametres?section=${section}`, { scroll: false });
  };

  const certDot = (user.role === "CREATOR" || user.role === "TRAINER") && !user.isVerified;
  const visibleItems = MENU_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));
  const activeLabel = visibleItems.find((i) => i.key === active)?.label ?? "";

  function NavList({ onSelect }: { onSelect?: () => void }) {
    return (
      <>
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { handleSectionChange(item.key); onSelect?.(); }}
                className={`w-full text-left flex items-center justify-between px-3 py-3 rounded-xl transition-all group ${
                  isActive ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3 text-sm">
                  <span>{item.icon}</span>
                  {item.label}
                  {item.key === "certification" && certDot && (
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  )}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30 group-hover:opacity-60">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            );
          })}
        </nav>
        <div className="px-3 pb-6 border-t border-white/10 pt-4 flex-shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Se déconnecter
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden min-h-screen">

      <div className="w-72 flex-shrink-0 border-r border-white/10 hidden md:flex flex-col">
        <div className="px-6 pt-8 pb-4 flex-shrink-0">
          <h1 className="text-white font-black text-2xl uppercase tracking-tight">Paramètres</h1>
          <p className="text-white/30 text-xs mt-1">Choisis un sujet</p>
        </div>
        <NavList />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-8">
          <div className="md:hidden flex items-center gap-3 mb-6">
            <button onClick={() => setMobileOpen(true)} className="text-white/40 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="text-white/50 text-sm">{activeLabel}</span>
          </div>
          {renderSection(active, user)}
        </div>
      </div>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)}/>
          <div className="fixed left-0 top-0 h-full w-72 bg-[#1E0A3C] z-50 flex flex-col md:hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-2 flex-shrink-0">
              <h1 className="text-white font-black text-xl uppercase">Paramètres</h1>
              <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <NavList onSelect={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
