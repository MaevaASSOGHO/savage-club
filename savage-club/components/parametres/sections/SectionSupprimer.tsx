// components/parametres/sections/SectionSupprimer.tsx
"use client";

import { useState } from "react";
import Field from "@/components/parametres/ui/Field";
import Input from "@/components/parametres/ui/Input";
import SaveButton from "@/components/parametres/ui/SaveButton";
import SectionTitle from "@/components/parametres/ui/SectionTitle";

const CONFIRMATION_WORD = "SUPPRIMER";

export default function SectionSupprimer() {
  const [confirmed, setConfirmed] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = confirmed === CONFIRMATION_WORD;

  async function handleDelete() {
    if (!isValid) return;
    setLoading(true);
    // TODO: appel API suppression
    // await fetch("/api/account", { method: "DELETE" });
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Supprimer le compte</SectionTitle>

      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 space-y-4">
        <p className="text-red-400/80 text-sm leading-relaxed">
          ⚠️ Cette action est{" "}
          <strong className="text-red-400">irréversible</strong>. Toutes vos
          publications, abonnés et données seront définitivement supprimés.
        </p>

        <ul className="text-red-400/50 text-xs space-y-1">
          <li>• Tous vos posts et médias seront supprimés</li>
          <li>• Vos abonnés et abonnements seront perdus</li>
          <li>• Votre historique d'achats ne sera plus accessible</li>
          <li>• Cette action ne peut pas être annulée</li>
        </ul>

        <Field label={`Tapez « ${CONFIRMATION_WORD} » pour confirmer`}>
          <Input
            value={confirmed}
            onChange={setConfirmed}
            placeholder={CONFIRMATION_WORD}
          />
        </Field>

        <SaveButton
          loading={loading}
          onClick={handleDelete}
          label="Supprimer définitivement mon compte"
          variant="danger"
        />
      </div>
    </div>
  );
}
