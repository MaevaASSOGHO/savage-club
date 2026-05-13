// components/ResponsiveLayout.tsx
"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  onTabChange?: (tab: "creators" | "formateurs") => void;
  defaultTab?: "creators" | "formateurs";
}

export default function ResponsiveLayout({ 
  children, 
  onTabChange, 
  defaultTab = "creators" 
}: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useCurrentUser();

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

  // Version mobile
  if (isMobile) {
    return (
      <>
        <MobileHeader onTabChange={onTabChange} defaultTab={defaultTab} />
        <main className="pt-16 pb-20">
          {children}
        </main>
        <MobileBottomNav />
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