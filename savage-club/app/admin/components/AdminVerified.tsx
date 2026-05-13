// app/admin/components/AdminVerified.tsx
import UserAvatar from "./UserAvatar";

type User = {
  id: string; username: string; displayName: string | null;
  email: string; role: string; avatar: string | null;
};

export default function AdminVerified({ users }: { users: User[] }) {
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="bg-white/5 border border-white/8 rounded-2xl p-4 flex items-center gap-4">
          <UserAvatar user={user}/>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm">{user.displayName ?? user.username}</p>
              <span className="text-green-400 text-xs">✓ Vérifié</span>
            </div>
            <p className="text-white/40 text-xs">{user.email}</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
            user.role === "CREATOR" ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"
          }`}>
            {user.role === "CREATOR" ? "Créateur" : "Formateur"}
          </span>
        </div>
      ))}
    </div>
  );
}
