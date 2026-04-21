// app/signaler/ReportContent.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type ReportType = "post" | "user" | "comment";

export default function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const type = searchParams.get("type") as ReportType;
  const id = searchParams.get("id");

  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  // Rediriger si pas de type ou d'id
  useEffect(() => {
    if (!type || !id) {
      router.push("/");
    }
  }, [type, id, router]);

  const reportReasons = {
    post: [
      { id: "spam", label: "Spam ou contenu promotionnel", icon: "📢" },
      { id: "harassment", label: "Harcèlement ou intimidation", icon: "😠" },
      { id: "violence", label: "Violence ou contenu choquant", icon: "⚠️" },
      { id: "hate_speech", label: "Discours haineux", icon: "💢" },
      { id: "nudity", label: "Nudité ou contenu sexuellement explicite", icon: "🔞" },
      { id: "misinformation", label: "Désinformation", icon: "❓" },
      { id: "intellectual_property", label: "Violation des droits d'auteur", icon: "©️" },
      { id: "other", label: "Autre raison", icon: "📝" }
    ],
    user: [
      { id: "fake_account", label: "Compte faux ou usurpation d'identité", icon: "🎭" },
      { id: "harassment", label: "Harcèlement ou intimidation", icon: "😠" },
      { id: "hate_speech", label: "Discours haineux", icon: "💢" },
      { id: "spam", label: "Spam ou comportement suspect", icon: "📢" },
      { id: "underage", label: "Compte d'une personne mineure", icon: "👶" },
      { id: "inappropriate_username", label: "Nom d'utilisateur inapproprié", icon: "🏷️" },
      { id: "other", label: "Autre raison", icon: "📝" }
    ],
    comment: [
      { id: "spam", label: "Spam ou contenu promotionnel", icon: "📢" },
      { id: "harassment", label: "Harcèlement ou intimidation", icon: "😠" },
      { id: "hate_speech", label: "Discours haineux", icon: "💢" },
      { id: "violence", label: "Violence ou contenu choquant", icon: "⚠️" },
      { id: "other", label: "Autre raison", icon: "📝" }
    ]
  };

  const currentReasons = type ? reportReasons[type] : [];

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError("Veuillez sélectionner une raison");
      return;
    }

    const finalReason = selectedReason === "other" 
      ? otherReason.trim() 
      : selectedReason;

    if (selectedReason === "other" && !finalReason) {
      setError("Veuillez préciser la raison");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          targetId: id,
          reason: finalReason,
          reasonId: selectedReason
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du signalement");
      }

      setSuccess(true);
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "post": return "Signaler une publication";
      case "user": return "Signaler un utilisateur";
      case "comment": return "Signaler un commentaire";
      default: return "Signaler";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0A1F] to-[#1A0F2E]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Signalement envoyé</h2>
            <p className="text-white/60 text-sm">
              Merci pour votre signalement. Notre équipe va examiner le contenu et prendra les mesures nécessaires.
            </p>
            <p className="text-white/40 text-xs mt-4">
              Vous serez redirigé dans quelques secondes...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-white font-black text-2xl uppercase tracking-tight">
                {getTitle()}
              </h1>
              <p className="text-white/40 text-sm">
                Votre signalement est anonyme et nous aide à maintenir une communauté saine
              </p>
            </div>

            {/* Reasons Grid */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="text-amber-400">⚠️</span>
                Pourquoi signalez-vous ?
              </h2>
              
              <div className="grid gap-3">
                {currentReasons.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all border ${
                      selectedReason === reason.id
                        ? "bg-amber-400/10 border-amber-400/50 shadow-lg shadow-amber-400/5"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{reason.icon}</span>
                      <span className="text-white/90 text-sm font-medium">
                        {reason.label}
                      </span>
                      {selectedReason === reason.id && (
                        <span className="ml-auto text-amber-400">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Other reason input */}
              {selectedReason === "other" && (
                <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Décrivez la raison de votre signalement..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Warning Message */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex gap-3">
                <span className="text-red-400 text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-medium mb-1">
                    Signalements abusifs
                  </p>
                  <p className="text-white/50 text-xs">
                    Les signalements abusifs ou malveillants peuvent entraîner des restrictions sur votre compte. 
                    Utilisez cette fonction uniquement pour signaler des contenus qui violent nos conditions d'utilisation.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-in fade-in duration-200">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Envoi en cours...
                </div>
              ) : (
                "Envoyer le signalement"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}