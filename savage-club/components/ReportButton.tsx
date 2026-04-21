// components/ReportButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type ReportButtonProps = {
  type: "post" | "user" | "comment";
  id: string;
  className?: string;
  variant?: "icon" | "text" | "full";
};

export default function ReportButton({ 
  type, 
  id, 
  className = "", 
  variant = "icon" 
}: ReportButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReport = () => {
    // Fermer la modale
    setShowConfirm(false);
    
    // Vérifier l'authentification
    if (status !== "authenticated") {
      router.push(`/auth?callbackUrl=/signaler/${type}/${id}`);
      return;
    }
    
    // Rediriger vers la page de signalement
    router.push(`/signaler/${type}/${id}`);
  };

  // Variant text
  if (variant === "text") {
    return (
      <>
        <button
          onClick={() => setShowConfirm(true)}
          className={`flex items-center gap-2 text-white/70 hover:text-red-400 transition-colors text-sm ${className}`}
        >
          <span>🚩</span>
          Signaler
        </button>
        
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-white font-bold text-lg mb-2">Signaler ce contenu ?</h3>
              <p className="text-white/60 text-sm mb-6">
                En signalant ce contenu, vous aidez à maintenir une communauté saine et respectueuse.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReport}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Signaler
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Variant full
  if (variant === "full") {
    return (
      <>
        <button
          onClick={() => setShowConfirm(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors ${className}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4M12 17h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/>
          </svg>
          <span className="text-sm">Signaler</span>
        </button>
        
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-white font-bold text-lg mb-2">Signaler ce contenu ?</h3>
              <p className="text-white/60 text-sm mb-6">
                En signalant ce contenu, vous aidez à maintenir une communauté saine et respectueuse.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReport}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Signaler
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Variant icon par défaut
  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className={`text-white/40 hover:text-red-400 transition-colors ${className}`}
        title="Signaler"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="5" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="19" r="1.5" />
      </svg>
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Signaler ce contenu ?</h3>
            <p className="text-white/60 text-sm mb-6">
              En signalant ce contenu, vous aidez à maintenir une communauté saine et respectueuse.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReport}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}