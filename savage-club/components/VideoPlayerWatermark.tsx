'use client';
// components/VideoPlayerWatermark.tsx
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Props {
  postId?:       string;
  watermarkText?: string;
}

const DEFAULT_POSITIONS = [
  { top: '10%', left: '5%'  },
  { top: '10%', left: '55%' },
  { top: '45%', left: '30%' },
  { top: '75%', left: '5%'  },
  { top: '75%', left: '55%' },
];

export default function VideoPlayerWatermark({ postId, watermarkText }: Props) {
  const { data: session, status } = useSession();
  const [token,     setToken]     = useState<string | null>(null);
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);

  // Fetch token si postId fourni
  useEffect(() => {
    if (!postId || status !== 'authenticated') return;
    fetch('/api/media/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ postId }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.token) setToken(data.token); })
      .catch(() => {});
  }, [postId, status]);

  // Positions rotatives (mode token)
  useEffect(() => {
    if (!postId) return;
    const generate = () =>
      setPositions(
        Array.from({ length: 5 }).map(() => ({
          top:  `${Math.random() * 80}%`,
          left: `${Math.random() * 80}%`,
        }))
      );
    generate();
    const id = setInterval(generate, 4000);
    return () => clearInterval(id);
  }, [postId]);

  const text = postId && session?.user && token
    ? `@${session.user.name ?? session.user.email} • ${token}`
    : watermarkText ?? null;

  if (!text) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {positions.map((p, i) => (
        <span
          key={i}
          style={{
            position:   'absolute',
            top:        p.top,
            left:       p.left,
            color:      'white',
            fontSize:   10,
            fontWeight: 500,
            fontFamily: 'monospace',
            opacity:    0.18,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            transform:  'rotate(-15deg)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            transition: postId ? 'all 4000ms' : undefined,
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
}
