// app/onboarding/steps/StepMediaUpload.tsx
"use client";

import { useState } from "react";
import MediaSlot, { SlotConfig } from "../components/MediaSlot";

type Props = { role: string; onNext: () => void };

// ── Configuration des slots par rôle ─────────────────────────────────────────

const CREATOR_SLOTS: SlotConfig[] = [
  { id: "photo-public",       mediaType: "IMAGE",    visibility: "PUBLIC",      label: "Photo publique"       },
  { id: "photo-subscribers",  mediaType: "IMAGE",    visibility: "SUBSCRIBERS", label: "Photo abonnés"        },
  { id: "photo-paid",         mediaType: "IMAGE",    visibility: "PAID",        label: "Photo payante"        },
  { id: "video-public",       mediaType: "VIDEO",    visibility: "PUBLIC",      label: "Vidéo publique"       },
  { id: "video-subscribers",  mediaType: "VIDEO",    visibility: "SUBSCRIBERS", label: "Vidéo abonnés"        },
  { id: "video-paid",         mediaType: "VIDEO",    visibility: "PAID",        label: "Vidéo payante"        },
];

const TRAINER_SLOTS: SlotConfig[] = [
  { id: "photo-public",       mediaType: "IMAGE",    visibility: "PUBLIC",      label: "Photo publique"       },
  { id: "photo-subscribers",  mediaType: "IMAGE",    visibility: "SUBSCRIBERS", label: "Photo abonnés"        },
  { id: "video-public",       mediaType: "VIDEO",    visibility: "PUBLIC",      label: "Vidéo publique"       },
  { id: "video-subscribers",  mediaType: "VIDEO",    visibility: "SUBSCRIBERS", label: "Vidéo abonnés"        },
  { id: "doc-public",         mediaType: "DOCUMENT", visibility: "PUBLIC",      label: "Document public"      },
  { id: "doc-paid",           mediaType: "DOCUMENT", visibility: "PAID",        label: "Document payant"      },
];

export default function StepMediaUpload({ role, onNext }: Props) {
  const isTrainer = role === "TRAINER";
  const slots     = isTrainer ? TRAINER_SLOTS : CREATOR_SLOTS;

  const [uploaded, setUploaded] = useState<Record<string, string>>({}); // slotId → url
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const uploadedCount = Object.keys(uploaded).length;
  const allDone       = uploadedCount === slots.length;

  function handleUploaded(slotId: string, url: string) {
    setUploaded(prev => ({ ...prev, [slotId]: url }));
  }

  async function handleSave(skip = false) {
    setSaving(true);
    try {
      if (!skip) {
        // Envoyer les médias en DB
        const entries = slots
          .filter(s => uploaded[s.id])
          .map(s => ({
            url:        uploaded[s.id],
            type:       s.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
            visibility: s.visibility,
          }));
        await fetch("/api/onboarding/medias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ medias: entries }),
        });
      }
      onNext();
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  // Groupe les slots en lignes de 3 (grille 3 colonnes mobile)
  const rows: SlotConfig[][] = [];
  for (let i = 0; i < slots.length; i += 3) rows.push(slots.slice(i, i + 3));

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div>
        <h2 className="text-2xl font-bold text-white leading-tight">
          Publie tes<br />
          <span className="text-amber-400">premiers contenus</span>
        </h2>
        <p className="text-white/40 text-sm mt-1">
          {isTrainer
            ? "2 photos · 2 vidéos · 2 documents avec différents accès."
            : "3 photos · 3 vidéos avec différents niveaux d'accès."}
          {" "}Clique sur chaque case pour uploader.
        </p>
      </div>

      {/* Compteur */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${(uploadedCount / slots.length) * 100}%` }}
          />
        </div>
        <span className="text-white/50 text-xs tabular-nums flex-shrink-0">
          <span className={uploadedCount === slots.length ? "text-emerald-400 font-bold" : "text-white/80"}>
            {uploadedCount}
          </span>/{slots.length}
        </span>
      </div>

      {/* Grille des slots */}
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 gap-2.5">
          {row.map(slot => (
            <MediaSlot
              key={slot.id}
              slot={slot}
              uploaded={!!uploaded[slot.id]}
              thumbUrl={uploaded[slot.id]}
              onUploaded={handleUploaded}
            />
          ))}
        </div>
      ))}

      {/* Légende visibilité */}
      <div className="flex items-center justify-center gap-4">
        {[
          { color: "bg-emerald-400", label: "Public" },
          { color: "bg-violet-400",  label: "Abonnés" },
          { color: "bg-amber-400",   label: "Payant" },
        ].map(b => (
          <div key={b.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${b.color}`} />
            <span className="text-white/30 text-xs">{b.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs">
          {error}
        </div>
      )}

      <button
        onClick={() => handleSave(false)}
        disabled={!allDone || saving}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-amber-400/20"
      >
        {saving
          ? "Publication en cours…"
          : allDone
          ? "Publier et terminer →"
          : `Plus que ${slots.length - uploadedCount} média${slots.length - uploadedCount > 1 ? "s" : ""}`}
      </button>

      <button
        onClick={() => handleSave(true)}
        disabled={saving}
        className="text-white/25 text-xs hover:text-white/50 transition-colors text-center -mt-3"
      >
        Passer cette étape pour l'instant
      </button>
    </div>
  );
}
