"use client";

import { useEffect, useState } from "react";
import ReelPlayer from "./ReelPlayer";

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

export default function ReelFeed() {
  const [reels, setReels] = useState<Reel[]>([]);

  useEffect(() => {
    fetch("/api/reels")
      .then((res) => res.json())
      .then(setReels);
  }, []);

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory">
      {reels.map((reel) => (
        <ReelPlayer key={reel.id} reel={reel} />
      ))}
    </div>
  );
}