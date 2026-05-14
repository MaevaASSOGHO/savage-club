"use client";

import { useState, useEffect, useCallback } from "react";
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
import SectionWallet from "@/components/parametres/sections/SectionWallet";
import SectionHistorique from "./sections/SectionHistorique";

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
  | "outils" | "abonnements" | "reservations" | "wallet"
  | "createurs_suivis" | "formateurs_suivis" | "historique"
  | "certification" | "informations" | "changer_compte"
  | "notifications_prefs" | "connexion" | "langue" | "supprimer"
  | "favoris"
  | "cgu" | "confidentialite";

const MENU_ITEMS: { key: Section; label: string; icon: string; roles?: string[] }[] = [
  { key: "outils",              label: "Outils Savage Models",        icon: "⚡", roles: ["CREATOR", "TRAINER"] },
  { key: "wallet",              label: "Mes gains",                   icon: "💰", roles: ["CREATOR", "TRAINER"] },
  { key: "abonnements",         label: "Mes abonnements",             icon: "💳" },
  { key: "reservations",        label: "Mes réservations",            icon: "📅" },
  { key: "favoris",             label: "Mes favoris",                 icon: "🔖" },
  { key: "historique",          label: "Historique d'achats",         icon: "🧾" },
  { key: "certification",       label: "Certification du compte",     icon: "✓",  roles: ["CREATOR", "TRAINER"] },
  { key: "informations",        label: "Informations personnelles",   icon: "👤" },
  { key: "changer_compte",      label: "Changer de type de compte",   icon: "🔄" },
  { key: "connexion",           label: "Données de connexion",        icon: "🔐" },
  { key: "cgu",                 label: "Conditions générales",        icon: "©" },
  { key: "confidentialite",     label: "Confidentialité",             icon: "🔒" },
  { key: "supprimer",           label: "Supprimer le compte",         icon: "🗑" },
];

const EXTERNAL_ROUTES: Partial<Record<Section, string>> = {
  favoris:         "/ma-liste",
  cgu:             "/cgu",
  confidentialite: "/confidentialite",
};

export default function ParametresClient({ user }: { user: User }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get("section") as Section | null;
  const [isMobile, setIsMobile] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  // Détecter la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialisation de la section sélectionnée
  useEffect(() => {
    if (isMobile) {
      setSelectedSection(null);
    } else {
      if (sectionParam && MENU_ITEMS.some(item => item.key === sectionParam)) {
        setSelectedSection(sectionParam);
      } else if (!selectedSection) {
        setSelectedSection("informations");
      }
    }
  }, [isMobile, sectionParam]); // selectedSection intentionnellement absent des dépendances

  const handleSectionChange = useCallback((section: Section) => {
    if (EXTERNAL_ROUTES[section]) {
      router.push(EXTERNAL_ROUTES[section]!);
      return; // on quitte sans changer l'état
    }
    setSelectedSection(section);
    router.push(`/parametres?section=${section}`, { scroll: false });
  }, [router]);

  const handleBackToMenu = useCallback(() => {
    setSelectedSection(null);
    router.push("/parametres", { scroll: false });
  }, [router]);

  const certDot = (user.role === "CREATOR" || user.role === "TRAINER") && !user.isVerified;
  const visibleItems = MENU_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));
  const activeLabel = visibleItems.find((i) => i.key === selectedSection)?.label ?? "";

  function NavList({ onSelect }: { onSelect?: () => void }) {
    return (
      <>
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = selectedSection === item.key;
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
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"/>
                  )}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30 group-hover:opacity-60">
                  <path d="M9 18l6-6-6-6"/>
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
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Se déconnecter
          </button>
        </div>
      </>
    );
  }

  const renderSectionContent = (section: Section) => {
    switch (section) {
      case "informations":      return <SectionInformations user={user} />;
      case "connexion":         return <SectionConnexion />;
      case "wallet":            return <SectionWallet />;
      case "outils":
        if ((user.role === "CREATOR" || user.role === "TRAINER") && !user.isVerified) {
          return (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-6 text-center space-y-4">
              <span className="text-4xl">🔒</span>
              <p className="text-amber-400 font-bold">Outils verrouillés</p>
              <p className="text-white/40 text-sm">Vos outils seront débloqués après validation de votre identité (24-48h).</p>
              <button onClick={() => handleSectionChange("certification")}
                className="bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm">
                Soumettre mes documents
              </button>
            </div>
          );
        }
        return (
          <SectionPrix user={{
            subscriptionPrice: user.subscriptionPrice,
            subscriptionVIP:   user.subscriptionVIP,
            audioCallPrice:    user.audioCallPrice,
            videoCallPrice:    user.videoCallPrice,
            messagePrice:      user.messagePrice,
          }}/>
        );
      case "certification":     return <SectionCertification user={user} />;
      case "changer_compte":    return <SectionChangerCompte user={user} onNavigate={(s) => handleSectionChange(s as Section)} />;
      case "supprimer":         return <SectionSupprimer />;
      case "abonnements":       return <SectionAbonnements />;
      case "createurs_suivis":  return <SectionSuivis role="CREATOR" />;
      case "formateurs_suivis": return <SectionSuivis role="TRAINER" />;
      case "reservations":      return <SectionReservations userRole={user.role} />;
      case "historique":        return <SectionHistorique />;
      case "notifications_prefs": return <SectionPlaceholder title="Notifications" desc="Préférences de notifications à venir." />;
      case "langue":            return <SectionPlaceholder title="Langue" desc="Sélection de langue à venir." />;
      // Les sections favoris, cgu et confidentialite redirigent via useEffect — pas de contenu à afficher
      default:                  return null;
    }
  };

  // Version mobile
  if (isMobile) {
    if (!selectedSection) {
      return (
        <div className="flex-1 min-h-screen bg-[#1a0533]">
          <div className="flex flex-col h-full">
            <div className="px-6 pt-8 pb-4 flex-shrink-0">
              <h1 className="text-white font-black text-2xl uppercase tracking-tight">Paramètres</h1>
              <p className="text-white/30 text-xs mt-1">Choisis un sujet</p>
            </div>
            <NavList />
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-h-screen bg-[#1a0533]">
        <button
          onClick={handleBackToMenu}
          className="fixed top-20 left-4 z-50 text-white/30 hover:text-white/60 transition-colors w-10 h-10 rounded-full flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        <div className="fixed top-0 left-0 right-0 z-40 bg-[#1a0533]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-center">
            <h2 className="text-white font-semibold text-base">{activeLabel}</h2>
          </div>
        </div>

        <div className="pt-16 pb-8">
          <div className="max-w-xl mx-auto px-6 py-8">
            {renderSectionContent(selectedSection)}
          </div>
        </div>
      </div>
    );
  }

  // Version desktop
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
          {selectedSection && renderSectionContent(selectedSection)}
        </div>
      </div>
    </div>
  );
}