// components/messages/MessageBubble.tsx
"use client";

import { useState } from "react";
import Avatar from "./Avatar";
import { formatTime, type Message } from "./types";

export default function MessageBubble({
  msg, isMine, onDelete, onUnlock, isCreator,
}: {
  msg: Message;
  isMine: boolean;
  onDelete: (id: string, forEveryone: boolean) => void;
  onUnlock: (id: string) => void;
  isCreator: boolean;
}) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  async function handleUnlock() {
    setUnlocking(true);
    await onUnlock(msg.id);
    setUnlocking(false);
  }

  return (
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
            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
            >
              {unlocking ? "..." : "Débloquer"}
            </button>
          </div>
        ) : (
          <>
            {msg.mediaUrl && msg.mediaType === "IMAGE" && (
              <img src={msg.mediaUrl} alt="" className="rounded-2xl max-h-56 object-cover cursor-pointer"/>
            )}
            {msg.mediaUrl && msg.mediaType === "VIDEO" && (
              <video src={msg.mediaUrl} controls className="rounded-2xl max-h-56"/>
            )}
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
  );
}
