// components/messages/MessageBubble.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import Avatar from "./Avatar";
import { formatTime, type Message } from "./types";

// ── Watermark pour les médias des messages ─────────────────────────────────
function MessageWatermark({ msgId }: { msgId: string }) {
  const { data: session, status } = useSession();
  const [token,     setToken]     = useState<string | null>(null);
  const [positions, setPositions] = useState<{ top: string; left: string }[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/media/token", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ msgId }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.token) setToken(data.token); })
      .catch(() => {});
  }, [msgId, status]);

  useEffect(() => {
    const generate = () => {
      setPositions(
        Array.from({ length: 5 }).map(() => ({
          top:  `${Math.random() * 80}%`,
          left: `${Math.random() * 80}%`,
        }))
      );
    };
    generate();
    const interval = setInterval(generate, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!session?.user || !token) return null;

  const text = `@${session.user.name ?? session.user.email} • ${token}`;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {positions.map((p, i) => (
        <span
          key={i}
          className="absolute text-white text-[10px] font-medium select-none transition-all duration-[4000ms]"
          style={{
            top:         p.top,
            left:        p.left,
            opacity:     0.18,
            textShadow:  "0 1px 2px rgba(0,0,0,0.8)",
            transform:   "rotate(-15deg)",
            whiteSpace:  "nowrap",
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

// ── Lightbox plein écran ───────────────────────────────────────────────────
function Lightbox({ url, msgId, onClose }: { url: string; msgId: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Conteneur relatif pour le watermark */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img
          src={url}
          alt=""
          className="max-w-[90vw] max-h-[90vh] object-contain"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        />
        <MessageWatermark msgId={msgId}/>
      </div>
    </div>
  );
}

// ── MessageBubble ──────────────────────────────────────────────────────────
export default function MessageBubble({
  msg, isMine, onDelete, onUnlock, isCreator,
}: {
  msg: Message;
  isMine: boolean;
  onDelete: (id: string, forEveryone: boolean) => void;
  onUnlock: (id: string) => void;
  isCreator: boolean;
}) {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [unlocking,  setUnlocking]  = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  async function handleUnlock() {
    setUnlocking(true);
    await onUnlock(msg.id);
    setUnlocking(false);
  }

  return (
    <>
      <div className={`flex items-end gap-2 group ${isMine ? "flex-row-reverse" : ""}`}>
        {!isMine && msg.sender && <Avatar user={msg.sender} size="7"/>}

        <div className={`max-w-[70%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>

          {/* Contenu verrouillé */}
          {msg.locked ? (
            <div className={`px-4 py-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 flex flex-col gap-2 ${
              isMine ? "rounded-br-sm" : "rounded-bl-sm"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">🔒</span>
                <span className="text-amber-400 text-sm font-medium">Contenu payant</span>
              </div>
              <p className="text-white/50 text-xs">
                {msg.price?.toLocaleString("fr-FR")} FCFA pour débloquer
              </p>
              {!isMine && (
                <button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                >
                  {unlocking ? "..." : "Débloquer"}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Image avec watermark + lightbox */}
              {msg.mediaUrl && msg.mediaType === "IMAGE" && (
                <div
                  className="relative rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => setLightboxUrl(msg.mediaUrl!)}
                  style={{ userSelect: "none", WebkitUserSelect: "none" }}
                >
                  <img
                    src={msg.mediaUrl}
                    alt=""
                    className="max-h-56 object-cover rounded-2xl"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <MessageWatermark msgId={msg.id}/>
                </div>
              )}

              {/* Vidéo avec watermark */}
              {msg.mediaUrl && msg.mediaType === "VIDEO" && (
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{ userSelect: "none", WebkitUserSelect: "none" }}
                >
                  <video
                    src={msg.mediaUrl}
                    controls
                    className="rounded-2xl max-h-56"
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <MessageWatermark msgId={msg.id}/>
                </div>
              )}

              {/* Document */}
              {msg.mediaUrl && msg.mediaType === "DOCUMENT" && (
                <a
                  href={msg.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-white/8 border border-white/10 rounded-2xl hover:bg-white/12 transition-all max-w-xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium truncate">{msg.content || "Document"}</p>
                    <p className="text-white/30 text-[10px] mt-0.5">Appuyer pour ouvrir</p>
                  </div>
                </a>
              )}
              
              {/* Texte */}
              {msg.content && (
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? "bg-amber-400 text-black rounded-br-sm font-medium"
                    : "bg-white/10 text-white rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              )}
            </>
          )}

          {/* Heure + menu */}
          <div className={`flex items-center gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
            <span className="text-white/20 text-[10px]">{formatTime(msg.createdAt)}</span>

            {(isMine || isCreator) && !msg.locked && (
              <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="text-white/20 hover:text-white/60 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}/>
                    <div className={`absolute z-20 bottom-full mb-1 bg-[#2D1B3F] border border-white/10 rounded-xl shadow-xl py-1 w-40 ${
                      isMine ? "right-0" : "left-0"
                    }`}>
                      <button
                        onClick={() => { onDelete(msg.id, false); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 text-xs transition-colors"
                      >
                        Supprimer pour moi
                      </button>
                      {(isMine || isCreator) && (
                        <button
                          onClick={() => { onDelete(msg.id, true); setMenuOpen(false); }}
                          className="w-full text-left px-3 py-2 text-red-400/70 hover:text-red-400 hover:bg-white/5 text-xs transition-colors"
                        >
                          Supprimer pour tous
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox plein écran */}
      {lightboxUrl && (
        <Lightbox url={lightboxUrl} msgId={msg.id} onClose={() => setLightboxUrl(null)}/>
      )}
    </>
  );
}
