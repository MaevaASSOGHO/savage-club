// app/onboarding/components/MediaSlot.tsx
"use client";

import { useRef, useState } from "react";

export type SlotConfig = {
  id:         string;       // ex: "photo-public"
  mediaType:  "IMAGE" | "VIDEO" | "DOCUMENT";
  visibility: "PUBLIC" | "SUBSCRIBERS" | "PAID";
  label:      string;       // ex: "Photo publique"
};

type Props = {
  slot:      SlotConfig;
  uploaded:  boolean;
  thumbUrl?: string;
  onUploaded: (slotId: string, url: string) => void;
};

const VISIBILITY_META = {
  PUBLIC:      { label: "Public",      color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  SUBSCRIBERS: { label: "Abonnés",     color: "text-violet-400",  bg: "bg-violet-400/10 border-violet-400/30"  },
  PAID:        { label: "Payant",       color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/30"    },
};

const MEDIA_ICONS = {
  IMAGE:    (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
  VIDEO:    (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15 10l4.553-2.07A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
    </svg>
  ),
  DOCUMENT: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </svg>
  ),
};

const CLOUD_NAME   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export default function MediaSlot({ slot, uploaded, thumbUrl, onUploaded }: Props) {
  const inputRef    = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const meta = VISIBILITY_META[slot.visibility];

  const accept =
    slot.mediaType === "IMAGE"    ? "image/*" :
    slot.mediaType === "VIDEO"    ? "video/*" :
    "application/pdf";

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "savage_club/onboarding");

      const resourceType =
        slot.mediaType === "VIDEO" ? "video" :
        slot.mediaType === "DOCUMENT" ? "raw" : "image";

      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload échoué");
      onUploaded(slot.id, data.secure_url);
    } catch {
      setError("Échec de l'upload, réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={() => !uploaded && !loading && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 aspect-[3/4] w-full overflow-hidden
        ${uploaded
          ? "border-emerald-500/40 bg-emerald-950/20"
          : "border-white/10 bg-white/5 hover:border-white/20 active:scale-[0.97]"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />

      {/* Miniature si uploadé */}
      {uploaded && thumbUrl && slot.mediaType !== "DOCUMENT" && (
        <img
          src={thumbUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      )}

      {/* Overlay contenu */}
      <div className={`relative z-10 flex flex-col items-center gap-2 px-2 text-center
        ${uploaded ? "bg-black/40 absolute inset-0 flex items-center justify-center" : ""}`}>

        {loading ? (
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        ) : uploaded ? (
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
        ) : (
          <div className="text-white/30">{MEDIA_ICONS[slot.mediaType]}</div>
        )}

        {/* Badge visibilité */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>

        {!uploaded && !loading && (
          <span className="text-white/40 text-[10px] leading-tight">
            {slot.label}
          </span>
        )}

        {error && (
          <span className="text-red-400 text-[9px] leading-tight">{error}</span>
        )}
      </div>
    </button>
  );
}
