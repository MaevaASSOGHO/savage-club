// components/profile/ProfileHeader.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReportButton from "../ReportButton";

type User = {
  id: string;
  displayName: string | null;
  username: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  isVerified: boolean;
  category: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
};

type Props = {
  user: User;
  hasBadge: boolean;
  isOwner: boolean;
  followerCount: number;
};

const ROLE_LABEL: Record<string, string> = {
  CREATOR: "Créateur",
  TRAINER: "Formateur",
  USER: "Membre",
  ADMIN: "Admin",
};

function InlineField({
  value,
  onSave,
  placeholder,
  multiline = false,
  className = "",
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  placeholder: string;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return multiline ? (
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        autoFocus
        rows={3}
        placeholder={placeholder}
        className={`bg-white/10 border border-amber-400/50 rounded-xl px-3 py-2 text-white text-sm outline-none resize-none w-full ${className}`}
      />
    ) : (
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        autoFocus
        placeholder={placeholder}
        className={`bg-white/10 border border-amber-400/50 rounded-xl px-3 py-1.5 text-white text-sm outline-none ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`cursor-text hover:opacity-80 transition-opacity group relative ${className}`}
      title="Cliquer pour modifier"
    >
      {value || <span className="text-white/25 italic text-xs">{placeholder}</span>}
      <span className="ml-1 opacity-0 group-hover:opacity-40 text-amber-400 text-xs transition-opacity">✎</span>
      {saving && <span className="ml-1 text-white/30 text-xs animate-pulse">•••</span>}
    </span>
  );
}

export default function ProfileHeader({ user: initialUser, hasBadge, isOwner }: Props) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function saveField(field: string, value: string) {
    setSaveError("");
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error || "Erreur lors de la sauvegarde");
      return;
    }
    setUser((prev) => ({ ...prev, ...data }));
    if (field === "username") router.replace(`/profil/${data.username}`);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    const uploadData = await uploadRes.json();
    if (uploadRes.ok) await saveField("avatar", uploadData.url);
    setAvatarLoading(false);
  }

  const bioText = user.bio ?? "";
  const bioShort = bioText.length > 100 ? bioText.slice(0, 100) + "..." : bioText;

  // Fermer le menu quand on clique ailleurs
  const handleClickOutside = () => {
    setShowOptions(false);
  };

  return (
    <div className="mb-6">

      {saveError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-xl mb-3">
          {saveError}
        </div>
      )}

      <div className="flex items-start gap-5">

        {/* ── Avatar ── */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-20 h-20 rounded-full overflow-hidden ring-2 ring-amber-400/60 ${isOwner ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
            onClick={() => isOwner && fileInputRef.current?.click()}
            title={isOwner ? "Changer la photo" : undefined}
          >
            {avatarLoading ? (
              <div className="w-full h-full bg-purple-800 flex items-center justify-center">
                <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            ) : user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-purple-700 flex items-center justify-center text-white text-2xl font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Icône caméra si owner */}
          {isOwner && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center border-2 border-[#3B0764] pointer-events-none">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="black">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4" fill="none" stroke="black" strokeWidth="2"/>
              </svg>
            </div>
          )}

          {/* Badge vérifié */}
          {user.isVerified && !isOwner && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#3B0764]">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* ── Infos ── */}
        <div className="flex-1 min-w-0">

          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Nom d'affichage — visible par tous, éditable si owner */}
              {isOwner ? (
                <InlineField
                  value={user.displayName ?? user.username}
                  onSave={(v) => saveField("displayName", v)}
                  placeholder="Votre prénom"
                  className="text-white font-black text-xl tracking-tight uppercase"
                />
              ) : (
                <h1 className="text-white font-black text-xl tracking-tight uppercase">
                  {user.displayName ?? user.username}
                </h1>
              )}

              {user.isVerified && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {hasBadge && (
                <span className="bg-amber-400/20 border border-amber-400/40 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ✦ CERTIFIÉ
                </span>
              )}
            </div>

            {/* Menu ⋮ pour les autres */}
            {!isOwner && (
              <div className="relative">
                <button 
                  onClick={() => setShowOptions((v) => !v)} 
                  className="text-white/40 hover:text-white p-1 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5"/>
                    <circle cx="12" cy="12" r="1.5"/>
                    <circle cx="12" cy="19" r="1.5"/>
                  </svg>
                </button>
                
                {showOptions && (
                  <>
                    {/* Overlay pour fermer en cliquant ailleurs */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={handleClickOutside}
                    />
                    
                    <div className="absolute right-0 top-8 bg-[#2A1356] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 w-44">
                      <button 
                        onClick={() => {
                          // Fonction de partage
                          navigator.clipboard.writeText(window.location.href);
                          setShowOptions(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <span>🔗</span>
                        Partager le profil
                      </button>
                      
                      {/* Séparateur */}
                      <div className="border-t border-white/10"></div>
                      
                      {/* Bouton de signalement avec ReportButton */}
                      <div className="w-full">
                        <ReportButton 
                          type="user" 
                          id={user.id} 
                          variant="text"
                          className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                        />
                      </div>
                      
                      {/* Bouton bloquer */}
                      <button 
                        onClick={() => {
                          // Fonction pour bloquer l'utilisateur
                          console.log("Bloquer", user.id);
                          setShowOptions(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <span>🚫</span>
                        Bloquer
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* @pseudo + catégorie */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* @pseudo — éditable si owner */}
            <span className="text-[#A78BFA] text-xs flex items-center gap-0.5">
              @{isOwner ? (
                <InlineField
                  value={user.username}
                  onSave={(v) => saveField("username", v)}
                  placeholder="pseudo"
                  className="text-[#A78BFA] text-xs"
                />
              ) : (
                <span>{user.username}</span>
              )}
            </span>
            {isOwner ? (
              <InlineField
                value={user.category ?? ""}
                onSave={(v) => saveField("category", v)}
                placeholder="+ catégorie"
                className="bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs px-2.5 py-0.5 rounded-full"
              />
            ) : (
              <span className="bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs px-2.5 py-0.5 rounded-full">
                {ROLE_LABEL[user.role]}{user.category ? ` ${user.category}` : ""}
              </span>
            )}
          </div>

          {/* Bio */}
          <div className="mt-2">
            {isOwner ? (
              <InlineField
                value={bioText}
                onSave={(v) => saveField("bio", v)}
                placeholder="Écrivez votre bio..."
                multiline
                className="text-white/70 text-sm leading-relaxed"
              />
            ) : (
              <>
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                  {bioExpanded ? bioText : bioShort}
                </p>
                {bioText.length > 100 && (
                  <button onClick={() => setBioExpanded((v) => !v)} className="text-amber-400/70 text-xs mt-0.5 hover:text-amber-400 transition-colors">
                    {bioExpanded ? "moins" : "plus"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Localisation */}
          {(isOwner || user.location) && (
            <div className="flex items-center gap-1.5 mt-2">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {isOwner ? (
                <InlineField value={user.location ?? ""} onSave={(v) => saveField("location", v)} placeholder="Ajouter une ville" className="text-white/40 text-xs" />
              ) : (
                <span className="text-white/40 text-xs">{user.location}</span>
              )}
            </div>
          )}

          {/* Website */}
          {(isOwner || user.website) && (
            <div className="flex items-center gap-1.5 mt-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 flex-shrink-0">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
              {isOwner ? (
                <InlineField value={user.website ?? ""} onSave={(v) => saveField("website", v)} placeholder="Ajouter un lien" className="text-amber-400/70 text-xs" />
              ) : (
                <a href={user.website!} target="_blank" rel="noopener noreferrer" className="text-amber-400/70 text-xs hover:text-amber-400 transition-colors truncate">
                  {user.website}
                </a>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}