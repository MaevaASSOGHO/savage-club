"use client";

import { useState } from "react";
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
    ? { bg: "bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400", icon: "⏳", label: "En attente de validation", desc: "Notre équipe examine vos documents (24-48h).", color: "text-amber-400" }
    : { bg: "bg-white/5 border-white/10", dot: "bg-white/20", icon: "?", label: "Non certifié", desc: "Envoyez vos documents pour être certifié.", color: "text-white/50" };

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

  const [document, setDocument] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  function handleFile(file: File, type: "document" | "selfie") {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setStatus({ type: "error", msg: "Format invalide" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatus({ type: "error", msg: "Fichier trop lourd (max 10MB)" });
      return;
    }

    const preview = URL.createObjectURL(file);

    if (type === "document") {
      setDocument(file);
      setDocumentPreview(preview);
    } else {
      setSelfie(file);
      setSelfiePreview(preview);
    }
  }

  async function handleSubmit() {
    if (!document || !selfie) {
      setStatus({ type: "error", msg: "Les deux fichiers sont obligatoires" });
      return;
    }

    setUploading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("document", document);
      formData.append("selfie", selfie);

      const res = await fetch("/api/verify-identity", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      setStatus({ type: "success", msg: "Documents envoyés. Vérification en cours." });
    } catch {
      setStatus({ type: "error", msg: "Erreur lors de l'envoi" });
    }

    setUploading(false);
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Certification du compte</SectionTitle>

      <p className="text-white/40 text-sm">
        Pour devenir créateur ou formateur, vous devez valider votre identité.
      </p>

      <StatusBadge user={user} />

      {status && <Alert type={status.type} message={status.msg} />}

      {!user.isVerified && (
        <div className="space-y-4">
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
            <p className="text-white/60 text-xs font-medium">Documents requis :</p>
            <ul className="text-white/40 text-xs space-y-1">
              <li>• Une pièce d'identité valide</li>
              <li>• Une photo de vous tenant cette pièce</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer">
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files && handleFile(e.target.files[0], "document")}
              />
              <p className="text-xs text-white/40">Pièce d'identité</p>
            </label>

            <label className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFile(e.target.files[0], "selfie")}
              />
              <p className="text-xs text-white/40">Selfie avec pièce</p>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-xl p-2">
              {documentPreview ? (
                <img src={documentPreview} className="rounded-lg" />
              ) : (
                <p className="text-xs text-white/30">Aucun document</p>
              )}
            </div>

            <div className="border rounded-xl p-2">
              {selfiePreview ? (
                <img src={selfiePreview} className="rounded-lg" />
              ) : (
                <p className="text-xs text-white/30">Aucun selfie</p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!document || !selfie || uploading}
            className="w-full bg-amber-400 text-black py-3 rounded-xl disabled:opacity-40"
          >
            {uploading ? "Envoi..." : "Envoyer pour vérification"}
          </button>

          <p className="text-xs text-white/30 text-center">
            ⚠️ Les deux fichiers sont obligatoires pour activer votre compte créateur.
          </p>
        </div>
      )}
    </div>
  );
}
