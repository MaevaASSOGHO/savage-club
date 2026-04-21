// components/parametres/ui/SectionTitle.tsx
export default function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-white font-black text-xl mb-1 tracking-tight uppercase">
      {children}
    </h2>
  );
}
