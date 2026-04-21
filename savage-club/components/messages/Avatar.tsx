// components/messages/Avatar.tsx
export default function Avatar({
  user, size = "10",
}: {
  user: { username: string; avatar: string | null };
  size?: string;
}) {
  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden bg-purple-700 flex-shrink-0`}>
      {user.avatar
        ? <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
        : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
            {user.username[0].toUpperCase()}
          </div>
      }
    </div>
  );
}
