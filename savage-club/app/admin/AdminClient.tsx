// app/admin/AdminClient.tsx
"use client";
import { useState } from "react";
import AdminStats           from "./components/AdminStats";
import AdminVerifications   from "./components/AdminVerifications";
import AdminVerified        from "./components/AdminVerified";
import AdminWithdrawals     from "./components/AdminWithdrawals";
import AdminMessages        from "./components/AdminMessages";

type User = {
  id: string; username: string; displayName: string | null;
  email: string; role: string; avatar: string | null;
  idDocumentUrl?: string | null; selfieUrl?: string | null;
  createdAt: Date;
};

type Stats = {
  totalUsers: number; totalCreators: number;
  verified:   number; pending:       number;
  totalPosts: number;
};

type Tab = "pending" | "verified" | "withdrawals" | "messages";

export default function AdminClient({
  pendingUsers, verifiedUsers, stats, systemUserId,
}: {
  pendingUsers:   User[];
  verifiedUsers:  User[];
  stats:          Stats;
  systemUserId:   string;
}) {
  const [tab,          setTab]          = useState<Tab>("pending");
  const [localPending, setLocalPending] = useState(pendingUsers);

  const TABS: { key: Tab; label: string }[] = [
    { key: "pending",     label: `Vérifications${localPending.length > 0 ? ` (${localPending.length})` : ""}` },
    { key: "verified",    label: `Vérifiés (${verifiedUsers.length})` },
    { key: "withdrawals", label: "Retraits" },
    { key: "messages",    label: "Messages" },
  ];

  return (
    <div className="flex min-h-screen bg-[#1a0533]">
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

          <AdminStats stats={stats}/>

          {/* Tabs */}
          <div className="flex gap-2 bg-white/5 rounded-xl p-1 flex-wrap">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.key ? "bg-amber-400 text-black" : "text-white/40 hover:text-white"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "pending"     && <AdminVerifications initialUsers={localPending}/>}
          {tab === "verified"    && <AdminVerified      users={verifiedUsers}/>}
          {tab === "withdrawals" && <AdminWithdrawals/>}
          {tab === "messages"    && <AdminMessages systemUserId={systemUserId}/>}
        </div>
      </main>
    </div>
  );
}
