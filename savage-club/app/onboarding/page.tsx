// app/onboarding/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import StepProfile           from "./steps/StepProfile";
import StepSimulator         from "./steps/StepSimulator";
import StepPricing           from "./steps/StepPricing";
import StepMediaUpload       from "./steps/StepMediaUpload";
import StepDone              from "./steps/StepDone";
import StepCategories        from "./steps/StepCategories";
import StepFollowSuggestions from "./steps/StepFollowSuggestions";
import ProgressBar           from "./components/ProgressBar";

const CREATOR_STEPS = ["Profil", "Potentiel", "Abonnement", "Contenu", "Prêt !"];
const MEMBER_STEPS  = ["Intérêts", "Découvrir", "Prêt !"];

export default function OnboardingPage() {
  // `update` peut ne pas exister selon la version de next-auth — on le destructure
  // séparément pour éviter un crash si undefined
  const sessionResult = useSession() as any;
  const session = sessionResult?.data;
  const status  = sessionResult?.status;
  const update  = sessionResult?.update; // undefined en v4, fonction en v5

  const router = useRouter();

  // On gère l'étape localement — la session est la source initiale,
  // mais on n'en dépend plus après le premier chargement
  const [localStep, setLocalStep] = useState<number | null>(null);
  const [role,      setRole]      = useState<string>("USER");

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { router.push("/auth"); return; }

    const step     = Number((session.user as any).onboardingStep ?? 0);
    const userRole = String((session.user as any).role ?? "USER");
    const maxStep  = userRole === "USER" ? 2 : 5;

    // Onboarding déjà terminé → feed
    if (step >= maxStep) { router.push("/"); return; }

    setRole(userRole);
    setLocalStep(step);
  }, [session, status, router]);

  // Avancer d'une étape — persiste en DB + met à jour l'état local
  // On n'attend PAS update() : si next-auth v4, ça plantera sinon
  const advance = useCallback(async () => {
    const next = (localStep ?? 0) + 1;

    // 1. Persister en DB (source de vérité)
    await fetch("/api/onboarding/progress", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ step: next }),
    }).catch(() => {});

    // 2. Mettre à jour le token session si possible (next-auth v5)
    if (typeof update === "function") {
      update({ onboardingStep: next }).catch(() => {});
    }

    // 3. Toujours avancer localement — ne pas attendre la session
    setLocalStep(next);
  }, [localStep, update]);

  // ── Spinner pendant le chargement ────────────────────────────────────────
  if (status === "loading" || localStep === null) {
    return (
      <div className="flex h-screen bg-[#0F0520] items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isMember = role === "USER";
  const steps    = isMember ? MEMBER_STEPS : CREATOR_STEPS;
  const commonProps = { onNext: advance };

  return (
    <div className="min-h-screen bg-[#0F0520] flex flex-col">
      {/* Fond décoratif */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-100px] right-[-80px] w-[300px] h-[300px] rounded-full bg-purple-800/25 blur-[120px]" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[250px] h-[250px] rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      {/* Barre de progression */}
      <div className="relative z-10 pt-10 px-4">
        <ProgressBar steps={steps} currentIndex={localStep} />
      </div>

      {/* Corps */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pb-8 pt-6 max-w-lg mx-auto w-full">

        {/* ── Membre ── */}
        {isMember && localStep === 0 && <StepCategories        {...commonProps} />}
        {isMember && localStep === 1 && <StepFollowSuggestions {...commonProps} />}
        {isMember && localStep >= 2  && <StepDone role="USER" />}

        {/* ── Créateur / Formateur ── */}
        {!isMember && localStep === 0 && <StepProfile    role={role} {...commonProps} />}
        {!isMember && localStep === 1 && <StepSimulator  role={role} {...commonProps} />}
        {!isMember && localStep === 2 && <StepPricing               {...commonProps} />}
        {!isMember && localStep === 3 && <StepMediaUpload role={role} {...commonProps} />}
        {!isMember && localStep >= 4  && <StepDone role={role} />}

        {/* Sécurité : si aucune condition ne matche, debug visible en dev */}
        {process.env.NODE_ENV === "development" && (
          <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-2 rounded-lg z-50">
            role: {role} · step: {localStep} · isMember: {String(isMember)}
          </div>
        )}
      </div>
    </div>
  );
}