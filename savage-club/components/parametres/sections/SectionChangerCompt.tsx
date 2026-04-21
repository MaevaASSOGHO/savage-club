// components/parametres/sections/SectionChangerCompte.tsx
"use client";

import { useState } from "react";
import SaveButton from "@/components/parametres/ui/SaveButton";
import Alert from "@/components/parametres/ui/Alert";
import SectionTitle from "@/components/parametres/ui/SectionTitle";

type Props = {
  user: {
    role: string;
  };
};

const ROLE_LABEL: Record<string, string> = {
  USER: "Membre",
  CREATOR: "Créateur",
  TRAINER: "Formateur",
};

const ROLES = [
  {
    key: "USER",
    label: "Membre",
    icon: "👤",
    desc: "Consommez du contenu, suivez des créateurs.",
    needsVerif: false,
  },
  {
    key: "CREATOR",
    label: "Créateur",
    icon: "🎨",
    desc: "Publiez du contenu, monétisez votre audience.",
    needsVerif: true,
  },
  {
    key: "TRAINER",
    label: "Formateur",
    icon: "🎓",
    desc: "Proposez des formations et sessions.",
    needsVerif: true,
  },
];

export default function SectionChangerCompte({ user }: Props) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const available = ROLES.filter((r) => r.key !== user.role);
  const selected = ROLES.find((r) => r.key === selectedRole);

  async function handleChange() {
    if (!selectedRole || !confirmed) return;
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/parametres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_role", newRole: selectedRole }),
    });
    const data = await res.json();
    setLoading(false);
    setStatus(
      res.ok
        ? {
            type: "success",
            msg: `Compte changé en ${ROLE_LABEL[selectedRole]} ✓ Reconnectez-vous pour voir les changements.`,
          }
        : { type: "error", msg: data.error || "Erreur" }
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Changer de type de compte</SectionTitle>
      <p className="text-white/40 text-sm">
        Compte actuel :{" "}
        <span className="text-amber-400 font-semibold">{ROLE_LABEL[user.role] ?? user.role}</span>
      </p>

      {status && <Alert type={status.type} message={status.msg} />}

      <div className="space-y-3">
        {available.map((role) => (
          <button
            key={role.key}
            onClick={() => {
              setSelectedRole(role.key);
              setConfirmed(false);
            }}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${
              selectedRole === role.key
                ? "border-amber-400/50 bg-amber-400/10"
                : "border-white/10 bg-white/3 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{role.icon}</span>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{role.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{role.desc}</p>
                {role.needsVerif && (
                  <p className="text-amber-400/60 text-[10px] mt-1">
                    ⚠ Vérification d'identité requise
                  </p>
                )}
              </div>
              {selectedRole === role.key && (
                <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {selected?.needsVerif && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4">
          <p className="text-amber-400/80 text-xs leading-relaxed">
            ⚠️ Devenir{" "}
            <strong className="text-amber-400">{selected.label}</strong> nécessite
            une vérification d'identité. Votre badge certifié sera réinitialisé
            jusqu'à la validation de votre document.
          </p>
        </div>
      )}

      {selectedRole && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-amber-400"
          />
          <span className="text-white/50 text-xs leading-relaxed">
            Je comprends que ce changement modifiera mes accès et que je devrai
            peut-être soumettre une pièce d'identité.
          </span>
        </label>
      )}

      {selectedRole && confirmed && (
        <SaveButton
          loading={loading}
          onClick={handleChange}
          label={`Passer en ${ROLE_LABEL[selectedRole]}`}
        />
      )}
    </div>
  );
}
