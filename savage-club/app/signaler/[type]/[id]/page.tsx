// app/signaler/[type]/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

type ReportType = "post" | "user" | "comment";

type TargetInfo = {
  type: ReportType;
  id: string;
  content?: string;
  username?: string;
  preview?: string;
};

export default function DynamicReportPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  
  const type = params?.type as ReportType;
  const id = params?.id as string;

  const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);
  const [loadingTarget, setLoadingTarget] = useState(true);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  // Vérifier l'authentification
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth?callbackUrl=/signaler/${type}/${id}`);
    }
  }, [status, router, type, id]);

  // Charger les informations de la cible
  useEffect(() => {
    if (!type || !id || status !== "authenticated") return;

    const fetchTargetInfo = async () => {
      try {
        setLoadingTarget(true);
        const response = await fetch(`/api/reports/target?type=${type}&id=${id}`);
        
        if (!response.ok) {
          throw new Error("Cible non trouvée");
        }
        
        const data = await response.json();
        setTargetInfo(data);
      } catch (err) {
        console.error("Erreur:", err);
        setError("Le contenu que vous essayez de signaler n'existe pas ou a déjà été supprimé.");
      } finally {
        setLoadingTarget(false);
      }
    };

    fetchTargetInfo();
  }, [type, id, status]);

  const reportReasons = {
    post: [
      { id: "spam", label: "Spam ou contenu promotionnel", icon: "📢", description: "Contenu publicitaire non sollicité ou répétitif" },
      { id: "harassment", label: "Harcèlement ou intimidation", icon: "😠", description: "Comportement malveillant ou visant à intimider" },
      { id: "violence", label: "Violence ou contenu choquant", icon: "⚠️", description: "Images violentes, accidents, ou contenu perturbant" },
      { id: "hate_speech", label: "Discours haineux", icon: "💢", description: "Attaques basées sur la race, religion, genre, etc." },
      { id: "nudity", label: "Nudité ou contenu sexuellement explicite", icon: "🔞", description: "Contenu à caractère sexuel non approprié" },
      { id: "misinformation", label: "Désinformation", icon: "❓", description: "Informations fausses ou trompeuses" },
      { id: "intellectual_property", label: "Violation des droits d'auteur", icon: "©️", description: "Contenu protégé utilisé sans autorisation" },
      { id: "self_harm", label: "Auto-mutilation ou suicide", icon: "🆘", description: "Contenu faisant l'apologie de l'auto-mutilation" },
      { id: "other", label: "Autre raison", icon: "📝", description: "Comportement ne correspondant pas aux catégories ci-dessus" }
    ],
    user: [
      { id: "fake_account", label: "Compte faux ou usurpation d'identité", icon: "🎭", description: "Le compte prétend être quelqu'un d'autre" },
      { id: "harassment", label: "Harcèlement ou intimidation", icon: "😠", description: "Comportement malveillant envers d'autres utilisateurs" },
      { id: "hate_speech", label: "Discours haineux", icon: "💢", description: "Propos discriminatoires ou haineux" },
      { id: "spam", label: "Spam ou comportement suspect", icon: "📢", description: "Activité automatisée ou contenu promotionnel abusif" },
      { id: "underage", label: "Compte d'une personne mineure", icon: "👶", description: "L'utilisateur a moins de 13 ans" },
      { id: "inappropriate_username", label: "Nom d'utilisateur inapproprié", icon: "🏷️", description: "Pseudo offensant ou inapproprié" },
      { id: "impersonation", label: "Usurpation de personnalité publique", icon: "⭐", description: "Le compte imite une célébrité ou personnalité" },
      { id: "other", label: "Autre raison", icon: "📝", description: "Comportement ne correspondant pas aux catégories ci-dessus" }
    ],
    comment: [
      { id: "spam", label: "Spam ou contenu promotionnel", icon: "📢", description: "Commentaire publicitaire non sollicité" },
      { id: "harassment", label: "Harcèlement ou intimidation", icon: "😠", description: "Commentaire malveillant ou intimidant" },
      { id: "hate_speech", label: "Discours haineux", icon: "💢", description: "Propos discriminatoires ou haineux" },
      { id: "violence", label: "Violence ou menace", icon: "⚠️", description: "Menaces ou incitation à la violence" },
      { id: "inappropriate", label: "Contenu inapproprié", icon: "🚫", description: "Commentaire hors sujet ou inapproprié" },
      { id: "other", label: "Autre raison", icon: "📝", description: "Comportement ne correspondant pas aux catégories ci-dessus" }
    ]
  };

  const currentReasons = type ? reportReasons[type] : [];

  const getTitle = () => {
    switch (type) {
      case "post": return "Signaler une publication";
      case "user": return "Signaler un utilisateur";
      case "comment": return "Signaler un commentaire";
      default: return "Signaler";
    }
  };

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

  if (loadingTarget) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F0A1F] to-[#1A0F2E] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-amber-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-white/60 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !targetInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F0A1F] to-[#1A0F2E] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl max-w-md w-full p-6 text-center">
          <span className="text-4xl block mb-4">⚠️</span>
          <h2 className="text-white font-bold text-lg mb-2">Contenu introuvable</h2>
          <p className="text-white/60 text-sm mb-4">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0A1F] to-[#1A0F2E]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link 
            href={type === "post" ? `/post/${id}` : type === "user" ? `/profil/${targetInfo?.username || id}` : "#"}
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
            {/* Target Preview */}
            {targetInfo && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                  Vous signalez
                </p>
                <div className="flex items-center gap-3">
                  {targetInfo.type === "user" ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {targetInfo.username?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">@{targetInfo.username}</p>
                        {targetInfo.content && (
                          <p className="text-white/40 text-xs line-clamp-1">{targetInfo.content}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                        <span className="text-2xl">
                          {targetInfo.type === "post" ? "📄" : "💬"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/60 text-xs">
                          {targetInfo.type === "post" ? "Publication" : "Commentaire"}
                        </p>
                        <p className="text-white/90 text-sm line-clamp-2">{targetInfo.preview}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

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
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{reason.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white/90 text-sm font-medium">
                            {reason.label}
                          </span>
                          {selectedReason === reason.id && (
                            <span className="text-amber-400 text-sm">✓</span>
                          )}
                        </div>
                        <p className="text-white/40 text-xs mt-1">{reason.description}</p>
                      </div>
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
                    placeholder="Décrivez précisément la raison de votre signalement..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-colors resize-none"
                  />
                  <p className="text-white/30 text-xs mt-2">
                    Minimum 10 caractères recommandé
                  </p>
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
                    Utilisez cette fonction uniquement pour signaler des contenus qui violent nos 
                    <Link href="/cgu" className="text-amber-400 hover:underline mx-1">
                      conditions d'utilisation
                    </Link>.
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