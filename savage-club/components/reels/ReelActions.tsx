"use client";

import { useState } from "react";

type Reel = {
  id: string;
  likes: { id: string }[];
};

export default function ReelActions({ reel }: { reel: Reel }) {

  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(reel.likes.length);

  async function toggleLike() {

    const res = await fetch(`/api/reels/${reel.id}/like`, {
      method: "POST",
    });

    const data = await res.json();

    setLiked(data.liked);
    setCount(data.count);
  }

  return (
    <div className="absolute right-5 bottom-24 flex flex-col gap-5 text-white">

      <button
        onClick={toggleLike}
        className="flex flex-col items-center"
      >
        ❤️
        <span className="text-xs">{count}</span>
      </button>

      <button className="flex flex-col items-center">
        💬
      </button>

      <button className="flex flex-col items-center">
        🔗
      </button>

    </div>
  );
}