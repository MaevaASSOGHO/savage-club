// components/CreateButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function CreateButton() {
  const router = useRouter();
  const { user } = useCurrentUser();

  function handleClick() {
    if (!user) {
      router.push("/auth");
      return;
    }

    const isCreatorOrTrainer = user.role === "CREATOR" || user.role === "TRAINER";

    if (isCreatorOrTrainer && !user.isVerified) {
      // Créateur non vérifié → vers certification
      router.push("/parametres?section=certification");
      return;
    }

    if (!isCreatorOrTrainer) {
      // Membre → vers changement de compte
      router.push("/parametres?section=changer_compte");
      return;
    }

    // Créateur/formateur vérifié → vers création
    router.push("/create");
  }

  if (!user) return null; // ne pas afficher avant que la session soit prête

  const isCreatorOrTrainer = user.role === "CREATOR" || user.role === "TRAINER";
  const isPending          = isCreatorOrTrainer && !user.isVerified;

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-8 right-8 font-bold px-6 py-3 rounded-full shadow-xl transition-all flex items-center gap-2 ${
        isPending
          ? "bg-amber-400/30 border border-amber-400/50 text-amber-400 cursor-not-allowed"
          : isCreatorOrTrainer
          ? "bg-amber-400 hover:bg-amber-300 text-black"
          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
      }`}
      title={
        isPending
          ? "Compte en cours de vérification"
          : !isCreatorOrTrainer
          ? "Devenez créateur pour publier"
          : "Créer un post"
      }
    >
      {isPending ? (
        <>⏳ En vérification</>
      ) : isCreatorOrTrainer ? (
        <>+ Créer</>
      ) : (
        <>✦ Devenir créateur</>
      )}
    </button>
  );
}
