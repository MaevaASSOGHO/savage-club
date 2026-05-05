'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VideoQuality = 'auto' | 'auto:best' | 'auto:good' | 'auto:low';

export interface VideoPlayerProps {
  /** URL Cloudinary (ou autre) de la vidéo */
  src: string;
  /** Poster / thumbnail */
  poster?: string;
  /** Texte du watermark (ex : "@username") */
  watermarkText?: string;
  /** Classes Tailwind supplémentaires sur le wrapper */
  className?: string;
  /** Styles inline supplémentaires sur le wrapper */
  style?: React.CSSProperties;
  /** Ratio cible du player — défaut 16/9. Ignoré si fill={true} */
  aspectRatio?: '16/9' | '4/3' | '9/16' | '1/1';
  /**
   * Mode remplissage : le player occupe 100% du parent (position absolute inset-0).
   * À utiliser quand le parent gère déjà l'aspect-ratio (ex : PostCard).
   * Ne pas combiner avec aspectRatio.
   */
  fill?: boolean;
  /** Autoplay (muet forcé par les navigateurs) */
  autoPlay?: boolean;
  /** Lecture en boucle */
  loop?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUALITY_OPTIONS: { label: string; value: VideoQuality }[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'HD',   value: 'auto:best' },
  { label: 'SD',   value: 'auto:good' },
  { label: 'Low',  value: 'auto:low' },
];

