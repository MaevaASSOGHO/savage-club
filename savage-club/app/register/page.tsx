"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Role = "USER" | "CREATOR" | "TRAINER"

const ROLES = [
  {
    value: "USER" as Role,
    label: "Membre",
    emoji: "👤",
    description: "Je consomme du contenu et suis des créateurs",
  },
  {
    value: "CREATOR" as Role,
    label: "Créateur",
    emoji: "🎬",
    description: "Je crée du contenu lifestyle, photo, vidéo...",
  },
  {
    value: "TRAINER" as Role,
    label: "Formateur",
    emoji: "🎓",
    description: "Je partage des formations et du contenu éducatif",
  },
]

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role>("USER")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [acceptedCGU, setAcceptedCGU] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name.trim() || !email.trim() || !password) {
      setError("Tous les champs sont requis.")
      return
    }
    if (!acceptedCGU) {
      setError("Vous devez accepter les conditions générales d'utilisation.")
      return
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, acceptedCGU }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur d'inscription")

      const result = await signIn("credentials", {
        email,
        password,
        mode: "login",
        redirect: false,
      })

      if (result?.error) throw new Error("Inscription réussie. Connectez-vous manuellement.")

      router.push("/")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find(r => r.value === role)!

  return (
    <div className="min-h-screen bg-[#1E0A3C] flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Blobs décoratifs */}
      <div className="absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full bg-[#6B21A8]/30 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full bg-[#F59E0B]/10 blur-[90px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">

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
          <p className="text-[#A78BFA] text-sm mt-1">Rejoignez la communauté</p>
        </div>

        {/* Card */}
        <div className="bg-[#2A1356]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">

          {/* Indicateur d'étape */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? "bg-[#F59E0B]" : "bg-white/10"}`} />
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? "bg-[#F59E0B]" : "bg-white/10"}`} />
          </div>

          {/* ── ÉTAPE 1 : Choix du rôle ── */}
          {step === 1 && (
            <div>
              <p className="text-[#C4B5FD] text-sm font-medium mb-4">Quel est ton profil ?</p>

              <div className="flex flex-col gap-3 mb-5">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                      role === r.value
                        ? "border-[#F59E0B]/60 bg-[#F59E0B]/10"
                        : "border-white/10 bg-[#1E0A3C] hover:border-white/20"
                    }`}
                  >
                    <span className="text-xl">{r.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${role === r.value ? "text-[#F59E0B]" : "text-white"}`}>
                        {r.label}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">{r.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      role === r.value ? "border-[#F59E0B] bg-[#F59E0B]" : "border-white/20"
                    }`}>
                      {role === r.value && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Avertissement créateur/formateur */}
              {(role === "CREATOR" || role === "TRAINER") && (
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl px-4 py-3 mb-5">
                  <p className="text-[#F59E0B]/80 text-xs leading-relaxed">
                    ⚠️ En tant que <strong>{role === "CREATOR" ? "créateur" : "formateur"}</strong>, une validation par pièce d'identité sera requise pour publier du contenu payant. Vous pourrez le faire depuis votre profil.
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                className="w-full bg-[#6B21A8] hover:bg-[#7C3AED] text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-[#6B21A8]/30"
              >
                Continuer →
              </button>
            </div>
          )}

          {/* ── ÉTAPE 2 : Informations ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Rôle choisi + bouton retour */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{selectedRole.emoji}</span>
                  <span className="text-[#F59E0B] text-sm font-semibold">{selectedRole.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError("") }}
                  className="text-[#A78BFA] text-xs hover:text-white transition-colors"
                >
                  ← Changer
                </button>
              </div>

              <div>
                <label className="text-[#C4B5FD] text-xs font-medium mb-1.5 block">Nom d'utilisateur</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="savage_creator"
                  required
                  className="w-full bg-[#1E0A3C] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-[#F59E0B]/60 focus:ring-1 focus:ring-[#F59E0B]/30 transition-all"
                />
              </div>

              <div>
                <label className="text-[#C4B5FD] text-xs font-medium mb-1.5 block">Adresse email</label>
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

              <div>
                <label className="text-[#C4B5FD] text-xs font-medium mb-1.5 block">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#1E0A3C] border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-white/30 outline-none focus:border-[#F59E0B]/60 focus:ring-1 focus:ring-[#F59E0B]/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showConfirm ? (
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

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <label className="flex items-start gap-2 text-xs text-white/60 mt-2">
                <input
                  type="checkbox"
                  checked={acceptedCGU}
                  onChange={(e) => setAcceptedCGU(e.target.checked)}
                  className="mt-1 accent-[#F59E0B]"
                />
                <span>
                  J’accepte les{" "}
                  <Link href="/cgu" className="underline text-[#F59E0B] hover:text-[#FBBF24]">
                    conditions d’utilisation
                  </Link>{" "}
                  et je confirme avoir au moins 18 ans.
                </span>
              </label>
              <button
                type="submit"
                disabled={loading || !acceptedCGU}
                className="w-full bg-[#6B21A8] hover:bg-[#7C3AED] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-[#6B21A8]/30 mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Création du compte...
                  </span>
                ) : "Créer mon compte"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Déjà un compte ?{" "}
          <Link href="/auth" className="text-[#A78BFA] hover:text-[#F59E0B] transition-colors">
            Se connecter
          </Link>
          {" · "}
          <Link href="/cgu" className="text-[#A78BFA] hover:text-[#F59E0B] transition-colors">
            CGU
          </Link>
        </p>
      </div>
    </div>
  )
}
