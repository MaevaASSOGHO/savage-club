// app/admin/components/AdminStats.tsx
type Stats = {
  totalUsers:    number;
  totalCreators: number;
  verified:      number;
  pending:       number;
  totalPosts:    number;
};

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-white font-black text-2xl">{value.toLocaleString("fr-FR")}</p>
        <p className="text-white/40 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <StatCard label="Utilisateurs"  value={stats.totalUsers}    icon="👥" color="bg-purple-500/20"/>
      <StatCard label="Créateurs"     value={stats.totalCreators} icon="🎨" color="bg-blue-500/20"/>
      <StatCard label="Vérifiés"      value={stats.verified}      icon="✅" color="bg-green-500/20"/>
      <StatCard label="En attente"    value={stats.pending}       icon="⏳" color="bg-amber-400/20"/>
      <StatCard label="Publications"  value={stats.totalPosts}    icon="📸" color="bg-pink-500/20"/>
    </div>
  );
}
