"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      mode: "login",
      redirect: false,
    });

    if (res?.error) {
      setError(decodeURIComponent(res.error));
    } else {
      router.push("/");
      router.refresh();
    }

    setLoading(false);
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
          <p className="text-[#A78BFA] text-sm mt-1">Content de vous revoir 👋</p>
        </div>

        {/* Card */}
        <div className="bg-[#2A1356]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

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

            <div>
              <label className="text-[#C4B5FD] text-xs font-medium mb-1.5 block">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#1E0A3C] border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-white/30 outline-none focus:border-[#F59E0B]/60 focus:ring-1 focus:ring-[#F59E0B]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
          </div>

            <div className="text-right -mt-2">
              <a href="/auth/forgot" className="text-[#A78BFA] text-xs hover:text-[#F59E0B] transition-colors">
                Mot de passe oublié ?
              </a>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6B21A8] hover:bg-[#7C3AED] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-[#6B21A8]/30 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Connexion...
                </span>
              ) : "Se connecter"}
            </button>

          </form>
        </div>

        {/* Lien inscription */}
        <p className="text-center text-white/30 text-xs mt-6">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-[#A78BFA] hover:text-[#F59E0B] transition-colors">
            Créer un compte
          </Link>
          {" · "}
          <a href="/cgu" className="text-[#A78BFA] hover:text-[#F59E0B] transition-colors">
            CGU
          </a>
        </p>

      </div>
    </div>
  );
}
