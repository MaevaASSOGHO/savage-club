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

type RecentPayment = {
  id:          string;
  amount:      number;
  type:        string;
  createdAt:   string;
};

type WithdrawalRequest = {
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
  user: {
    id:          string;
    username:    string;
    displayName: string | null;
    email:       string;
    avatar:      string | null;
  };
};

type Stats = {
  totalUsers:    number;
  totalCreators: number;
  verified:      number;
  pending:       number;
  totalPosts:    number;
};

const REJECT_REASONS = [
  "Solde insuffisant pour couvrir le montant demandé",
  "Informations de compte Mobile Money incorrectes",
  "Activité suspecte détectée sur le compte",
  "Documents d'identité non vérifiés",
  "Montant dépasse le plafond autorisé",
  "Retrait trop fréquent — réessayez dans 24h",
];

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  SUBSCRIPTION:   "Abonnement",
  MESSAGE:        "Contenu payant",
  AUDIO_CALL:     "Appel audio",
  VIDEO_CALL:     "Appel vidéo",
  CUSTOM_CONTENT: "Contenu personnalisé",
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

function UserAvatar({ user }: { user: User | WithdrawalRequest["user"] }) {
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

// ── Modale de rejet ────────────────────────────────────────────────────────
function RejectModal({
  withdrawal,
  onClose,
  onConfirm,
}: {
  withdrawal: WithdrawalRequest;
  onClose:    () => void;
  onConfirm:  (reason: string, message: string) => void;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customMessage,  setCustomMessage]  = useState("");

  const canConfirm = selectedReason.trim().length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-50" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <p className="text-white font-bold">Rejeter le retrait</p>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Récap du retrait */}
            <div className="bg-white/5 border border-white/8 rounded-xl p-4 text-sm space-y-1">
              <p className="text-white font-semibold">{withdrawal.user.displayName ?? withdrawal.user.username}</p>
              <p className="text-white/40">{withdrawal.amount.toLocaleString("fr-FR")} FCFA · {withdrawal.phoneNumber}</p>
            </div>

            {/* Raisons pré-écrites */}
            <div className="space-y-1.5">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Raison du rejet</p>
              <div className="space-y-2">
                {REJECT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${
                      selectedReason === reason
                        ? "bg-red-500/15 border-red-500/40 text-red-300"
                        : "bg-white/3 border-white/8 text-white/60 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Message personnalisé */}
            <div className="space-y-1.5">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
                Message complémentaire (optionnel)
              </p>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Précisez si nécessaire..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-red-400/50 resize-none transition-colors"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-medium py-2.5 rounded-xl text-sm transition-all">
                Annuler
              </button>
              <button
                onClick={() => onConfirm(selectedReason, customMessage)}
                disabled={!canConfirm}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-30 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Modale détail retrait ──────────────────────────────────────────────────
function WithdrawalDetailModal({
  withdrawal,
  onClose,
  onApprove,
  onReject,
  loading,
}: {
  withdrawal: WithdrawalRequest;
  onClose:    () => void;
  onApprove:  () => void;
  onReject:   () => void;
  loading:    boolean;
}) {
  // Vérification de sécurité — solde cohérent avec les gains
  const expectedMax  = withdrawal.totalEarned - withdrawal.totalWithdrawn;
  const isInconsistent = withdrawal.walletBalance > expectedMax * 1.05; // tolérance 5%

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-50" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <p className="text-white font-bold">Détail du retrait</p>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

            {/* Alerte sécurité */}
            {isInconsistent && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-red-400 font-bold text-sm">Incohérence détectée</p>
                  <p className="text-red-400/70 text-xs mt-0.5">
                    Le solde ({withdrawal.walletBalance.toLocaleString("fr-FR")} pts) dépasse le maximum attendu ({expectedMax.toLocaleString("fr-FR")} pts). Vérifiez avant de valider.
                  </p>
                </div>
              </div>
            )}

            {/* Infos utilisateur */}
            <div className="flex items-center gap-3">
              <UserAvatar user={withdrawal.user}/>
              <div>
                <p className="text-white font-semibold text-sm">{withdrawal.user.displayName ?? withdrawal.user.username}</p>
                <p className="text-white/40 text-xs">{withdrawal.user.email}</p>
              </div>
            </div>

            {/* Infos retrait */}
            <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Détails du retrait</p>
              <div className="flex justify-between">
                <span className="text-white/40">Montant demandé</span>
                <span className="text-white font-bold">{withdrawal.amount.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Frais MF (2%)</span>
                <span className="text-red-400">- {withdrawal.fee.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="h-px bg-white/8"/>
              <div className="flex justify-between font-bold">
                <span className="text-white">À envoyer</span>
                <span className="text-amber-400 text-base">{withdrawal.net.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="h-px bg-white/8"/>
              <div className="flex justify-between">
                <span className="text-white/40">Numéro</span>
                <span className="text-white font-mono">{withdrawal.phoneNumber}</span>
              </div>
              {withdrawal.withdrawMode && (
                <div className="flex justify-between">
                  <span className="text-white/40">Opérateur</span>
                  <span className="text-white">{withdrawal.withdrawMode}</span>
                </div>
              )}
            </div>

            {/* Solde & stats wallet */}
            <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Portefeuille</p>
              <div className="flex justify-between">
                <span className="text-white/40">Solde actuel</span>
                <span className={`font-bold ${isInconsistent ? "text-red-400" : "text-green-400"}`}>
                  {withdrawal.walletBalance.toLocaleString("fr-FR")} pts
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Total gagné</span>
                <span className="text-white">{withdrawal.totalEarned.toLocaleString("fr-FR")} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Total retiré</span>
                <span className="text-white">{withdrawal.totalWithdrawn.toLocaleString("fr-FR")} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Solde attendu max</span>
                <span className="text-white/60">{expectedMax.toLocaleString("fr-FR")} pts</span>
              </div>
            </div>

            {/* Dernières ventes */}
            {withdrawal.recentPayments.length > 0 && (
              <div className="bg-white/5 border border-white/8 rounded-xl p-4">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">5 dernières ventes</p>
                <div className="space-y-2">
                  {withdrawal.recentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-white/50">
                        {PAYMENT_TYPE_LABELS[p.type] ?? p.type} — {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="text-green-400 font-medium">+{p.amount.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button onClick={onReject} disabled={loading}
                className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-30">
                ✕ Rejeter
              </button>
              <button onClick={onApprove} disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-30 text-white font-bold py-3 rounded-xl text-sm transition-all">
                {loading ? "..." : "✓ Valider le retrait"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── AdminClient principal ──────────────────────────────────────────────────
export default function AdminClient({
  pendingUsers, verifiedUsers, stats,
}: {
  pendingUsers: User[];
  verifiedUsers: User[];
  stats: Stats;
}) {
  const [tab,          setTab]          = useState<"pending" | "verified" | "withdrawals">("pending");
  const [loading,      setLoading]      = useState<string | null>(null);
  const [previewUrls,  setPreviewUrls]  = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [localPending,  setLocalPending]  = useState(pendingUsers);
  const [localVerified, setLocalVerified] = useState(verifiedUsers);
  const [withdrawals,   setWithdrawals]   = useState<WithdrawalRequest[]>([]);
  const [wLoading,      setWLoading]      = useState(false);
  const [wLoaded,       setWLoaded]       = useState(false);

  // Modales
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectWithdrawal,   setRejectWithdrawal]   = useState<WithdrawalRequest | null>(null);

  function openPreview(user: User) {
    const urls = [user.idDocumentUrl, user.selfieUrl].filter(Boolean) as string[];
    setPreviewUrls(urls);
    setPreviewIndex(0);
  }

  async function loadWithdrawals() {
    if (wLoaded) return;
    setWLoading(true);
    const res  = await fetch("/api/admin/withdrawals");
    const data = await res.json();
    setWithdrawals(Array.isArray(data) ? data : []);
    setWLoaded(true);
    setWLoading(false);
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
    if (res.ok) setLocalPending((prev) => prev.filter((u) => u.id !== userId));
    setLoading(null);
  }

  async function handleApproveWithdrawal(withdrawalId: string) {
    setLoading(withdrawalId);
    const res = await fetch("/api/admin/withdrawals", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ withdrawalId, action: "approve" }),
    });
    if (res.ok) {
      setWithdrawals((prev) => prev.filter((w) => w.id !== withdrawalId));
      setSelectedWithdrawal(null);
    }
    setLoading(null);
  }

  async function handleRejectWithdrawal(withdrawalId: string, reason: string, message: string) {
    setLoading(withdrawalId);
    const res = await fetch("/api/admin/withdrawals", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ withdrawalId, action: "reject", reason, message }),
    });
    if (res.ok) {
      setWithdrawals((prev) => prev.filter((w) => w.id !== withdrawalId));
      setRejectWithdrawal(null);
      setSelectedWithdrawal(null);
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
            <StatCard label="Utilisateurs"  value={stats.totalUsers}    icon="👥" color="bg-purple-500/20"/>
            <StatCard label="Créateurs"     value={stats.totalCreators} icon="🎨" color="bg-blue-500/20"/>
            <StatCard label="Vérifiés"      value={stats.verified}      icon="✅" color="bg-green-500/20"/>
            <StatCard label="En attente"    value={stats.pending}       icon="⏳" color="bg-amber-400/20"/>
            <StatCard label="Publications"  value={stats.totalPosts}    icon="📸" color="bg-pink-500/20"/>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white/5 rounded-xl p-1 w-fit flex-wrap">
            <button onClick={() => setTab("pending")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "pending" ? "bg-amber-400 text-black" : "text-white/40 hover:text-white"}`}>
              Vérifications {localPending.length > 0 && `(${localPending.length})`}
            </button>
            <button onClick={() => setTab("verified")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "verified" ? "bg-amber-400 text-black" : "text-white/40 hover:text-white"}`}>
              Vérifiés ({localVerified.length})
            </button>
            <button onClick={() => { setTab("withdrawals"); loadWithdrawals(); }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "withdrawals" ? "bg-amber-400 text-black" : "text-white/40 hover:text-white"}`}>
              Retraits {withdrawals.length > 0 && `(${withdrawals.length})`}
            </button>
          </div>

          {/* Vérifications en attente */}
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

          {/* Retraits */}
          {tab === "withdrawals" && (
            <div className="space-y-3">
              {wLoading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
                  <span className="text-4xl">💸</span>
                  <p className="text-white/40 text-sm mt-3">Aucun retrait en attente</p>
                </div>
              ) : withdrawals.map((w) => {
                const expectedMax    = w.totalEarned - w.totalWithdrawn;
                const isInconsistent = w.walletBalance > expectedMax * 1.05;

                return (
                  <div key={w.id}
                    className={`bg-white/5 border rounded-2xl p-5 space-y-3 ${
                      isInconsistent ? "border-red-500/40" : "border-white/8"
                    }`}>
                    {/* Alerte sécurité */}
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
                      <button
                        onClick={() => setSelectedWithdrawal(w)}
                        className="bg-white/8 hover:bg-white/12 border border-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0">
                        Voir détails
                      </button>
                    </div>

                    {/* Infos clés */}
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
                      <button onClick={() => setRejectWithdrawal(w)} disabled={loading === w.id}
                        className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold py-2 rounded-xl text-xs transition-all disabled:opacity-30">
                        ✕ Rejeter
                      </button>
                      <button onClick={() => handleApproveWithdrawal(w.id)} disabled={loading === w.id}
                        className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-30 text-white font-bold py-2 rounded-xl text-xs transition-all">
                        {loading === w.id ? "..." : "✓ Valider"}
                      </button>
                    </div>
                  </div>
                );
              })}
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
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <p className="text-white font-bold text-sm">{LABELS[previewIndex] ?? "Document"}</p>
                  {previewUrls.length > 1 && (
                    <span className="text-white/30 text-xs">{previewIndex + 1} / {previewUrls.length}</span>
                  )}
                </div>
                <button onClick={() => setPreviewUrls([])} className="text-white/30 hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="relative p-4 max-h-[60vh] overflow-auto">
                <img src={previewUrls[previewIndex]} alt={LABELS[previewIndex]}
                  className="w-full rounded-xl object-contain"/>
              </div>
              {previewUrls.length > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/8">
                  <button onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                    disabled={previewIndex === 0}
                    className="flex items-center gap-2 text-white/60 hover:text-white disabled:opacity-20 transition-colors text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    Précédent
                  </button>
                  <div className="flex gap-2">
                    {previewUrls.map((_, i) => (
                      <button key={i} onClick={() => setPreviewIndex(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === previewIndex ? "bg-amber-400 w-4" : "bg-white/20 w-2"
                        }`}/>
                    ))}
                  </div>
                  <button onClick={() => setPreviewIndex((i) => Math.min(previewUrls.length - 1, i + 1))}
                    disabled={previewIndex === previewUrls.length - 1}
                    className="flex items-center gap-2 text-white/60 hover:text-white disabled:opacity-20 transition-colors text-sm">
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

      {/* Modale détail retrait */}
      {selectedWithdrawal && (
        <WithdrawalDetailModal
          withdrawal={selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
          onApprove={() => handleApproveWithdrawal(selectedWithdrawal.id)}
          onReject={() => { setRejectWithdrawal(selectedWithdrawal); setSelectedWithdrawal(null); }}
          loading={loading === selectedWithdrawal.id}
        />
      )}

      {/* Modale rejet */}
      {rejectWithdrawal && (
        <RejectModal
          withdrawal={rejectWithdrawal}
          onClose={() => setRejectWithdrawal(null)}
          onConfirm={(reason, message) => handleRejectWithdrawal(rejectWithdrawal.id, reason, message)}
        />
      )}
    </div>
  );
}
