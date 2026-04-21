// components/parametres/sections/SectionPlaceholder.tsx
import SectionTitle from "@/components/parametres/ui/SectionTitle";

type Props = {
  title: string;
  desc: string;
};

export default function SectionPlaceholder({ title, desc }: Props) {
  return (
    <div className="space-y-4">
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-white/20"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <p className="text-white/25 text-sm max-w-xs">{desc}</p>
      </div>
    </div>
  );
}
