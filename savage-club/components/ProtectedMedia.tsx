"use client";

import { useSession } from "next-auth/react";

type Props = {
  src: string;
  type?: "video" | "image";
};

export default function ProtectedMedia({ src, type = "video" }: Props) {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const watermark = `@${session.user.name} • ${(session.user as any).id?.slice(0, 6)} • ${Date.now()}`;

  return (
    <div className="relative w-full">
      
      {/* 🎬 MEDIA */}
      {type === "video" ? (
        <video
          src={src}
          controls
          className="w-full rounded-lg"
        />
      ) : (
        <img
          src={src}
          className="w-full rounded-lg"
          alt="media"
        />
      )}

      {/* 💧 WATERMARK */}
      <div className="w-full h-full flex flex-wrap items-center justify-center gap-10 opacity-15">
        {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="text-white text-xs">
            {watermark}
            </span>
        ))}
      </div>

    </div>
  );
}