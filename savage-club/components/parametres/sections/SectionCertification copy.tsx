// components/parametres/sections/SectionCertification.tsx
"use client";

import { useState, useRef } from "react";
import Alert from "@/components/parametres/ui/Alert";
import SectionTitle from "@/components/parametres/ui/SectionTitle";

type Props = {
  user: {
    isVerified: boolean;
    idVerified: boolean;
    idDocumentUrl: string | null;
  };
};

function StatusBadge({ user }: { user: Props["user"] }) {
  const isVerified = user.isVerified;
  const isPending = !user.isVerified && !!user.idDocumentUrl;

  const config = isVerified
    ? { bg: "bg-green-500/10 border-green-500/20", dot: "bg-green-500", icon: "✓", label: "Compte certifié", desc: "Votre identité a été vérifiée par notre équipe.", color: "text-green-400" }
    : isPending
    ? { bg: "bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400", icon: "⏳", label: "En attente de validation", desc: "Notre équipe examine votre document (24-48h).", color: "text-amber-400" }
    : { bg: "bg-white/5 border-white/10", dot: "bg-white/20", icon: "?", label: "Non certifié", desc: "Envoyez une pièce d'identité pour être certifié.", color: "text-white/50" };

  return (
    <div className={`rounded-2xl p-4 flex items-center gap-3 border ${config.bg}`}>
      <div className={`w-8 h-8 rounded-full ${config.dot} flex items-center justify-center text-sm font-bold text-black`}>
        {config.icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
        <p className="text-white/30 text-xs">{config.desc}</p>
      </div>
    </div>
  );
}

export default function SectionCertification({ user }: Props) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      setStatus({ type: "error", msg: "Upload échoué" });
      setUploading(false);
      return;
    }

    const submitRes = await fetch("/api/parametres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit_identity", idDocumentUrl: uploadData.url }),
    });

    setUploading(false);
    setStatus(
      submitRes.ok
        ? { type: "success", msg: "Document envoyé ✓ En attente de validation par notre équipe." }
        : { type: "error", msg: "Erreur lors de l'envoi" }
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Certification du compte</SectionTitle>
      <p className="text-white/40 text-sm">
        Faites vérifier votre identité pour obtenir le badge certifié et débloquer
        toutes les fonctionnalités créateur.
      </p>

      <StatusBadge user={user} />

      {status && <Alert type={status.type} message={status.msg} />}

      {!user.isVerified && (
        <div className="space-y-3">
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
            <p className="text-white/60 text-xs font-medium">Documents acceptés :</p>
            <ul className="text-white/40 text-xs space-y-1">
              <li>• Carte nationale d'identité (recto-verso)</li>
              <li>• Passeport (page principale)</li>
              <li>• Permis de conduire</li>
            </ul>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleUpload}
          />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-white/20 hover:border-amber-400/40 disabled:opacity-50 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors group"
          >
            {uploading ? (
              <svg className="animate-spin w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 group-hover:text-amber-400/60 transition-colors">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
            <span className="text-white/30 group-hover:text-white/50 text-sm transition-colors">
              {uploading ? "Upload en cours..." : "Cliquez pour envoyer votre document"}
            </span>
            <span className="text-white/20 text-xs">JPG, PNG ou PDF · max 10MB</span>
          </button>
        </div>
      )}
    </div>
  );
}
