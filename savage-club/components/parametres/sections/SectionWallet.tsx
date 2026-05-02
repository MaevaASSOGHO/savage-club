// components/parametres/sections/SectionWallet.tsx
"use client";

import { useEffect, useState } from "react";

type Transaction = {
  id:          string;
  amount:      number;
  type:        string;
  status:      string;
  description: string | null;
  createdAt:   string;
};

type Withdrawal = {
  id:          string;
  amount:      number;
  fee:         number;
  net:         number;
  status:      string;
  phoneNumber: string | null;
  createdAt:   string;
};

type WalletData = {
  balance:        number;
  pending:        number;
  totalEarned:    number;
  totalWithdrawn: number;
  transactions:   Transaction[];
  withdrawals:    Withdrawal[];
  canWithdraw:    boolean;
};

// Opérateurs par pays
const OPERATORS = [
  { value: "orange-money-ci", label: "Orange Money CI",  country: "ci" },
  { value: "mtn-ci",          label: "MTN MoMo CI",      country: "ci" },
  { value: "moov-ci",         label: "Moov Money CI",    country: "ci" },
  { value: "wave-ci",         label: "Wave CI",          country: "ci" },
  { value: "orange-money-senegal", label: "Orange Money SN", country: "sn" },
  { value: "wave-senegal",    label: "Wave SN",          country: "sn" },
  { value: "free-money-senegal", label: "Free Money SN", country: "sn" },
];

const TX_LABELS: Record<string, string> = {
  SUBSCRIPTION_EARNING: "Abonnement reçu",
  PPV_EARNING:          "Contenu débloqué",
  BOOKING_EARNING:      "Appel réservé",
  TIP_EARNING:          "Paiement reçu",
  WITHDRAWAL:           "Retrait",
  REFUND:               "Remboursement",
};

