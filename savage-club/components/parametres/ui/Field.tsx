// components/parametres/ui/Field.tsx
export default function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/50 text-xs font-medium uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
