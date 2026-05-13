// components/ResponsiveLayout.tsx
"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePathname } from "next/navigation";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useCurrentUser();
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Si pas d'utilisateur connecté, afficher simplement les enfants
  if (!user) {
    return <>{children}</>;
  }

  // Vérifier si on est sur la page reels
  const isReelsPage = pathname === "/reels";

  // Version mobile
  if (isMobile) {
    return (
      <>
        <MobileHeader />
        <main className="pt-16 pb-20">
          {children}
        </main>
        {!isReelsPage && <MobileBottomNav />}
      </>
    );
  }

  // Version desktop
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-[80px] hover:ml-[220px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}