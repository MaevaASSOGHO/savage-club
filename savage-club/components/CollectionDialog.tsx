// components/CollectionDialog.tsx
"use client";

import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialName?: string;
  title: string;
}

export default function CollectionDialog({ isOpen, onClose, onSubmit, initialName = "", title }: Props) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2D1B3F] rounded-2xl p-6 w-full max-w-md border border-white/10">
        <h2 className="text-white font-bold text-xl mb-4">{title}</h2>
        
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la collection"
          className="w-full px-4 py-3 bg-[#1A0B2E] text-white rounded-xl border border-white/10 focus:border-[#C9A3FF] outline-none mb-6"
          autoFocus
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onSubmit(name.trim());
              }
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#C9A3FF] to-[#A37DFF] text-[#1A0B2E] font-medium hover:opacity-90 transition-opacity"
          >
            {initialName ? "Modifier" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}