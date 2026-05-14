// app/onboarding/steps/StepProfile.tsx
"use client";

import { useRef, useState } from "react";

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

type Props = { role: string; onNext: () => void };

export default function StepProfile({ role, onNext }: Props) {
  const isTrainer = role === "TRAINER";
  const fileRef   = useRef<HTMLInputElement>(null);

  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio,         setBio]         = useState("");
  const [subject,     setSubject]     = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  async function handleAvatar(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    form.append("folder", "savage_club/avatars");
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
    const data = await res.json();
    if (data.secure_url) setAvatarUrl(data.secure_url);
    setUploading(false);
  }

  async function handleSave() {
    if (!displayName.trim()) { setError("Ajoute un nom d'affichage."); return; }
    if (isTrainer && !subject.trim()) { setError("Indique ton sujet principal."); return; }
    setSaving(true);
    try {
      await fetch("/api/onboarding/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, subject: isTrainer ? subject : undefined, avatar: avatarUrl }),
      });
      onNext();
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div>
        <h2 className="text-2xl font-bold text-white leading-tight">
          Crée ton<br />
          <span className="text-amber-400">profil public</span>
        </h2>
        <p className="text-white/40 text-sm mt-1">
          C'est ce que verront tes {isTrainer ? "élèves" : "abonnés"}.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-white/20 hover:border-amber-400/50 transition-all bg-white/5 flex items-center justify-center group"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : uploading ? (
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-white/30 group-hover:text-white/60 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="text-[10px]">Photo</span>
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleAvatar(e.target.files[0]); }} />
        <p className="text-white/30 text-xs">Optionnel — tu pourras changer plus tard</p>
      </div>

      {/* Champs */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-white/60 text-xs font-medium mb-1.5 block">Nom d'affichage *</label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={isTrainer ? "Prof. Koné Ahmed" : "Savage Creator"}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all"
          />
        </div>

        {isTrainer && (
          <div>
            <label className="text-white/60 text-xs font-medium mb-1.5 block">Sujet principal *</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="ex : Marketing digital, Fitness, Développement personnel…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all"
            />
          </div>
        )}

        <div>
          <label className="text-white/60 text-xs font-medium mb-1.5 block">Bio <span className="text-white/25">(optionnel)</span></label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder={isTrainer
              ? "Présente ton expertise en 2-3 phrases…"
              : "Dis quelques mots sur ton univers…"}
            rows={3}
            maxLength={160}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all resize-none"
          />
          <p className="text-white/20 text-xs mt-1 text-right">{bio.length}/160</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-amber-400/20 mt-2"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Enregistrement…
          </span>
        ) : "Continuer →"}
      </button>
    </div>
  );
}
