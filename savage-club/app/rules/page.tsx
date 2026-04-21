// app/rules/page.tsx
// Page statique — Server Component, aucun JS côté client
import { CREATOR_RULES, CREATOR_RULES_VERSION, CREATOR_RULES_DATE } from "@/lib/creator-rules";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Règles des créateurs — Savage Club",
  description: "Conditions et règles applicables aux Créateurs et Formateurs publiant du contenu sur Savage Club.",
};

export default function ReglesCreateursPage() {
  return (
    <div className="min-h-screen bg-[#1a0533]">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"/>
            <span className="text-amber-400 text-xs font-semibold tracking-wide uppercase">
              Version {CREATOR_RULES_VERSION} — {CREATOR_RULES_DATE}
            </span>
          </div>

          <h1 className="text-white font-black text-3xl leading-tight mb-4">
            Règles des créateurs
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            En publiant du contenu sur Savage Club, vous acceptez de respecter l'ensemble des règles ci-dessous.
            Ces règles visent à protéger les créateurs, les abonnés et la plateforme.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {CREATOR_RULES.map((section, i) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-6">

              {/* Numéro + Titre */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 text-xs font-black">{i + 1}</span>
                </div>
                <h2 className="text-white font-bold text-base">{section.title}</h2>
              </div>

              {/* Intro optionnelle */}
              {section.intro && (
                <p className="text-white/60 text-sm leading-relaxed mb-3 pl-10">
                  {section.intro}
                </p>
              )}

              {/* Liste des règles */}
              <ul className="space-y-2.5 pl-10">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                    <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Avertissement (section critique) */}
              {section.warning && (
                <div className="mt-4 ml-10 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-red-400/80 text-xs leading-relaxed">
                    ⚠️ {section.warning}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-white/8 text-center space-y-2">
          <p className="text-white/20 text-xs">
            Ces règles s'appliquent à tous les Créateurs et Formateurs de la plateforme.
          </p>
          <p className="text-white/15 text-xs">
            Savage Club — Version {CREATOR_RULES_VERSION} — {CREATOR_RULES_DATE}
          </p>
          <Link
            href="/create"
            className="mt-4 inline-block text-amber-400/60 hover:text-amber-400 text-sm transition-colors"
          >
            ← Fermer et revenir
          </Link>
        </div>

      </div>
    </div>
  );
}