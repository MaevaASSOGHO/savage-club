"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function MediaWatermark({ postId }: { postId: string }) {
  const { data: session, status } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [positions, setPositions] = useState<{ top: string; left: string }[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/media/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // ← manquait
      body: JSON.stringify({ postId }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.token) setToken(data.token); })
      .catch(() => {});
  }, [postId, status]);

  useEffect(() => {
    const generate = () => {
      setPositions(
        Array.from({ length: 5 }).map(() => ({
          top:  `${Math.random() * 80}%`,
          left: `${Math.random() * 80}%`,
        }))
      );
    };
    generate();
    const interval = setInterval(generate, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!session?.user || !token) return null;

  const text = `@${session.user.name ?? session.user.email} • ${token}`;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {positions.map((p, i) => (
        <span
          key={i}
          className="absolute text-white text-[10px] font-medium select-none transition-all duration-[4000ms]"
          style={{
            top: p.top,
            left: p.left,
            opacity: 0.18,
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            transform: "rotate(-15deg)",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
}
