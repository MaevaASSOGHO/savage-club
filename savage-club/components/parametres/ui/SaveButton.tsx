// components/parametres/ui/SaveButton.tsx
export default function SaveButton({
  loading,
  onClick,
  label = "Enregistrer",
  variant = "primary",
}: {
  loading?: boolean;
  onClick: () => void;
  label?: string;
  variant?: "primary" | "danger";
}) {
  const base = "font-bold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-amber-400 hover:bg-amber-300 text-black",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };

  return (
    <button onClick={onClick} disabled={loading} className={`${base} ${variants[variant]}`}>
      {loading ? "Enregistrement..." : label}
    </button>
  );
}
