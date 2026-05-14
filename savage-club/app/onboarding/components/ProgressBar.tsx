// app/onboarding/components/ProgressBar.tsx
"use client";

type Props = {
  steps: string[];
  currentIndex: number; // index de l'étape EN COURS (0-based)
};

export default function ProgressBar({ steps, currentIndex }: Props) {
  return (
    <div className="w-full">
      {/* Barres */}
      <div className="flex gap-1.5 mb-3">
        {steps.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: i < currentIndex ? "100%" : i === currentIndex ? "50%" : "0%",
                background: i <= currentIndex
                  ? "linear-gradient(90deg, #F59E0B, #A855F7)"
                  : "transparent",
              }}
            />
          </div>
        ))}
      </div>

      {/* Label étape courante */}
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-xs">
          Étape <span className="text-white/70 font-semibold">{currentIndex + 1}</span>
          {" "}sur{" "}
          <span className="text-white/70 font-semibold">{steps.length}</span>
        </p>
        <p className="text-amber-400/80 text-xs font-semibold tracking-wide uppercase">
          {steps[currentIndex]}
        </p>
      </div>
    </div>
  );
}
