// components/parametres/ui/Alert.tsx
export default function Alert({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const styles = {
    success: "bg-green-500/10 border-green-500/30 text-green-400",
    error: "bg-red-500/10 border-red-500/30 text-red-400",
  };

  return (
    <div className={`px-4 py-3 rounded-xl text-sm border ${styles[type]}`}>
      {message}
    </div>
  );
}
