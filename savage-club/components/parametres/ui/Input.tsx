// components/parametres/ui/Input.tsx
export default function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/50 disabled:opacity-40 transition-colors"
    />
  );
}
