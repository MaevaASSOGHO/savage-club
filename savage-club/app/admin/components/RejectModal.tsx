// app/admin/components/RejectModal.tsx
"use client";
import { useState } from "react";

type WithdrawalRequest = {
  id:     string;
  amount: number;
  phoneNumber: string | null;
  user: { displayName: string | null; username: string };
};

const REJECT_REASONS = [
  "Solde insuffisant pour couvrir le montant demandé",
  "Informations de compte Mobile Money incorrectes",
  "Activité suspecte détectée sur le compte",
  "Documents d'identité non vérifiés",
  "Montant dépasse le plafond autorisé",
  "Retrait trop fréquent — réessayez dans 24h",
];

export default function RejectModal({
  withdrawal, onClose, onConfirm,
}: {
  withdrawal: WithdrawalRequest;
  onClose:    () => void;
  onConfirm:  (reason: string, message: string) => void;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customMessage,  setCustomMessage]  = useState("");

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
            <div className="bg-white/5 border border-white/8 rounded-xl p-4 text-sm space-y-1">
              <p className="text-white font-semibold">{withdrawal.user.displayName ?? withdrawal.user.username}</p>
              <p className="text-white/40">{withdrawal.amount.toLocaleString("fr-FR")} FCFA · {withdrawal.phoneNumber}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Raison du rejet</p>
              <div className="space-y-2">
                {REJECT_REASONS.map((reason) => (
                  <button key={reason} onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${
                      selectedReason === reason
                        ? "bg-red-500/15 border-red-500/40 text-red-300"
                        : "bg-white/3 border-white/8 text-white/60 hover:border-white/20 hover:text-white"
                    }`}>
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Message complémentaire (optionnel)</p>
              <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Précisez si nécessaire..." rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-red-400/50 resize-none transition-colors"/>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-medium py-2.5 rounded-xl text-sm transition-all">
                Annuler
              </button>
              <button onClick={() => onConfirm(selectedReason, customMessage)} disabled={!selectedReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-30 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
