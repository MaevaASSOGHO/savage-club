// components/parametres/sections/SectionPrix.tsx
"use client";

import { useState } from "react";
import Field from "@/components/parametres/ui/Field";
import SaveButton from "@/components/parametres/ui/SaveButton";
import Alert from "@/components/parametres/ui/Alert";
import SectionTitle from "@/components/parametres/ui/SectionTitle";

type Props = {
  user: {
    subscriptionPrice: number | null;
    subscriptionVIP: number | null;
    audioCallPrice: number | null;
    videoCallPrice: number | null;
    messagePrice: number | null;
  };
};

function PriceInput({
  value,
  onChange,
  placeholder,
  highlight,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  highlight?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min="0"
        className={`w-full bg-white/5 rounded-xl px-4 py-3 pr-16 text-white text-sm placeholder-white/25 outline-none transition-colors border ${
          highlight
            ? "border-amber-400/20 focus:border-amber-400/50"
            : "border-white/10 focus:border-amber-400/50"
        }`}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs">
        FCFA
      </span>
    </div>
  );
}

function PriceCard({
  title,
  badge,
  description,
  highlight,
  children,
}: {
  title: string;
  badge?: string;
  description: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl p-5 space-y-3 border ${
        highlight
          ? "bg-gradient-to-br from-amber-400/10 to-purple-900/30 border-amber-400/20"
          : "bg-white/5 border-white/10"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-amber-400 font-black text-sm uppercase tracking-wider">
          {title}
        </span>
        {badge && (
          <span className="bg-amber-400/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        )}
      </div>
      {children}
      <p className="text-white/25 text-xs">{description}</p>
    </div>
  );
}

const COMM_ITEMS = [
  {
    key: "message" as const,
    label: "Message",
    desc: "Prix pour vous envoyer un message direct",
    color: "bg-purple-500/20",
    iconColor: "text-purple-300",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
    placeholder: "ex: 500",
  },
  {
    key: "audio" as const,
    label: "Appel audio",
    desc: "Prix par session d'appel vocal",
    color: "bg-green-500/20",
    iconColor: "text-green-300",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
    placeholder: "ex: 1 000",
  },
  {
    key: "video" as const,
    label: "Appel vidéo",
    desc: "Prix par session d'appel vidéo",
    color: "bg-blue-500/20",
    iconColor: "text-blue-300",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    placeholder: "ex: 2 500",
  },
];

export default function SectionPrix({ user }: Props) {
  const [savage,  setSavage]  = useState(user.subscriptionPrice ? String(user.subscriptionPrice) : "");
  const [vip,     setVip]     = useState(user.subscriptionVIP   ? String(user.subscriptionVIP)   : "");
  const [audio,   setAudio]   = useState(user.audioCallPrice    ? String(user.audioCallPrice)    : "");
  const [video,   setVideo]   = useState(user.videoCallPrice    ? String(user.videoCallPrice)    : "");
  const [message, setMessage] = useState(user.messagePrice      ? String(user.messagePrice)      : "");

  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const setters = { message: setMessage, audio: setAudio, video: setVideo };
  const values  = { message, audio, video };

  async function save() {
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/parametres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscriptionPrice: savage,
        subscriptionVIP:   vip,
        audioCallPrice:    audio,
        videoCallPrice:    video,
        messagePrice:      message,
      }),
    });
    const data = await res.json();
    setLoading(false);
    setStatus(
      res.ok
        ? { type: "success", msg: "Tarifs mis à jour ✓" }
        : { type: "error", msg: data.error || "Erreur" }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Outils Savage Models</SectionTitle>
        <p className="text-white/40 text-sm mt-1">
          Définissez vos tarifs. Laisser un champ vide masque le bouton correspondant sur votre profil.
        </p>
      </div>

      {status && <Alert type={status.type} message={status.msg} />}

      {/* ── Abonnements ─────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
          Abonnements
        </p>

        <PriceCard title="Savage" description="Accès à vos contenus réservés aux abonnés.">
          <Field label="Prix mensuel">
            <PriceInput value={savage} onChange={setSavage} placeholder="ex: 2 000" />
          </Field>
        </PriceCard>

        <PriceCard
          title="Savage VIP"
          badge="PREMIUM"
          description="Accès exclusif + contenus premium + appels vidéo inclus."
          highlight
        >
          <Field label="Prix mensuel">
            <PriceInput value={vip} onChange={setVip} placeholder="ex: 5 000" highlight />
          </Field>
        </PriceCard>
      </div>

      {/* ── Communications ──────────────────────────── */}
      <div className="space-y-3">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
          Communications
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          {COMM_ITEMS.map((item, idx) => (
            <div key={item.key}>
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 ${item.iconColor}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-white/30 text-xs">{item.desc}</p>
                </div>
                <div className="w-36 flex-shrink-0">
                  <PriceInput
                    value={values[item.key]}
                    onChange={setters[item.key]}
                    placeholder={item.placeholder}
                  />
                </div>
              </div>
              {idx < COMM_ITEMS.length - 1 && <div className="h-px bg-white/5 mt-4" />}
            </div>
          ))}
        </div>

        <p className="text-white/20 text-xs px-1">
          Champ vide → bouton masqué sur votre profil public.
        </p>
      </div>

      <SaveButton loading={loading} onClick={save} label="Enregistrer les tarifs" />
    </div>
  );
}
