"use client";

import { useState } from "react";
import FollowModal from "./FollowModal";

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

interface StatProps {
  value: number;
  label: string;
  onClick?: () => void;
}

function Stat({ value, label, onClick }: StatProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white/5 rounded-2xl py-3 flex flex-col items-center gap-0.5 cursor-pointer"
    >
      <span className="text-white font-black text-xl">{formatCount(value)}</span>
      <span className="text-white/40 text-xs">{label}</span>
    </div>
  );
}

interface Props {
  postCount: number;
  followerCount: number;
  followingCount: number;
  username: string;
}

export default function ProfileStats({ postCount, followerCount, followingCount, username }: Props) {
  const [open, setOpen] = useState<"followers" | "following" | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Stat value={postCount} label="publications" />
        <Stat value={followerCount} label="abonnés" onClick={() => setOpen("followers")} />
        <Stat value={followingCount} label="abonnements" onClick={() => setOpen("following")} />
      </div>

      {open && <FollowModal type={open} username={username} onClose={() => setOpen(null)} />}
    </>
  );
}