function applyCloudinaryQuality(src: string, quality: VideoQuality): string {
  if (!src.includes('/upload/')) return src;
  // Retire toute qualité existante avant d'en injecter une nouvelle
  const cleaned = src.replace(/\/q_[^/]+/, '');
  return cleaned.replace('/upload/', `/upload/q_${quality}/`);
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Icônes inline (pas de dépendance externe) ────────────────────────────────

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const VolumeIcon = ({ muted, level }: { muted: boolean; level: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    {muted || level === 0 ? (
      <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
    ) : level > 0.5 ? (
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    ) : (
      <path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
    )}
  </svg>
);

const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

const CollapseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);

// ─── Composant principal ──────────────────────────────────────────────────────

export default function VideoPlayer({
  src,
  poster,
  watermarkText,
  className = '',
  style,
  aspectRatio = '16/9',
  fill = false,
  autoPlay = false,
  loop = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsHideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(autoPlay); // autoplay force le muet
  const [quality, setQuality] = useState<VideoQuality>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // URL avec qualité appliquée
  const videoSrc = applyCloudinaryQuality(src, quality);

  // ─── Ratio CSS ──────────────────────────────────────────────────────────────
  const paddingMap: Record<string, string> = {
    '16/9': '56.25%',
    '4/3':  '75%',
    '9/16': '177.78%',
    '1/1':  '100%',
  };

  // ─── Contrôles vidéo ────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
    v.muted = val === 0;
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const changeQuality = useCallback((q: VideoQuality) => {
    const v = videoRef.current;
    if (!v) return;
    const time = v.currentTime;
    const playing = !v.paused;
    setQuality(q);
    setShowQualityMenu(false);
    // La vidéo se recharge — on reprend au bon timecode après chargement
    requestAnimationFrame(() => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = time;
      if (playing) videoRef.current.play().catch(() => {});
    });
  }, []);

  // ─── Plein écran simulé ─────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    // Verrouillage du scroll body
    if (!isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isFullscreen]);

  // Nettoyage si le composant est démonté en mode plein écran
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Touche Échap pour sortir du plein écran simulé
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        document.body.style.overflow = '';
      }
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen, togglePlay]);

  // ─── Auto-masquage des contrôles ────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsHideTimer.current);
    if (isPlaying) {
      controlsHideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => clearTimeout(controlsHideTimer.current);
  }, []);

  // ─── Événements vidéo ───────────────────────────────────────────────────────
  const onPlay     = () => setIsPlaying(true);
  const onPause    = () => { setIsPlaying(false); setShowControls(true); };
  const onTimeUpdate = () => setCurrentTime(videoRef.current?.currentTime ?? 0);
  const onDurationChange = () => setDuration(videoRef.current?.duration ?? 0);
  const onWaiting  = () => setIsLoading(true);
  const onCanPlay  = () => setIsLoading(false);
  const onError    = () => setHasError(true);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ─── Styles plein écran simulé vs normal ────────────────────────────────────
  const wrapperStyle: React.CSSProperties = isFullscreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        width: '100vw',
        height: '100dvh',
        background: '#0a0015',
      }
    : fill
      ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
      : { position: 'relative', width: '100%' };

  const videoContainerStyle: React.CSSProperties = isFullscreen
    ? { width: '100%', height: '100%', position: 'relative' }
    : fill
      ? { position: 'relative', width: '100%', height: '100%' }
      : { position: 'relative', paddingBottom: paddingMap[aspectRatio], height: 0 };

  const videoStyle: React.CSSProperties = isFullscreen
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }
    : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ ...wrapperStyle, ...style }}
      onMouseMove={resetControlsTimer}
      onMouseEnter={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* ── Conteneur vidéo ──────────────────────────────────────────────── */}
      <div style={videoContainerStyle}>

        {/* Vidéo (controls HTML5 désactivés) */}
        <video
          ref={videoRef}
          src={videoSrc}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={isMuted}
          playsInline
          preload="metadata"
          style={videoStyle}
          onPlay={onPlay}
          onPause={onPause}
          onTimeUpdate={onTimeUpdate}
          onDurationChange={onDurationChange}
          onWaiting={onWaiting}
          onCanPlay={onCanPlay}
          onError={onError}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        />

        {/* ── Watermark — toujours dans le DOM ─────────────────────────── */}
        {watermarkText && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(3, 1fr)',
              padding: '8%',
              gap: '4%',
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                style={{
                  color: 'rgba(251,191,36,0.13)',
                  fontSize: 'clamp(9px, 1.5vw, 13px)',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                  transform: 'rotate(-25deg)',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {watermarkText}
              </span>
            ))}
          </div>
        )}

        {/* ── Spinner de chargement ─────────────────────────────────────── */}
        {isLoading && !hasError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,0,21,0.4)',
            pointerEvents: 'none',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid rgba(251,191,36,0.2)',
              borderTopColor: '#fbbf24',
              animation: 'sc-spin 0.8s linear infinite',
            }} />
          </div>
        )}

        {/* ── Erreur ────────────────────────────────────────────────────── */}
        {hasError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,0,21,0.8)', color: '#fbbf24', gap: 8,
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 32, height: 32, opacity: 0.7 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span style={{ fontSize: 13, opacity: 0.7 }}>Impossible de charger la vidéo</span>
          </div>
        )}

        {/* ── Bouton play central (visible quand en pause) ──────────────── */}
        {!isPlaying && !isLoading && !hasError && (
          <button
            onClick={togglePlay}
            aria-label="Lire la vidéo"
            style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(251,191,36,0.15)',
              backdropFilter: 'blur(4px)',
              border: '2px solid rgba(251,191,36,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fbbf24',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.25)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.15)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 28, height: 28, marginLeft: 3 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}

        {/* ── Barre de contrôles ────────────────────────────────────────── */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '32px 12px 10px',
            background: 'linear-gradient(to top, rgba(10,0,21,0.92) 0%, transparent 100%)',
            display: 'flex', flexDirection: 'column', gap: 6,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: showControls || !isPlaying ? 1 : 0,
            transform: showControls || !isPlaying ? 'translateY(0)' : 'translateY(4px)',
          }}
        >
          {/* Barre de progression */}
          <div
            ref={progressRef}
            onClick={seek}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            style={{
              height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2,
              cursor: 'pointer', position: 'relative',
              transition: 'height 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.height = '6px')}
            onMouseLeave={e => (e.currentTarget.style.height = '4px')}
          >
            {/* Rempli */}
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
              borderRadius: 2, transition: isDragging ? 'none' : undefined,
            }} />
            {/* Thumb */}
            <div style={{
              position: 'absolute', top: '50%', left: `${progress}%`,
              transform: 'translate(-50%, -50%)',
              width: 12, height: 12, borderRadius: '50%',
              background: '#fbbf24',
              boxShadow: '0 0 6px rgba(251,191,36,0.6)',
            }} />
          </div>

          {/* Ligne de boutons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Lire'}
              style={btnStyle}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Volume */}
            <button onClick={toggleMute} aria-label="Muet" style={btnStyle}>
              <VolumeIcon muted={isMuted} level={volume} />
            </button>
            <input
              type="range" min={0} max={1} step={0.02}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
              style={{
                width: 64, accentColor: '#fbbf24', cursor: 'pointer',
                WebkitAppearance: 'none', height: 3,
                background: `linear-gradient(to right, #fbbf24 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) 0)`,
                borderRadius: 2, outline: 'none', border: 'none',
              }}
            />

            {/* Temps */}
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'monospace', marginLeft: 2 }}>
              {formatTime(currentTime)}
              <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 3px' }}>/</span>
              {formatTime(duration)}
            </span>

            <div style={{ flex: 1 }} />

            {/* Sélecteur de qualité */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowQualityMenu(p => !p)}
                aria-label="Qualité"
                style={{
                  ...btnStyle,
                  fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                  letterSpacing: '0.05em', padding: '2px 6px',
                  border: '1px solid rgba(251,191,36,0.3)',
                  borderRadius: 4, width: 'auto', height: 'auto',
                  color: '#fbbf24',
                }}
              >
                {QUALITY_OPTIONS.find(q => q.value === quality)?.label ?? 'Auto'}
              </button>

              {showQualityMenu && (
                <div style={{
                  position: 'absolute', bottom: '110%', right: 0,
                  background: '#1a0533',
                  border: '1px solid rgba(251,191,36,0.2)',
                  borderRadius: 8, overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  minWidth: 90, zIndex: 10,
                }}>
                  {QUALITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => changeQuality(opt.value)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 14px', border: 'none', cursor: 'pointer',
                        fontSize: 12, fontFamily: 'monospace',
                        background: quality === opt.value ? 'rgba(251,191,36,0.12)' : 'transparent',
                        color: quality === opt.value ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,191,36,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background =
                        quality === opt.value ? 'rgba(251,191,36,0.12)' : 'transparent')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Plein écran simulé */}
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
              style={btnStyle}
            >
              {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Animations globales (injectées une seule fois) ─────────────────── */}
      <style>{`
        @keyframes sc-spin {
          to { transform: rotate(360deg); }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: #fbbf24;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(251,191,36,0.5);
        }
      `}</style>
    </div>
  );
}

// ─── Style partagé pour les boutons icônes ────────────────────────────────────
const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(255,255,255,0.85)',
  cursor: 'pointer',
  width: 32, height: 32,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6,
  transition: 'color 0.15s, background 0.15s',
  flexShrink: 0,
};
