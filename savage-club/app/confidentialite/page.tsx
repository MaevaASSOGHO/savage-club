// app/confidentialite/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function ConfidentialitePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#1a0533]">
      <div className="max-w-2xl mx-auto ml-12 px-6 py-12">
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
            Politique de Confidentialité
          </h1>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
     
          
          <div className="space-y-6 text-white/70 text-sm leading-relaxed">
            
            {/* 1. DONNÉES COLLECTÉES */}
            <section>
              <h2 className="text-white font-semibold text-lg mb-3">1. Données collectées</h2>
              <p>Lors de votre inscription et de votre utilisation de Savage Club, nous collectons :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Informations d'identification : email, nom d'utilisateur, mot de passe chiffré</li>
                <li>Données de profil : photo, bio, localisation (optionnel)</li>
                <li>Contenu publié : publications, commentaires, messages</li>
                <li>Données d'interaction : likes, abonnements, partages</li>
                <li>Données techniques : adresse IP, type d'appareil, navigateur</li>
              </ul>
            </section>

            {/* 2. UTILISATION DES DONNÉES */}
            <section>
              <h2 className="text-white font-semibold text-lg mb-3">2. Utilisation de vos données</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>✓ Fournir et améliorer nos services</li>
                <li>✓ Personnaliser votre expérience</li>
                <li>✓ Modérer le contenu et assurer la sécurité</li>
                <li>✓ Vous envoyer des notifications importantes</li>
                <li>✓ Analyser l'utilisation de la plateforme</li>
              </ul>
            </section>

            {/* 3. PARTAGE DES DONNÉES */}
            <section>
              <h2 className="text-white font-semibold text-lg mb-3">3. Partage des données</h2>
              <p>Nous ne vendons pas vos données personnelles. Vos données peuvent être partagées uniquement :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Avec votre consentement explicite</li>
                <li>Pour respecter une obligation légale</li>
                <li>Avec nos prestataires techniques (hébergement, paiement)</li>
              </ul>
            </section>

            {/* 4. CONSERVATION DES DONNÉES */}
            <section>
              <h2 className="text-white font-semibold text-lg mb-3">4. Durée de conservation</h2>
              <p>Vos données sont conservées :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Tant que votre compte est actif</li>
                <li>30 jours après la suppression de votre compte (délai de récupération)</li>
                <li>Les notifications sont conservées 30 jours maximum</li>
                <li>Les données anonymisées peuvent être conservées à des fins statistiques</li>
              </ul>
            </section>

            {/* 5. VOS DROITS */}
            <section>
              <h2 className="text-white font-semibold text-lg mb-3">5. Vos droits (RGPD)</h2>
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Droit d'accès</strong> : savoir quelles données nous détenons</li>
                <li><strong>Droit de rectification</strong> : modifier vos données incorrectes</li>
                <li><strong>Droit à l'effacement</strong> : supprimer vos données ("droit à l'oubli")</li>
                <li><strong>Droit à la portabilité</strong> : récupérer vos données</li>
                <li><strong>Droit d'opposition</strong> : refuser l'utilisation de vos données</li>
              </ul>
              <p className="mt-2">Pour exercer vos droits, contactez-nous à : <span className="text-amber-400">support@savageclub.com</span></p>
            </section>

            {/* 6. SÉCURITÉ */}
            <section>
              <h2 className="text-white font-semibold text-lg mb-3">6. Sécurité des données</h2>
              <p>Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Chiffrement des mots de passe (bcrypt)</li>
                <li>Connexions HTTPS sécurisées</li>
                <li>Accès restreint aux bases de données</li>
                <li>Sauvegardes quotidiennes</li>
              </ul>
            </section>

            {/* 7. COOKIES */}
            <section>
              <h2 className="text-white font-semibold text-lg mb-3">7. Cookies</h2>
              <p>Nous utilisons des cookies pour :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Maintenir votre session active</li>
                <li>Mémoriser vos préférences</li>
                <li>Analyser l'audience (anonyme)</li>
              </ul>
              <p className="mt-2">Vous pouvez refuser les cookies via les paramètres de votre navigateur.</p>
            </section>

            {/* 8. MODIFICATIONS */}
            <section>
              <h2 className="text-white font-semibold text-lg mb-3">8. Modifications de la politique</h2>
              <p>Cette politique peut être mise à jour. Vous serez informé de toute modification importante par notification sur la plateforme.</p>
              <p className="mt-2 text-white/40 text-xs">Dernière mise à jour : 24 mars 2024</p>
            </section>

            {/* 9. CONTACT */}
            <section>
              <h2 className="text-white font-semibold text-lg mb-3">9. Contact</h2>
              <p>Pour toute question relative à cette politique ou à vos données personnelles :</p>
              <p className="mt-2">📧 <span className="text-amber-400">support@savageclub.com</span></p>
              <p>📍 Savage Club, Abidjan, Côte d'Ivoire</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}