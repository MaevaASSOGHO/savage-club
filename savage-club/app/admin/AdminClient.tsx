// app/admin/AdminClient.tsx
"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

type User = {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  role: string;
  avatar: string | null;
  idDocumentUrl?: string | null;
  selfieUrl?: string | null;
  createdAt: Date;
};

type Stats = {
  totalUsers: number;
  totalCreators: number;
  verified: number;
  pending: number;
  totalPosts: number;
};

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-white font-black text-2xl">{value.toLocaleString("fr-FR")}</p>
        <p className="text-white/40 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function UserAvatar({ user }: { user: User }) {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-700 flex-shrink-0">
      {user.avatar
        ? <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
        : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
            {user.username[0].toUpperCase()}
          </div>
      }
    </div>
  );
}

export default function AdminClient({
  pendingUsers, verifiedUsers, stats,
}: {
  pendingUsers: User[];
  verifiedUsers: User[];
  stats: Stats;
}) {
  const [tab,          setTab]          = useState<"pending" | "verified">("pending");
  const [loading,      setLoading]      = useState<string | null>(null);
  const [previewUrls,  setPreviewUrls]  = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [localPending,  setLocalPending]  = useState(pendingUsers);
  const [localVerified, setLocalVerified] = useState(verifiedUsers);

  function openPreview(user: User) {
    const urls = [user.idDocumentUrl, user.selfieUrl].filter(Boolean) as string[];
    setPreviewUrls(urls);
    setPreviewIndex(0);
  }

  async function handleVerify(userId: string) {
    setLoading(userId);
    const res = await fetch("/api/admin/verify-identity", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId, approved: true }),
    });
    if (res.ok) {
      const user = localPending.find((u) => u.id === userId);
      if (user) {
        setLocalPending((prev) => prev.filter((u) => u.id !== userId));
        setLocalVerified((prev) => [{ ...user, idDocumentUrl: undefined, selfieUrl: undefined }, ...prev]);
      }
    }
    setLoading(null);
  }

  async function handleReject(userId: string) {
    const reason = prompt("Raison du rejet :") ?? "Document non conforme";
    if (!reason) return;
    setLoading(userId);
    const res = await fetch("/api/admin/reject-identity", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId, reason }),
    });
    if (res.ok) {
      setLocalPending((prev) => prev.filter((u) => u.id !== userId));
    }
    setLoading(null);
  }

  const LABELS = ["Pièce d'identité", "Selfie avec pièce"];

  return (
    <div className="flex min-h-screen bg-[#1a0533]">
      <Sidebar />
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-black text-2xl uppercase tracking-tight">Panel Admin</h1>
              <p className="text-white/30 text-sm mt-1">Gestion des créateurs et vérifications</p>
            </div>
            {localPending.length > 0 && (
              <div className="bg-amber-400 text-black font-black text-sm px-4 py-2 rounded-full animate-pulse">
                {localPending.length} en attente
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Utilisateurs" value={stats.totalUsers}    icon="👥" color="bg-purple-500/20"/>
            <StatCard label="Créateurs"    value={stats.totalCreators} icon="🎨" color="bg-blue-500/20"/>
            <StatCard label="Vérifiés"     value={stats.verified}      icon="✅" color="bg-green-500/20"/>
            <StatCard label="En attente"   value={stats.pending}       icon="⏳" color="bg-amber-400/20"/>
            <StatCard label="Publications" value={stats.totalPosts}    icon="📸" color="bg-pink-500/20"/>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white/5 rounded-xl p-1 w-fit">
            <button onClick={() => setTab("pending")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "pending" ? "bg-amber-400 text-black" : "text-white/40 hover:text-white"}`}>
              En attente {localPending.length > 0 && `(${localPending.length})`}
            </button>
            <button onClick={() => setTab("verified")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "verified" ? "bg-amber-400 text-black" : "text-white/40 hover:text-white"}`}>
              Vérifiés ({localVerified.length})
            </button>
          </div>

          {/* En attente */}
          {tab === "pending" && (
            <div className="space-y-3">
              {localPending.length === 0 ? (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
                  <span className="text-4xl">✅</span>
                  <p className="text-white/40 text-sm mt-3">Aucune demande en attente</p>
                </div>
              ) : localPending.map((user) => (
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
                    <button onClick={() => openPreview(user)}
                      className="bg-white/8 hover:bg-white/12 border border-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0">
                      📄 Voir docs ({[user.idDocumentUrl, user.selfieUrl].filter(Boolean).length})
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
          )}

          {/* Vérifiés */}
          {tab === "verified" && (
            <div className="space-y-3">
              {localVerified.map((user) => (
                <div key={user.id} className="bg-white/5 border border-white/8 rounded-2xl p-4 flex items-center gap-4">
                  <UserAvatar user={user}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{user.displayName ?? user.username}</p>
                      <span className="text-green-400 text-xs">✓ Vérifié</span>
                    </div>
                    <p className="text-white/40 text-xs">{user.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                    user.role === "CREATOR" ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"
                  }`}>
                    {user.role === "CREATOR" ? "Créateur" : "Formateur"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modale galerie documents */}
      {previewUrls.length > 0 && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setPreviewUrls([])}/>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl overflow-hidden max-w-2xl w-full">

              {/* Header modale */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <p className="text-white font-bold text-sm">
                    {LABELS[previewIndex] ?? "Document"}
                  </p>
                  {previewUrls.length > 1 && (
                    <span className="text-white/30 text-xs">
                      {previewIndex + 1} / {previewUrls.length}
                    </span>
                  )}
                </div>
                <button onClick={() => setPreviewUrls([])} className="text-white/30 hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Image */}
              <div className="relative p-4 max-h-[60vh] overflow-auto">
                <img
                  src={previewUrls[previewIndex]}
                  alt={LABELS[previewIndex]}
                  className="w-full rounded-xl object-contain"
                />
              </div>

              {/* Navigation */}
              {previewUrls.length > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/8">
                  <button
                    onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                    disabled={previewIndex === 0}
                    className="flex items-center gap-2 text-white/60 hover:text-white disabled:opacity-20 transition-colors text-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    Précédent
                  </button>

                  {/* Dots */}
                  <div className="flex gap-2">
                    {previewUrls.map((_, i) => (
                      <button key={i} onClick={() => setPreviewIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === previewIndex ? "bg-amber-400 w-4" : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setPreviewIndex((i) => Math.min(previewUrls.length - 1, i + 1))}
                    disabled={previewIndex === previewUrls.length - 1}
                    className="flex items-center gap-2 text-white/60 hover:text-white disabled:opacity-20 transition-colors text-sm"
                  >
                    Suivant
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
