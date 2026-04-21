"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function GlobalWatermark() {
  const { data: session } = useSession();
  const [positions, setPositions] = useState<
    { top: string; left: string }[]
  >([]);

  useEffect(() => {
    // Générer positions aléatoires
    const generatePositions = () => {
      const newPositions = Array.from({ length: 5 }).map(() => ({
        top: Math.random() * 80 + "%",
        left: Math.random() * 80 + "%",
      }));
      setPositions(newPositions);
    };

    generatePositions();

    // 🔄 bouge toutes les 5 secondes
    const interval = setInterval(generatePositions, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!session?.user) return null;

  const text = `@${session.user.name} • ${(session.user as any).id?.slice(0, 6)} • ${Date.now()}`;

  return (
    <>
      {positions.map((pos, index) => (
        <div
          key={index}
          className="fixed text-[10px] text-white opacity-20 pointer-events-none z-[9999] select-none"
          style={{
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -50%)",
          }}
        >
          {text}
        </div>
      ))}
    </>
  );
}