// app/create/page.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type MediaPreview = {
  file: File;
  localUrl: string;
  type: "IMAGE" | "VIDEO";
  uploadedUrl: string | null;
  uploading: boolean;
  error: string | null;
};

const MAX_FILES = 6;

export default function CreatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [medias,      setMedias]      = useState<MediaPreview[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [content,     setContent]     = useState("");
  const [visibility,  setVisibility]  = useState("PUBLIC");
  const [price,       setPrice]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [isDragging,  setIsDragging]  = useState(false);

  // Accord créateur
  const [agreementChecked,  setAgreementChecked]  = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementLoading,  setAgreementLoading]  = useState(true);
  const [showRules,         setShowRules]         = useState(false);
  const canSetVisibility = user?.role === "CREATOR" || user?.role === "TRAINER";

  // Vérifier si déjà accepté
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/creator-agreement")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.accepted) setAgreementAccepted(true); })
      .catch(() => {})
      .finally(() => setAgreementLoading(false));
  }, [status]);

  function getMediaType(file: File): "IMAGE" | "VIDEO" {
    return file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
  }

  async function uploadFile(file: File, index: number) {
    setMedias((prev) => prev.map((m, i) => i === index ? { ...m, uploading: true, error: null } : m));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload échoué");
      setMedias((prev) => prev.map((m, i) => i === index ? { ...m, uploadedUrl: data.url, uploading: false } : m));
    } catch (err: any) {
      setMedias((prev) => prev.map((m, i) => i === index ? { ...m, error: err.message, uploading: false } : m));
    }
  }

  function addFiles(files: FileList | File[]) {
    const arr        = Array.from(files);
    const remaining  = MAX_FILES - medias.length;
    const toAdd      = arr.slice(0, remaining);
    const startIndex = medias.length;
    const newMedias: MediaPreview[] = toAdd.map((file) => ({
      file, localUrl: URL.createObjectURL(file),
      type: getMediaType(file), uploadedUrl: null, uploading: false, error: null,
    }));
    setMedias((prev) => [...prev, ...newMedias]);
    setActiveIndex(startIndex);
    toAdd.forEach((file, relIndex) => uploadFile(file, startIndex + relIndex));
  }

  function removeMedia(index: number) {
    setMedias((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex((prev) => Math.max(0, Math.min(prev, medias.length - 2)));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }, [medias.length]);

  async function handleSubmit() {
    if (!session) return router.push("/auth");
    if (medias.some((m) => m.uploading)) return;

    // Enregistrer l'accord si première fois
    if (!agreementAccepted && agreementChecked) {
      await fetch("/api/creator-agreement", { method: "POST" });
      setAgreementAccepted(true);
    }
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          visibility: canSetVisibility ? visibility : "PUBLIC",
          price: visibility === "PAID" && canSetVisibility ? price : null,
          medias: medias.map((m, i) => ({ url: m.uploadedUrl!, type: m.type, order: i })),
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la publication");
      router.push("/");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const allUploaded  = medias.every((m) => m.uploadedUrl && !m.uploading);
  const hasContent   = medias.length > 0 || content.trim().length > 0;
  const agreedToRules = agreementAccepted || agreementChecked;
  const canSubmit    = hasContent && !submitting && (medias.length === 0 || allUploaded) && agreedToRules;
  const isReel       = medias.length === 1 && medias[0].type === "VIDEO";

  return (
    <div className="flex min-h-screen bg-[#3B0764]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <h1 className="text-white font-bold text-base">
              {isReel ? "Nouveau réel" : "Nouveau post"}
            </h1>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold text-sm px-4 py-1.5 rounded-full transition-all"
            >
              {submitting ? "Publication..." : "Publier"}
            </button>
          </div>

          {/* Zone drop / preview */}
          {medias.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-2xl aspect-square flex flex-col items-center justify-center gap-3 cursor-pointer transition-all mb-4 ${
                isDragging ? "border-amber-400 bg-amber-400/10" : "border-white/15 hover:border-white/30"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 rounded-full bg-white/8 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="text-white/40 text-sm">Glissez vos fichiers ici</p>
              <p className="text-white/20 text-xs">Photos · Vidéos · max {MAX_FILES} fichiers</p>
            </div>
          ) : (
            <div className="mb-4">
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-white/30 text-[10px] uppercase tracking-wider font-medium">
                    {isReel ? "📱 Réel · Format 9:16" : medias.length > 1 ? `🖼 Carousel · ${medias.length} médias` : "🖼 Photo · Format natif"}
                  </span>
                </div>

                <div className={`relative overflow-hidden bg-black rounded-xl ${
                  isReel ? "aspect-[9/16]" : medias.length > 1 ? "aspect-square" : "aspect-[4/5]"
                }`}>
                  {medias[activeIndex]?.type === "VIDEO"
                    ? <video src={medias[activeIndex].localUrl} className="w-full h-full object-cover" muted playsInline autoPlay loop/>
                    : <img src={medias[activeIndex]?.localUrl} alt="" className="w-full h-full object-cover"/>
                  }
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {medias[activeIndex]?.uploading && (
                      <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Upload...
                      </span>
                    )}
                    {medias[activeIndex]?.uploadedUrl && <span className="bg-green-500/80 text-white text-xs px-2 py-1 rounded-full">✓ Prêt</span>}
                    {medias[activeIndex]?.error && <span className="bg-red-500/80 text-white text-xs px-2 py-1 rounded-full">⚠ Erreur</span>}
                  </div>
                  <button onClick={() => removeMedia(activeIndex)} className="absolute bottom-3 right-3 bg-black/60 hover:bg-red-500/80 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  {medias.length > 1 && activeIndex > 0 && (
                    <button onClick={() => setActiveIndex(activeIndex - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                  )}
                  {medias.length > 1 && activeIndex < medias.length - 1 && (
                    <button onClick={() => setActiveIndex(activeIndex + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  )}
                  {medias.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                      {medias.map((_, i) => (
                        <button key={i} onClick={() => setActiveIndex(i)} className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "bg-white w-3" : "bg-white/40 w-1.5"}`}/>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {medias.map((m, i) => (
                  <button key={i} onClick={() => setActiveIndex(i)}
                    className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === activeIndex ? "border-amber-400" : "border-transparent opacity-50 hover:opacity-80"}`}
                  >
                    {m.type === "VIDEO" ? <video src={m.localUrl} className="w-full h-full object-cover" muted playsInline/> : <img src={m.localUrl} alt="" className="w-full h-full object-cover"/>}
                    {m.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <svg className="animate-spin w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
                {medias.length < MAX_FILES && (
                  <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-white/20 hover:border-amber-400/50 flex items-center justify-center transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                )}
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />

          {/* Formulaire */}
          <div className="space-y-3 mt-4">
            <textarea
              value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Écrivez une légende..." rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/40 resize-none transition-colors"
            />

            {canSetVisibility && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "PUBLIC",      label: "Public",  icon: "🌍" },
                    { value: "SUBSCRIBERS", label: "Abonnés", icon: "🔒" },
                    { value: "PAID",        label: "Payant",  icon: "💰" },
                  ].map((v) => (
                    <button key={v.value} onClick={() => setVisibility(v.value)}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                        visibility === v.value ? "bg-amber-400/20 border border-amber-400/50 text-amber-400" : "bg-white/5 border border-white/10 text-white/50 hover:text-white/80"
                      }`}
                    >
                      <span className="text-base">{v.icon}</span>{v.label}
                    </button>
                  ))}
                </div>
                {visibility === "PAID" && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">FCFA</span>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Prix d'accès" min="0"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-14 pr-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/40 transition-colors"
                    />
                  </div>
                )}
              </>
            )}

            {isReel && (
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-amber-400/80 text-xs leading-relaxed">
                  Une vidéo seule sera classée comme un <strong className="text-amber-400">Réel</strong> sur votre profil.
                </p>
              </div>
            )}

            {/* ── Accord créateur ── */}
            {!agreementLoading && (
              agreementAccepted ? (
                <p className="text-white/20 text-xs text-center py-1">✓ Règles des créateurs acceptées</p>
              ) : (
                <div className="bg-white/3 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setAgreementChecked((v) => !v)}
                      className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all ${
                        agreementChecked ? "bg-amber-400 border-amber-400" : "border-white/20 hover:border-white/40"
                      }`}
                    >
                      {agreementChecked && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                    <p className="text-white/60 text-xs leading-relaxed">
                      J'ai lu et j'accepte les{" "}
                      <a
                        href="/rules"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
                      >
                        règles des créateurs
                      </a>
                      {" "}de Savage Club. Je m'engage à publier du contenu conforme à ces règles.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}