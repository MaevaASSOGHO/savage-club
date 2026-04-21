// components/FeedLayout.tsx
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function FeedLayout({
  children,
  variant = "default",
  hideBackground = false,
}: {
  children: React.ReactNode;
  variant?: "default" | "dark" | "solid";
  hideBackground?: boolean;
}) {
  // Si hideBackground est true, pas de fond
  const bg = hideBackground
    ? ""
    : variant === "dark"
    ? "bg-gradient-to-br from-[#0f0126] to-[#1a0533]"
    : variant === "solid"
    ? "bg-[#1a0533]" 
    : "bg-gradient-to-br from-[#2a044a] to-[#3B0764]";

  return (
    <div className={`flex min-h-screen ${bg}`}>
      <Sidebar />

      <main className="flex-1 flex justify-center px-4 py-6">
        <div className="w-full max-w-xl flex flex-col gap-6 animate-fade-in">
          {children}
        </div>
      </main>

      {/* Bouton Créer - visible sur toutes les pages sauf si hideBackground est true (réels) */}
      {!hideBackground && (
        <Link
          href="/create"
          className="
            fixed bottom-6 right-6 z-50
            flex items-center gap-2
            px-8 py-5
            rounded-xs
            bg-[#1a0533]/95
            text-white font-bold text-sm
            shadow-lg shadow-purple-900/40
            backdrop-blur-md
            hover:scale-105 hover:shadow-xl hover:shadow-purple-900/60
            active:scale-95
            transition-all duration-200 ease-out
          "
        >
          <Plus size={18} />
          <span className="hidden sm:inline font-bold">Créer</span>
        </Link>
      )}
    </div>
  );
}