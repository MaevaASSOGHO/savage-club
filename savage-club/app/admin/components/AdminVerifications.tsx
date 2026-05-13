// app/admin/components/AdminVerifications.tsx
"use client";
import { useState } from "react";
import UserAvatar from "./UserAvatar";

type User = {
  id: string; username: string; displayName: string | null;
  email: string; role: string; avatar: string | null;
  idDocumentUrl?: string | null; selfieUrl?: string | null;
};

const LABELS = ["Pièce d'identité", "Selfie avec pièce"];

export default function AdminVerifications({ initialUsers }: { initialUsers: User[] }) {
  const [users,        setUsers]        = useState(initialUsers);
  const [loading,      setLoading]      = useState<string | null>(null);
  const [previewUrls,  setPreviewUrls]  = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  async function handleVerify(userId: string) {
    setLoading(userId);
    const res = await fetch("/api/admin/verify-identity", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, approved: true }),
    });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== userId));
    setLoading(null);
  }

  async function handleReject(userId: string) {
    const reason = prompt("Raison du rejet :") ?? "Document non conforme";
    if (!reason) return;
    setLoading(userId);
    const res = await fetch("/api/admin/reject-identity", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason }),
    });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== userId));
    setLoading(null);
  }

  return (
    <>
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-white/40 text-sm mt-3">Aucune demande en attente</p>
          </div>
        ) : users.map((user) => (
          <div key={user.id} className="bg-white/5 border border-white/8 rounded-2xl p-5 flex items-center gap-4">
            <UserAvatar user={user}/>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-semibold text-sm">{user.displayName ?? user.username}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  user.role === "CREATOR" ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"
                }`}>
                  {user.role === "CREATOR" ? "Créateur" : "Formateur"}
                </span>
              </div>
              <p className="text-white/40 text-xs mt-0.5">{user.email}</p>
              <p className="text-white/20 text-xs">@{user.username}</p>
            </div>
            {(user.idDocumentUrl || user.selfieUrl) && (
              <button onClick={() => {
                setPreviewUrls([user.idDocumentUrl, user.selfieUrl].filter(Boolean) as string[]);
                setPreviewIndex(0);
              }}
                className="bg-white/8 hover:bg-white/12 border border-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0">
                📄 Voir docs
              </button>
            )}
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => handleVerify(user.id)} disabled={loading === user.id}
                className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all">
                {loading === user.id ? "..." : "✓ Valider"}
              </button>
              <button onClick={() => handleReject(user.id)} disabled={loading === user.id}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold text-xs px-4 py-2 rounded-xl transition-all">
                ✕ Rejeter
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewUrls.length > 0 && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setPreviewUrls([])}/>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl overflow-hidden max-w-2xl w-full">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <p className="text-white font-bold text-sm">{LABELS[previewIndex] ?? "Document"}</p>
                  {previewUrls.length > 1 && <span className="text-white/30 text-xs">{previewIndex + 1} / {previewUrls.length}</span>}
                </div>
                <button onClick={() => setPreviewUrls([])} className="text-white/30 hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-auto">
                <img src={previewUrls[previewIndex]} alt="" className="w-full rounded-xl object-contain"/>
              </div>
              {previewUrls.length > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/8">
                  <button onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))} disabled={previewIndex === 0}
                    className="text-white/60 hover:text-white disabled:opacity-20 text-sm flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                    Précédent
                  </button>
                  <button onClick={() => setPreviewIndex((i) => Math.min(previewUrls.length - 1, i + 1))} disabled={previewIndex === previewUrls.length - 1}
                    className="text-white/60 hover:text-white disabled:opacity-20 text-sm flex items-center gap-2">
                    Suivant
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
