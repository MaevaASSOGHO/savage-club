"use client";

import { useState } from "react";
import FollowModal from "./FollowModal";

interface Props {
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export default function ProfileStats({ postCount, followerCount, followingCount }: Props) {
  const [open, setOpen] = useState<"followers" | "following" | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Stat value={postCount} label="publications" />

        <Stat
          value={followerCount}
          label="abonnés"
          onClick={() => setOpen("followers")}
        />

        <Stat
          value={followingCount}
          label="abonnements"
          onClick={() => setOpen("following")}
        />
      </div>

      {open && (
        <FollowModal type={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

function Stat({ value, label, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="bg-white/5 rounded-2xl py-3 flex flex-col items-center cursor-pointer"
    >
      <span className="text-white font-black text-xl">{value}</span>
      <span className="text-white/40 text-xs">{label}</span>
    </div>
  );
}