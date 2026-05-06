"use client";
// components/reels/ReelPlayer.tsx
import Link from "next/link";
import ReelActions from "./ReelActions";
import ReelWatermark from "./ReelWatermark";

type Reel = {
  id: string;
  videoUrl: string;
  caption: string | null;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    isVerified: boolean;
  };
  likes: { id: string }[];
};

export default function ReelPlayer({ reel }: { reel: Reel }) {
  return (
    <div className="relative h-screen snap-start flex items-center justify-center bg-black">

      <video
        src={reel.videoUrl}
        className="absolute w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Watermark spectateur — token généré sans insert Post en DB */}
      <ReelWatermark reelId={reel.id} />

      {/* Info utilisateur */}
      <div className="absolute bottom-10 left-5 text-white max-w-[70%] z-10">
        <Link
          href={`/${reel.user.username}`}
          className="flex items-center gap-2 font-semibold"
        >
          @{reel.user.username}
          {reel.user.isVerified && (
            <span className="text-blue-400 text-sm">✔</span>
          )}
        </Link>
        {reel.caption && (
          <p className="text-sm mt-1 opacity-90">{reel.caption}</p>
        )}
      </div>

      <ReelActions reel={reel} />

    </div>
  );
}
