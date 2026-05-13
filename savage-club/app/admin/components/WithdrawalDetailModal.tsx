// app/admin/components/WithdrawalDetailModal.tsx
"use client";
import UserAvatar from "./UserAvatar";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  SUBSCRIPTION:   "Abonnement",
  MESSAGE:        "Contenu payant",
  AUDIO_CALL:     "Appel audio",
  VIDEO_CALL:     "Appel vidéo",
  CUSTOM_CONTENT: "Contenu personnalisé",
};

type WithdrawalRequest = {
  id:             string;
  amount:         number;
  fee:            number;
  net:            number;
  phoneNumber:    string | null;
  withdrawMode:   string | null;
  walletBalance:  number;
  totalEarned:    number;
  totalWithdrawn: number;
  recentPayments: { id: string; amount: number; type: string; createdAt: string }[];
  user:           { id: string; username: string; displayName: string | null; email: string; avatar: string | null };
};

export default function WithdrawalDetailModal({
  withdrawal, onClose, onApprove, onReject, loading,
}: {
  withdrawal: WithdrawalRequest;
  onClose:    () => void;
  onApprove:  () => void;
  onReject:   () => void;
  loading:    boolean;
}) {
  const expectedMax    = withdrawal.totalEarned - withdrawal.totalWithdrawn;
  const isInconsistent = withdrawal.walletBalance > expectedMax * 1.05;

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
            {isInconsistent && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-red-400 font-bold text-sm">Incohérence détectée</p>
                  <p className="text-red-400/70 text-xs mt-0.5">
                    Le solde ({withdrawal.walletBalance.toLocaleString("fr-FR")} pts) dépasse le maximum attendu ({expectedMax.toLocaleString("fr-FR")} pts).
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <UserAvatar user={withdrawal.user}/>
              <div>
                <p className="text-white font-semibold text-sm">{withdrawal.user.displayName ?? withdrawal.user.username}</p>
                <p className="text-white/40 text-xs">{withdrawal.user.email}</p>
              </div>
            </div>

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

            <div className="flex gap-2 pt-1">
              <button onClick={onReject} disabled={loading}
                className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-30">
                ✕ Rejeter
              </button>
              <button onClick={onApprove} disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-30 text-white font-bold py-3 rounded-xl text-sm transition-all">
                {loading ? "..." : "✓ Valider"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
