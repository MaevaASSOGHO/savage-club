'use client';
// components/VideoPlayerControls.tsx
import { useRef, useState, useCallback } from 'react';

export type VideoQuality = 'auto' | 'auto:best' | 'auto:good' | 'auto:low';

const QUALITY_OPTIONS: { label: string; value: VideoQuality }[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'HD',   value: 'auto:best' },
  { label: 'SD',   value: 'auto:good' },
  { label: 'Low',  value: 'auto:low' },
];

function formatTime(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

// ── Icônes ──────────────────────────────────────────────────────────────────

const PlayIcon    = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const ExpandIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>;
const CollapseIcon= () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>;

const VolumeIcon = ({ muted, level }: { muted: boolean; level: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    {muted || level === 0 ? (
      <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
    ) : level > 0.5 ? (
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    ) : (
      <path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
    )}
  </svg>
);

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isPlaying:       boolean;
  isFullscreen:    boolean;
  currentTime:     number;
  duration:        number;
  volume:          number;
  isMuted:         boolean;
  quality:         VideoQuality;
  showControls:    boolean;
  onTogglePlay:    () => void;
  onToggleMute:    () => void;
  onToggleFullscreen: () => void;
  onVolumeChange:  (val: number) => void;
  onSeek:          (ratio: number) => void;
  onQualityChange: (q: VideoQuality) => void;
}

// ── Composant ────────────────────────────────────────────────────────────────

export default function VideoPlayerControls({
  isPlaying, isFullscreen, currentTime, duration, volume, isMuted,
  quality, showControls,
  onTogglePlay, onToggleMute, onToggleFullscreen,
  onVolumeChange, onSeek, onQualityChange,
}: Props) {
  const progressRef    = useRef<HTMLDivElement>(null);
  const [isDragging,   setIsDragging]   = useState(false);
  const [showQMenu,    setShowQMenu]    = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    if (!bar) return;
    const rect  = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio);
  }, [onSeek]);

  const btn: React.CSSProperties = {
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
    width: 32, height: 32, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, transition: 'color 0.15s, background 0.15s',
    flexShrink: 0,
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '32px 12px 10px',
        background: 'linear-gradient(to top, rgba(10,0,21,0.92) 0%, transparent 100%)',
        display: 'flex', flexDirection: 'column', gap: 6,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity:    showControls || !isPlaying ? 1 : 0,
        transform:  showControls || !isPlaying ? 'translateY(0)' : 'translateY(4px)',
      }}
    >
      {/* Progress bar */}
      <div
        ref={progressRef}
        onClick={handleSeekClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        style={{
          height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2,
          cursor: 'pointer', position: 'relative', transition: 'height 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.height = '6px')}
        onMouseLeave={e => (e.currentTarget.style.height = '4px')}
      >
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
          borderRadius: 2, transition: isDragging ? 'none' : undefined,
        }}/>
        <div style={{
          position: 'absolute', top: '50%', left: `${progress}%`,
          transform: 'translate(-50%, -50%)',
          width: 12, height: 12, borderRadius: '50%',
          background: '#fbbf24', boxShadow: '0 0 6px rgba(251,191,36,0.6)',
        }}/>
      </div>

      {/* Buttons row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        <button onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Lire'} style={btn}>
          {isPlaying ? <PauseIcon/> : <PlayIcon/>}
        </button>

        <button onClick={onToggleMute} aria-label="Muet" style={btn}>
          <VolumeIcon muted={isMuted} level={volume}/>
        </button>

        <input
          type="range" min={0} max={1} step={0.02}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          aria-label="Volume"
          style={{
            width: 64, accentColor: '#fbbf24', cursor: 'pointer',
            WebkitAppearance: 'none', height: 3, outline: 'none', border: 'none',
            background: `linear-gradient(to right, #fbbf24 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) 0)`,
            borderRadius: 2,
          }}
        />

        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'monospace', marginLeft: 2 }}>
          {formatTime(currentTime)}
          <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 3px' }}>/</span>
          {formatTime(duration)}
        </span>

        <div style={{ flex: 1 }}/>

        {/* Quality selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowQMenu(p => !p)}
            aria-label="Qualité"
            style={{
              ...btn, fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
              letterSpacing: '0.05em', padding: '2px 6px',
              border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4,
              width: 'auto', height: 'auto', color: '#fbbf24',
            }}
          >
            {QUALITY_OPTIONS.find(q => q.value === quality)?.label ?? 'Auto'}
          </button>

          {showQMenu && (
            <div style={{
              position: 'absolute', bottom: '110%', right: 0,
              background: '#1a0533', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: 8, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: 90, zIndex: 10,
            }}>
              {QUALITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onQualityChange(opt.value); setShowQMenu(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 14px', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontFamily: 'monospace',
                    background: quality === opt.value ? 'rgba(251,191,36,0.12)' : 'transparent',
                    color: quality === opt.value ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,191,36,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = quality === opt.value ? 'rgba(251,191,36,0.12)' : 'transparent')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          style={btn}
        >
          {isFullscreen ? <CollapseIcon/> : <ExpandIcon/>}
        </button>
      </div>

      <style>{`
        @keyframes sc-spin { to { transform: rotate(360deg); } }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 12px; height: 12px;
          border-radius: 50%; background: #fbbf24; cursor: pointer;
          box-shadow: 0 0 4px rgba(251,191,36,0.5);
        }
      `}</style>
    </div>
  );
}
