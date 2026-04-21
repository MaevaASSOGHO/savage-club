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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    setError("")

    if (!name.trim() || !email.trim() || !password) {
      setError("Tous les champs sont requis.")
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
      // 1. Créer le compte via l'API Express
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur d'inscription")

      // 2. Connecter automatiquement après inscription
      const result = await signIn("credentials", {
        email,
        password,
        mode: "login",
        redirect: false,
      })

      if (result?.error) throw new Error("Inscription réussie mais connexion échouée. Connectez-vous manuellement.")

      router.push("/")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2D0A5E] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-white font-black text-3xl tracking-tight">SAVAGE CLUB</h1>
          <p className="text-white/40 text-sm mt-1">Crée ton compte</p>
        </div>

        {/* Étape 1 — Choix du rôle */}
        {step === 1 && (
          <div>
            <p className="text-white/60 text-sm text-center mb-6">Quel est ton profil ?</p>

            <div className="flex flex-col gap-3 mb-8">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                    role === r.value
                      ? "border-amber-400 bg-amber-400/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <div>
                    <p className={`font-bold text-sm ${role === r.value ? "text-amber-400" : "text-white"}`}>
                      {r.label}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">{r.description}</p>
                  </div>
                  {role === r.value && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Note validation pour créateurs/formateurs */}
            {(role === "CREATOR" || role === "TRAINER") && (
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 mb-6">
                <p className="text-amber-400/80 text-xs leading-relaxed">
                  ⚠️ En tant que <strong>{role === "CREATOR" ? "créateur" : "formateur"}</strong>, votre compte devra être validé par une pièce d'identité avant de pouvoir publier du contenu payant. Vous pourrez le faire depuis votre profil.
                </p>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3.5 rounded-2xl transition-all"
            >
              Continuer →
            </button>

            <p className="text-center text-white/30 text-xs mt-6">
              Déjà un compte ?{" "}
              <Link href="/auth" className="text-amber-400 hover:text-amber-300">
                Se connecter
              </Link>
            </p>
          </div>
        )}

        {/* Étape 2 — Informations */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="text-white/40 hover:text-white text-sm mb-6 flex items-center gap-1">
              ← Retour
            </button>

            {/* Badge rôle choisi */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg">{ROLES.find(r => r.value === role)?.emoji}</span>
              <span className="text-amber-400 font-semibold text-sm">{ROLES.find(r => r.value === role)?.label}</span>
              <button onClick={() => setStep(1)} className="text-white/30 text-xs hover:text-white/60 ml-1">(changer)</button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Nom d'utilisateur</label>
                <input
                  type="text"
                  placeholder="john.doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-amber-400/50 transition-all"
                />
              </div>

              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-amber-400/50 transition-all"
                />
              </div>

              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Mot de passe</label>
                <input
                  type="password"
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-amber-400/50 transition-all"
                />
              </div>

              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Confirmer le mot de passe</label>
                <input
                  type="password"
                  placeholder="Répétez le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-amber-400/50 transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs mt-3 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold py-3.5 rounded-2xl transition-all mt-5"
            >
              {loading ? "Création du compte..." : "Créer mon compte"}
            </button>

            <p className="text-white/20 text-xs text-center mt-4 leading-relaxed">
              En créant un compte, vous acceptez les conditions d'utilisation de Savage Club.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
