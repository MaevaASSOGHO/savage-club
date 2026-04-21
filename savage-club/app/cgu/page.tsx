// app/terms/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#1a0533]">
      <div className="max-w-2xl mx-auto ml-12 px-6 py-12">

        {/* Header avec bouton retour et version */}
        <div className="mb-10">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-white/30 hover:text-amber-400 transition-colors mb-6"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="group-hover:-translate-x-1 transition-transform"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="text-sm">Retour</span>
          </button>

          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"/>
            <span className="text-amber-400 text-xs font-semibold tracking-wide uppercase">
              Version 1.0 — {new Date().toLocaleDateString('fr-FR')}
            </span>
          </div>

          <h1 className="text-white font-black text-3xl leading-tight mb-4">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            En utilisant <span className="text-amber-400 font-medium">SAVAGE CLUB</span>, vous acceptez l'ensemble des conditions ci-dessous.
            Ces conditions régissent l'accès et l'utilisation de la plateforme.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-black">1</span>
              </div>
              <h2 className="text-white font-bold text-base">Objet</h2>
            </div>
            <div className="pl-10">
              <p className="text-white/60 text-sm leading-relaxed">
                <span className="text-amber-400 font-medium">SAVAGE CLUB</span> permet à des utilisateurs (ci-après <span className="text-white font-medium">Créateurs et Formateurs</span>) de publier et proposer des contenus numériques accessibles à d'autres utilisateurs (ci-après <span className="text-amber-400 font-medium">“Utilisateurs”</span>) via abonnement, achat ou accès privé.
              </p>
              <p className="text-white/60 text-sm leading-relaxed mt-3">
                L'utilisation de <span className="text-amber-400 font-medium">SAVAGE CLUB</span> implique l'acceptation pleine et entière des présentes conditions.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-black">2</span>
              </div>
              <h2 className="text-white font-bold text-base">Accès et inscription</h2>
            </div>
            <div className="pl-10 space-y-3">
              <p className="text-white/60 text-sm leading-relaxed">
                L'accès à <span className="text-amber-400 font-medium">SAVAGE CLUB</span> est strictement réservé aux personnes majeures (18 ans ou plus).
              </p>
              <p className="text-white/60 text-sm leading-relaxed">L'utilisateur s'engage à :</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>fournir des informations exactes</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>ne pas usurper l'identité d'un tiers</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>sécuriser ses identifiants</span>
                </li>
              </ul>
              <p className="text-white/60 text-sm leading-relaxed">
                Toute activité effectuée via un compte est réputée faite par son titulaire.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-black">3</span>
              </div>
              <h2 className="text-white font-bold text-base">Rôle de <span className="text-amber-400">SAVAGE CLUB</span></h2>
            </div>
            <div className="pl-10 space-y-3">
              <p className="text-white/60 text-sm leading-relaxed">
                <span className="text-amber-400 font-medium">SAVAGE CLUB</span> agit en qualité d'<span className="text-amber-400 font-medium">hébergeur technique</span>.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">À ce titre :</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span><span className="text-amber-400 font-medium">SAVAGE CLUB</span> ne produit pas les contenus</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span><span className="text-amber-400 font-medium">SAVAGE CLUB</span> ne contrôle pas systématiquement les contenus publiés</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span><span className="text-amber-400 font-medium">SAVAGE CLUB</span> ne peut être tenue responsable des contenus mis en ligne par les utilisateurs</span>
                </li>
              </ul>
              <p className="text-white/60 text-sm leading-relaxed">
                Les <span className="text-white font-medium">Créateurs et Formateurs</span> sont seuls responsables des contenus qu'ils publient.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-black">4</span>
              </div>
              <h2 className="text-white font-bold text-base">Obligations des Créateurs et Formateurs</h2>
            </div>
            <div className="pl-10 space-y-3">
              <p className="text-white/60 text-sm leading-relaxed">
                Les <span className="text-white font-medium">Créateurs et Formateurs</span> garantissent que :
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>ils sont majeurs</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>ils détiennent tous les droits sur les contenus publiés</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>les personnes apparaissant dans les contenus sont majeures et consentantes</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>les contenus respectent les lois en vigueur en Côte d'Ivoire</span>
                </li>
              </ul>
              <p className="text-white/60 text-sm leading-relaxed">
                Ils s'engagent à pouvoir fournir toute preuve en cas de demande (identité, consentement, droits).
              </p>
            </div>
          </div>

          {/* Section 5 - Contenus interdits (avec warning) */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 text-xs font-black">5</span>
              </div>
              <h2 className="text-white font-bold text-base">Contenus interdits</h2>
            </div>
            <div className="pl-10 space-y-3">
              <p className="text-white/60 text-sm leading-relaxed">
                Il est strictement interdit de publier sur <span className="text-amber-400 font-medium">SAVAGE CLUB</span> :
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">⛔</span>
                  <span className="text-white font-medium">tout contenu impliquant des mineurs</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">⛔</span>
                  <span className="text-white font-medium">tout contenu pédopornographique (tolérance zéro)</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>des contenus violents, criminels ou incitant à la haine</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>des contenus portant atteinte à la dignité humaine</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>des contenus protégés sans autorisation</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>des contenus frauduleux ou trompeurs</span>
                </li>
              </ul>
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400/80 text-xs leading-relaxed">
                  ⚠️ Toute violation entraînera la suppression immédiate du contenu et du compte.
                </p>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-black">6</span>
              </div>
              <h2 className="text-white font-bold text-base">Propriété intellectuelle</h2>
            </div>
            <div className="pl-10 space-y-3">
              <p className="text-white/60 text-sm leading-relaxed">
                Les <span className="text-white font-medium">Créateurs et Formateurs</span> conservent leurs droits de propriété intellectuelle.
                Ils accordent à <span className="text-amber-400 font-medium">SAVAGE CLUB</span> une licence non exclusive permettant :
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>l'hébergement</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>la diffusion</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="text-amber-400/60 mt-0.5 flex-shrink-0">•</span>
                  <span>l'affichage</span>
                </li>
              </ul>
              <p className="text-white/60 text-sm leading-relaxed">
                Les utilisateurs s'engagent à ne pas reproduire, enregistrer, distribuer ou exploiter les contenus sans autorisation.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-black">7</span>
              </div>
              <h2 className="text-white font-bold text-base">Protection des contenus et anti-fuite</h2>
            </div>
            <div className="pl-10 space-y-3">
              <p className="text-white/60 text-sm leading-relaxed">
                Les contenus diffusés sur <span className="text-amber-400 font-medium">SAVAGE CLUB</span> sont protégés par des dispositifs techniques de sécurité, incluant des marquages numériques (watermark), des identifiants uniques et des systèmes de traçabilité.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Toute tentative de capture, enregistrement, diffusion ou revente sans autorisation constitue une violation grave.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                En cas de fuite, <span className="text-amber-400 font-medium">SAVAGE CLUB</span> se réserve le droit d'identifier l'utilisateur à l'origine de la diffusion, de suspendre ou supprimer son compte, et d'engager des poursuites judiciaires.
              </p>
            </div>
          </div>

          {/* Sections 8 à 14 - Version compacte */}
          {[
            {
              num: "8",
              title: "Paiements",
              content: "L'accès à certains contenus est payant. Les paiements sont effectués via des moyens sécurisés, sont non remboursables sauf obligation légale, et donnent accès à un contenu numérique immédiatement consommable. L'utilisateur reconnaît renoncer à son droit de rétractation dès l'accès au contenu."
            },
            {
              num: "9",
              title: "Suspension et suppression de compte",
              content: "SAVAGE CLUB se réserve le droit de suspendre un compte, supprimer un compte ou bloquer l'accès à certains contenus sans préavis en cas de violation des présentes conditions."
            },
            {
              num: "10",
              title: "Responsabilité",
              content: "SAVAGE CLUB ne peut être tenue responsable des contenus publiés par les utilisateurs, des interactions entre utilisateurs ou des pertes liées à l'utilisation du service. L'utilisateur utilise la plateforme sous sa seule responsabilité."
            },
            {
              num: "11",
              title: "Données et traçabilité",
              content: "SAVAGE CLUB peut collecter certaines données techniques (adresse IP, appareil, activité) dans le cadre de la sécurité, la lutte contre la fraude et la protection des contenus. Ces données peuvent être utilisées en cas de litige ou de procédure judiciaire."
            },
            {
              num: "12",
              title: "Signalement",
              content: "Tout utilisateur peut signaler un contenu illicite. SAVAGE CLUB se réserve le droit de retirer tout contenu jugé non conforme, sans préavis."
            },
            {
              num: "13",
              title: "Modification des conditions",
              content: "Les présentes conditions peuvent être modifiées à tout moment. L'utilisateur sera informé en cas de modification importante."
            },
            {
              num: "14",
              title: "Droit applicable",
              content: "Les présentes conditions sont régies par le droit ivoirien. Tout litige sera soumis aux juridictions compétentes en Côte d'Ivoire."
            }
          ].map((section) => (
            <div key={section.num} className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 text-[10px] font-black">{section.num}</span>
                </div>
                <h2 className="text-white font-bold text-sm">{section.title}</h2>
              </div>
              <p className="text-white/60 text-xs leading-relaxed pl-9">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-white/8 text-center space-y-2">
          <p className="text-white/20 text-xs">
            Ces conditions s'appliquent à tous les utilisateurs de la plateforme.
          </p>
          <p className="text-white/15 text-xs">
            Savage Club — Version 1.0 — {new Date().toLocaleDateString('fr-FR')}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-block text-amber-400/60 hover:text-amber-400 text-sm transition-colors"
          >
            ← Fermer et revenir
          </button>
        </div>

      </div>
    </div>
  );
}