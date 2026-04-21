// lib/creator-rules.ts
// Source unique des règles créateurs — modifier ici met à jour partout
// Incrémenter VERSION quand les règles changent (force la ré-acceptation)

export const CREATOR_RULES_VERSION = "1.0";
export const CREATOR_RULES_DATE    = "Mars 2026";

export type RuleSection = {
  title: string;
  intro?: string;
  items: string[];
  warning?: string;
};

export const CREATOR_RULES: RuleSection[] = [
  {
    title: "Contenu légal",
    items: [
      "Tout contenu publié doit respecter les lois en vigueur en Côte d'Ivoire et dans votre pays de résidence.",
      "Il est interdit de publier du contenu impliquant des mineurs, de la violence non consentie ou des actes illégaux.",
      "Tout contenu pour adultes doit être explicitement marqué et respecter les paramètres de visibilité choisis.",
    ],
  },
  {
    title: "Droits d'auteur et propriété intellectuelle",
    items: [
      "Vous êtes responsable des droits d'auteur de tout contenu que vous publiez.",
      "Il est interdit de publier du contenu appartenant à un tiers sans autorisation explicite.",
      "Le contenu trompeur, frauduleux ou portant atteinte à d'autres utilisateurs est strictement interdit.",
    ],
  },
  {
    title: "Responsabilité des contenus impliquant des tiers",
    intro: "Tout créateur publiant du contenu impliquant une ou plusieurs autres personnes garantit que :",
    items: [
      "Chaque personne apparaissant dans le contenu est majeure.",
      "Chaque personne a donné son consentement explicite à la diffusion.",
      "Chaque personne dispose de son propre compte sur la plateforme.",
      "Il est strictement interdit de publier du contenu mettant en scène une tierce personne sans qu'elle soit elle-même inscrite et identifiable sur la plateforme.",
    ],
    warning: "Toute utilisation de l'image, du corps ou du contenu d'une personne sans son consentement ou dans un but d'exploitation pourra entraîner la suppression immédiate du compte, des poursuites judiciaires et la transmission des données aux autorités compétentes.",
  },
  {
    title: "Comportement sur la plateforme",
    items: [
      "Le harcèlement, la discrimination et les discours haineux sont interdits.",
      "Il est interdit d'utiliser la messagerie ou les réservations à des fins de harcèlement ou d'extorsion.",
      "Toute tentative de contournement du système de paiement de la plateforme est interdite.",
    ],
  },
  {
    title: "Sanctions",
    items: [
      "Savage Club se réserve le droit de supprimer tout contenu non conforme sans préavis.",
      "Les comptes récidivistes peuvent être suspendus définitivement.",
      "En cas de violation grave, les données de l'utilisateur peuvent être transmises aux autorités compétentes.",
    ],
  },
];