const TX_ICONS: Record<string, string> = {
  SUBSCRIPTION_EARNING: "💳",
  PPV_EARNING:          "🔓",
  BOOKING_EARNING:      "📞",
  TIP_EARNING:          "💰",
  WITHDRAWAL:           "↗️",
  REFUND:               "↩️",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "text-amber-400",
  PROCESSING: "text-blue-400",
  COMPLETED:  "text-green-400",
  FAILED:     "text-red-400",
  REJECTED:   "text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    "En attente",
  PROCESSING: "En cours",
  COMPLETED:  "Effectué",
  FAILED:     "Échoué",
  REJECTED:   "Rejeté",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function SectionWallet() {
  const [data,       setData]       = useState<WalletData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<"transactions" | "withdrawals">("transactions");
  const [showForm,   setShowForm]   = useState(false);
  const [amount,     setAmount]     = useState("");
  const [phone,      setPhone]      = useState("");
  const [operator,   setOperator]   = useState("orange-money-ci");
  const [country,    setCountry]    = useState("ci");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const res  = await fetch("/api/wallet/withdraw", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseInt(amount) }),
    });
    const d = await res.json();
    setSubmitting(false);

    if (!res.ok) { setError(d.error); return; }

    setSuccess(d.message);
    setShowForm(false);
    setAmount(""); setPhone("");

    const updated = await fetch("/api/wallet").then((r) => r.json());
    setData(updated);
  }

  const amountNum = parseInt(amount) || 0;
  const fee       = Math.round(amountNum * 0.02);
  const net       = amountNum - fee;
  const isManual  = amountNum >= 200000;

  const filteredOperators = OPERATORS.filter((op) => op.country === country);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg className="animate-spin w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">

      {/* Solde */}
      <div className="bg-gradient-to-br from-purple-900/40 to-amber-400/10 border border-amber-400/20 rounded-2xl p-6">
        <p className="text-white/50 text-sm mb-1">Solde disponible</p>
        <p className="text-amber-400 font-black text-4xl">
          {data.balance.toLocaleString("fr-FR")}
          <span className="text-lg ml-1 font-normal text-amber-400/60">pts</span>
        </p>
        <p className="text-white/30 text-xs mt-1">1 point = 1 FCFA</p>
        {data.pending > 0 && (
          <div className="mt-3 bg-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="text-amber-400 text-xs">⏳</span>
            <p className="text-white/40 text-xs">
              {data.pending.toLocaleString("fr-FR")} pts en cours de traitement
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/8 rounded-xl p-4">
          <p className="text-white/40 text-xs">Total gagné</p>
          <p className="text-white font-bold text-lg mt-1">{data.totalEarned.toLocaleString("fr-FR")} pts</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-xl p-4">
          <p className="text-white/40 text-xs">Total retiré</p>
          <p className="text-white font-bold text-lg mt-1">{data.totalWithdrawn.toLocaleString("fr-FR")} pts</p>
        </div>
      </div>

      {/* Retrait */}
      {data.canWithdraw && (
        <>
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {!showForm ? (
            <button onClick={() => setShowForm(true)} disabled={data.balance < 5000}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all">
              {data.balance < 5000
                ? `Retrait dès 5 000 pts (il vous manque ${(5000 - data.balance).toLocaleString("fr-FR")} pts)`
                : "Retirer mes points"}
            </button>
          ) : (
            <form onSubmit={handleWithdraw} className="bg-white/5 border border-white/8 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">Retrait Mobile Money</p>
                <button type="button" onClick={() => { setShowForm(false); setError(null); }}
                  className="text-white/30 hover:text-white text-sm transition-colors">Annuler</button>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">
                  Montant (min. 5 000 pts)
                </label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000" min="5000" max={data.balance} required
                  className="w-full bg-[#1E0A3C] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/50 transition-colors"/>
              </div>

              {/* Récap frais */}
              {amountNum >= 5000 && (
                <div className="bg-[#1E0A3C] border border-white/8 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Montant demandé</span>
                    <span className="text-white">{amountNum.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Frais MoneyFusion (2%)</span>
                    <span className="text-red-400">- {fee.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="h-px bg-white/8"/>
                  <div className="flex justify-between font-bold">
                    <span className="text-white">Vous recevrez</span>
                    <span className="text-amber-400">{net.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  {isManual && (
                    <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 mt-2">
                      <p className="text-amber-400/80 text-xs">
                        ⚠️ Montant ≥ 200 000 FCFA — validation admin requise (24-48h)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={submitting || amountNum < 5000}
                className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Traitement...
                  </>
                ) : "Confirmer le retrait"}
              </button>

              <p className="text-white/20 text-xs text-center">
                {isManual ? "Validation admin sous 24-48h" : "MoneyFusion vous contactera pour finaliser le retrait"}
              </p>
            </form>
          )}
        </>
      )}

      {/* Tabs historique */}
      <div className="flex gap-2 bg-white/5 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("transactions")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "transactions" ? "bg-amber-400 text-black" : "text-white/40 hover:text-white"}`}>
          Gains ({data.transactions.length})
        </button>
        <button onClick={() => setTab("withdrawals")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "withdrawals" ? "bg-amber-400 text-black" : "text-white/40 hover:text-white"}`}>
          Retraits ({data.withdrawals.length})
        </button>
      </div>

      {tab === "transactions" && (
        <div className="space-y-2">
          {data.transactions.length === 0 ? (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center">
              <p className="text-white/30 text-sm">Aucune transaction pour l'instant</p>
            </div>
          ) : data.transactions.map((tx) => (
            <div key={tx.id} className="bg-white/5 border border-white/8 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
                {TX_ICONS[tx.type] ?? "•"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{TX_LABELS[tx.type] ?? tx.type}</p>
                {tx.description && <p className="text-white/30 text-xs mt-0.5 truncate">{tx.description}</p>}
                <p className="text-white/20 text-xs mt-0.5">{formatDate(tx.createdAt)}</p>
              </div>
              <p className={`font-bold text-sm flex-shrink-0 ${tx.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("fr-FR")} pts
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "withdrawals" && (
        <div className="space-y-2">
          {data.withdrawals.length === 0 ? (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center">
              <p className="text-white/30 text-sm">Aucun retrait pour l'instant</p>
            </div>
          ) : data.withdrawals.map((w) => (
            <div key={w.id} className="bg-white/5 border border-white/8 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
                📱
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{w.phoneNumber}</p>
                <p className="text-white/30 text-xs mt-0.5">
                  Net : {w.net.toLocaleString("fr-FR")} FCFA · Frais : {w.fee.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-white/20 text-xs mt-0.5">{formatDate(w.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <p className="text-white font-bold text-sm">{w.amount.toLocaleString("fr-FR")} pts</p>
                <span className={`text-[10px] font-bold ${STATUS_COLORS[w.status] ?? "text-white/40"}`}>
                  {STATUS_LABELS[w.status] ?? w.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
