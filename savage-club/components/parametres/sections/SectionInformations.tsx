// components/parametres/sections/SectionInformations.tsx
"use client";

import { useState } from "react";
import Field from "@/components/parametres/ui/Field";
import Input from "@/components/parametres/ui/Input";
import SaveButton from "@/components/parametres/ui/SaveButton";
import Alert from "@/components/parametres/ui/Alert";
import SectionTitle from "@/components/parametres/ui/SectionTitle";

type Props = {
  user: {
    displayName: string | null;
    email: string;
    bio: string | null;
    location: string | null;
    website: string | null;
  };
};

export default function SectionInformations({ user }: Props) {
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [website, setWebsite] = useState(user.website ?? "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function save() {
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/parametres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, bio, location, website }),
    });
    const data = await res.json();
    setLoading(false);
    setStatus(
      res.ok
        ? { type: "success", msg: "Informations mises à jour ✓" }
        : { type: "error", msg: data.error || "Erreur" }
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Informations personnelles</SectionTitle>
      <p className="text-white/40 text-sm">Nom affiché, email et bio publique.</p>

      {status && <Alert type={status.type} message={status.msg} />}

      <div className="space-y-4">
        <Field label="Nom d'affichage">
          <Input value={displayName} onChange={setDisplayName} placeholder="Votre prénom ou nom" />
        </Field>

        <Field label="Email">
          <Input value={email} onChange={setEmail} type="email" placeholder="votre@email.com" />
        </Field>

        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Décrivez-vous en quelques mots..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/50 resize-none transition-colors"
          />
        </Field>

        <Field label="Localisation">
          <Input value={location} onChange={setLocation} placeholder="Abidjan, Côte d'Ivoire" />
        </Field>

        <Field label="Lien web">
          <Input value={website} onChange={setWebsite} placeholder="https://..." />
        </Field>
      </div>

      <SaveButton loading={loading} onClick={save} />
    </div>
  );
}
