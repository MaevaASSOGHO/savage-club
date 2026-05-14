// app/onboarding/steps/StepCategories.tsx
"use client";

import { useState } from "react";

const CATEGORIES = [
  { id: "lifestyle",   label: "Lifestyle",        emoji: "✨" },
  { id: "fitness",     label: "Fitness",           emoji: "💪" },
  { id: "music",       label: "Musique",           emoji: "🎵" },
  { id: "fashion",     label: "Mode",              emoji: "👗" },
  { id: "food",        label: "Cuisine",           emoji: "🍽️" },
  { id: "art",         label: "Art & Créativité",  emoji: "🎨" },
  { id: "tech",        label: "Tech",              emoji: "💻" },
  { id: "business",    label: "Business",          emoji: "📈" },
  { id: "education",   label: "Formation",         emoji: "🎓" },
  { id: "sport",       label: "Sport",             emoji: "⚽" },
  { id: "comedy",      label: "Humour",            emoji: "😂" },
  { id: "beauty",      label: "Beauté",            emoji: "💄" },
];

type Props = { onNext: () => void };

export default function StepCategories({ onNext }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving,   setSaving]   = useState(false);

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (selected.length < 1) return;
    setSaving(true);
    await fetch("/api/onboarding/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: selected }),
    });
    setSaving(false);
    onNext();
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div>
        <h2 className="text-2xl font-bold text-white leading-tight">
          Qu'est-ce qui<br />
          <span className="text-amber-400">t'intéresse ?</span>
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Choisis au moins 1 catégorie. On personnalisera ton feed.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {CATEGORIES.map(cat => {
          const active = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                active
                  ? "border-amber-400/60 bg-amber-400/10"
                  : "border-white/8 bg-white/5 hover:border-white/15"
              }`}
            >
              <span className="text-2xl leading-none">{cat.emoji}</span>
              <span className={`text-[11px] font-semibold text-center leading-tight ${active ? "text-amber-400" : "text-white/60"}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-white/30 text-xs text-center">
          {selected.length} catégorie{selected.length > 1 ? "s" : ""} sélectionnée{selected.length > 1 ? "s" : ""}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={selected.length === 0 || saving}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-amber-400/20"
      >
        {saving ? "Chargement…" : "Voir les créateurs →"}
      </button>
    </div>
  );
}
