// components/ResponsiveLayout.tsx
"use client";

import { useEffect, useState } from "react";
import MobileHeader from "@/components/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePathname } from "next/navigation";

export default function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useCurrentUser();
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!user) return <>{children}</>;

  const isReelsPage = pathname === "/reels";

  if (isMobile) {
    return (
      <>
        <MobileHeader />
        <main className="pt-16 pb-20">{children}</main>
        {!isReelsPage && <MobileBottomNav />}
      </>
    );
  }

  return (
    <div className="flex">
      <div className="w-[220px] flex-shrink-0 hidden md:block" />
      <main className="flex-1">{children}</main>
    </div>
  );
}