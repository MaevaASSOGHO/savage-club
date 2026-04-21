// components/parametres/sections/SectionConnexion.tsx
"use client";

import { useState } from "react";
import Field from "@/components/parametres/ui/Field";
import SaveButton from "@/components/parametres/ui/SaveButton";
import Alert from "@/components/parametres/ui/Alert";
import SectionTitle from "@/components/parametres/ui/SectionTitle";

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/50 transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          {show ? (
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </>
          ) : (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

export default function SectionConnexion() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function save() {
    if (next !== confirm) {
      setStatus({ type: "error", msg: "Les mots de passe ne correspondent pas" });
      return;
    }
    if (next.length < 8) {
      setStatus({ type: "error", msg: "Le mot de passe doit faire au moins 8 caractères" });
      return;
    }
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/parametres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "change_password",
        currentPassword: current,
        newPassword: next,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setStatus({ type: "success", msg: "Mot de passe modifié ✓" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } else {
      setStatus({ type: "error", msg: data.error || "Erreur" });
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Données de connexion</SectionTitle>
      <p className="text-white/40 text-sm">Modifiez votre mot de passe.</p>

      {status && <Alert type={status.type} message={status.msg} />}

      <div className="space-y-4">
        <Field label="Mot de passe actuel">
          <PasswordInput value={current} onChange={setCurrent} placeholder="••••••••" />
        </Field>
        <Field label="Nouveau mot de passe">
          <PasswordInput value={next} onChange={setNext} placeholder="8 caractères minimum" />
        </Field>
        <Field label="Confirmer le nouveau mot de passe">
          <PasswordInput value={confirm} onChange={setConfirm} placeholder="••••••••" />
        </Field>
      </div>

      <SaveButton loading={loading} onClick={save} label="Modifier le mot de passe" />
    </div>
  );
}
