// app/auth/forgot/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1E0A3C] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Blobs décoratifs */}
      <div className="absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full bg-[#6B21A8]/30 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full bg-[#F59E0B]/10 blur-[90px] pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl border-2 border-[#F59E0B] flex items-center justify-center mb-3 bg-[#2A1356]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M15 10l4.553-2.07A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-[#F59E0B] text-2xl font-bold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
            Savage Club
          </h1>
          <p className="text-[#A78BFA] text-sm mt-1">Réinitialisation du mot de passe</p>
        </div>

        {/* Card */}
        <div className="bg-[#2A1356]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">

          {!success ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-white/60 text-sm mb-2">
                Entrez votre adresse email pour recevoir un lien de réinitialisation.
              </p>

              <div>
                <label className="text-[#C4B5FD] text-xs font-medium mb-1.5 block">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  className="w-full bg-[#1E0A3C] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-[#F59E0B]/60 focus:ring-1 focus:ring-[#F59E0B]/30 transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6B21A8] hover:bg-[#7C3AED] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-[#6B21A8]/30 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Envoi en cours...
                  </span>
                ) : "Envoyer le lien"}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Email envoyé !</h3>
              <p className="text-white/60 text-sm mb-6">
                Si un compte existe avec l'adresse {email}, vous recevrez un lien de réinitialisation.
              </p>
              <button
                onClick={() => router.push("/auth")}
                className="text-[#F59E0B] hover:text-[#A78BFA] transition-colors text-sm font-medium"
              >
                Retour à la connexion
              </button>
            </div>
          )}
        </div>

        {/* Liens */}
        <p className="text-center text-white/30 text-xs mt-6">
          <Link href="/auth" className="text-[#A78BFA] hover:text-[#F59E0B] transition-colors">
            ← Retour à la connexion
          </Link>
          {" · "}
          <Link href="/register" className="text-[#A78BFA] hover:text-[#F59E0B] transition-colors">
            Créer un compte
          </Link>
        </p>

      </div>
    </div>
  );
}