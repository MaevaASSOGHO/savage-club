// app/admin/components/AdminWithdrawals.tsx
"use client";
import { useEffect, useState } from "react";
import UserAvatar from "./UserAvatar";
import WithdrawalDetailModal from "./WithdrawalDetailModal";
import RejectModal from "./RejectModal";

type RecentPayment = { id: string; amount: number; type: string; createdAt: string };

export type WithdrawalRequest = {
  id:             string;
  amount:         number;
  fee:            number;
  net:            number;
  status:         string;
  phoneNumber:    string | null;
  withdrawMode:   string | null;
  createdAt:      string;
  walletBalance:  number;
  totalEarned:    number;
  totalWithdrawn: number;
  recentPayments: RecentPayment[];
  user: { id: string; username: string; displayName: string | null; email: string; avatar: string | null };
};

export default function AdminWithdrawals() {
  const [withdrawals,        setWithdrawals]        = useState<WithdrawalRequest[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [actionLoading,      setActionLoading]      = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectWithdrawal,   setRejectWithdrawal]   = useState<WithdrawalRequest | null>(null);

  useEffect(() => {
    fetch("/api/admin/withdrawals")
      .then((r) => r.json())
      .then((d) => setWithdrawals(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(withdrawalId: string) {
    setActionLoading(withdrawalId);
    const res = await fetch("/api/admin/withdrawals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, action: "approve" }),
    });
    if (res.ok) {
      setWithdrawals((prev) => prev.filter((w) => w.id !== withdrawalId));
      setSelectedWithdrawal(null);
    }
    setActionLoading(null);
  }

  async function handleReject(withdrawalId: string, reason: string, message: string) {
    setActionLoading(withdrawalId);
    const res = await fetch("/api/admin/withdrawals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, action: "reject", reason, message }),
    });
    if (res.ok) {
      setWithdrawals((prev) => prev.filter((w) => w.id !== withdrawalId));
      setRejectWithdrawal(null);
      setSelectedWithdrawal(null);
    }
    setActionLoading(null);
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <svg className="animate-spin w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  if (withdrawals.length === 0) return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
      <span className="text-4xl">💸</span>
      <p className="text-white/40 text-sm mt-3">Aucun retrait en attente</p>
    </div>
  );

  return (
    <>
      <div className="space-y-3">
        {withdrawals.map((w) => {
          const expectedMax    = w.totalEarned - w.totalWithdrawn;
          const isInconsistent = w.walletBalance > expectedMax * 1.05;

          return (
            <div key={w.id} className={`bg-white/5 border rounded-2xl p-5 space-y-3 ${isInconsistent ? "border-red-500/40" : "border-white/8"}`}>
              {isInconsistent && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-red-400">⚠️</span>
                  <p className="text-red-400 text-xs font-medium">Incohérence de solde — vérifier avant de valider</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                <UserAvatar user={w.user}/>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{w.user.displayName ?? w.user.username}</p>
                  <p className="text-white/40 text-xs">{w.user.email}</p>
                </div>
                <button onClick={() => setSelectedWithdrawal(w)}
                  className="bg-white/8 hover:bg-white/12 border border-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0">
                  Voir détails
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
                  <p className="text-white/40">À envoyer</p>
                  <p className="text-amber-400 font-black text-base">{w.net.toLocaleString("fr-FR")} FCFA</p>
                </div>
                <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-2">
                  <p className="text-white/40">Numéro</p>
                  <p className="text-white font-mono text-sm">{w.phoneNumber}</p>
                  {w.withdrawMode && <p className="text-white/30 text-[10px]">{w.withdrawMode}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white/3 rounded-xl px-3 py-2 text-center">
                  <p className="text-white/30">Solde</p>
                  <p className={`font-bold ${isInconsistent ? "text-red-400" : "text-white"}`}>
                    {w.walletBalance.toLocaleString("fr-FR")} pts
                  </p>
                </div>
                <div className="bg-white/3 rounded-xl px-3 py-2 text-center">
                  <p className="text-white/30">Total gagné</p>
                  <p className="text-white font-bold">{w.totalEarned.toLocaleString("fr-FR")} pts</p>
                </div>
                <div className="bg-white/3 rounded-xl px-3 py-2 text-center">
                  <p className="text-white/30">Total retiré</p>
                  <p className="text-white font-bold">{w.totalWithdrawn.toLocaleString("fr-FR")} pts</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setRejectWithdrawal(w)} disabled={actionLoading === w.id}
                  className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold py-2 rounded-xl text-xs transition-all disabled:opacity-30">
                  ✕ Rejeter
                </button>
                <button onClick={() => handleApprove(w.id)} disabled={actionLoading === w.id}
                  className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-30 text-white font-bold py-2 rounded-xl text-xs transition-all">
                  {actionLoading === w.id ? "..." : "✓ Valider"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedWithdrawal && (
        <WithdrawalDetailModal
          withdrawal={selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
          onApprove={() => handleApprove(selectedWithdrawal.id)}
          onReject={() => { setRejectWithdrawal(selectedWithdrawal); setSelectedWithdrawal(null); }}
          loading={actionLoading === selectedWithdrawal.id}
        />
      )}

      {rejectWithdrawal && (
        <RejectModal
          withdrawal={rejectWithdrawal}
          onClose={() => setRejectWithdrawal(null)}
          onConfirm={(reason, message) => handleReject(rejectWithdrawal.id, reason, message)}
        />
      )}
    </>
  );
}
