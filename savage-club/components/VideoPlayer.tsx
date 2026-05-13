'use client';
// components/VideoPlayer.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import VideoPlayerWatermark from './VideoPlayerWatermark';
import VideoPlayerControls, { type VideoQuality } from './VideoPlayerControls';

export interface VideoPlayerProps {
  src:           string;
  poster?:       string;
  postId?:       string;
  watermarkText?: string;
  className?:    string;
  style?:        React.CSSProperties;
  aspectRatio?:  '16/9' | '4/3' | '9/16' | '1/1';
  fill?:         boolean;
  autoPlay?:     boolean;
  loop?:         boolean;
}

function applyCloudinaryQuality(src: string, quality: VideoQuality): string {
  if (!src.includes('/upload/')) return src;
  return src.replace(/\/q_[^/]+/, '').replace('/upload/', `/upload/q_${quality}/`);
}

const PADDING: Record<string, string> = {
  '16/9': '56.25%', '4/3': '75%', '9/16': '177.78%', '1/1': '100%',
};

export default function VideoPlayer({
  src, poster, postId, watermarkText,
  className = '', style,
  aspectRatio = '16/9', fill = false,
  autoPlay = false, loop = false,
}: VideoPlayerProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [volume,       setVolume]       = useState(1);
  const [isMuted,      setIsMuted]      = useState(true);
  const [quality,      setQuality]      = useState<VideoQuality>('auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading,    setIsLoading]    = useState(true);
  const [hasError,     setHasError]     = useState(false);

  const videoSrc = applyCloudinaryQuality(src, quality);

  // Autoplay imperatif — l attribut HTML est ignore par les navigateurs mobiles
  useEffect(() => {
    if (!autoPlay) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      v.muted = true;
      v.play().catch(() => {});
    };
    if (v.readyState >= 3) {
      tryPlay();
    } else {
      v.addEventListener('canplay', tryPlay, { once: true });
      return () => v.removeEventListener('canplay', tryPlay);
    }
  }, [autoPlay, videoSrc]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleVolumeChange = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val; v.muted = val === 0;
    setVolume(val); setIsMuted(val === 0);
  }, []);

  const handleSeek = useCallback((ratio: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = ratio * v.duration;
  }, []);

  const handleQualityChange = useCallback((q: VideoQuality) => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime; const playing = !v.paused;
    setQuality(q);
    requestAnimationFrame(() => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = t;
      if (playing) videoRef.current.play().catch(() => {});
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      document.body.style.overflow = prev ? '' : 'hidden';
      return !prev;
    });
  }, []);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) { setIsFullscreen(false); document.body.style.overflow = ''; }
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen, togglePlay]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (isPlaying) hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, [isPlaying]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const wrapperStyle: React.CSSProperties = isFullscreen
    ? { position: 'fixed', inset: 0, zIndex: 9999, width: '100vw', height: '100dvh', background: '#0a0015' }
    : fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
           : { position: 'relative', width: '100%' };

  const containerStyle: React.CSSProperties = isFullscreen
    ? { width: '100%', height: '100%', position: 'relative' }
    : fill ? { position: 'relative', width: '100%', height: '100%' }
           : { position: 'relative', paddingBottom: PADDING[aspectRatio], height: 0 };

  return (
    <div
      className={className}
      style={{ ...wrapperStyle, ...style }}
      onMouseMove={resetHideTimer}
      onMouseEnter={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div style={containerStyle}>
        <video
          ref={videoRef}
          src={videoSrc}
          poster={poster}
          loop={loop}
          muted={isMuted}
          playsInline
          preload={autoPlay ? 'auto' : 'metadata'}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: isFullscreen ? 'contain' : 'cover' }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => { setIsPlaying(false); setShowControls(true); }}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
          onDurationChange={() => setDuration(videoRef.current?.duration ?? 0)}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        />

        <VideoPlayerWatermark postId={postId} watermarkText={watermarkText}/>

        {isLoading && !hasError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,0,21,0.4)', pointerEvents: 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(251,191,36,0.2)', borderTopColor: '#fbbf24', animation: 'sc-spin 0.8s linear infinite' }}/>
          </div>
        )}

        {hasError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,0,21,0.8)', color: '#fbbf24', gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 32, height: 32, opacity: 0.7 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            <span style={{ fontSize: 13, opacity: 0.7 }}>Impossible de charger la vidéo</span>
          </div>
        )}

        {!isPlaying && !isLoading && !hasError && (
          <button onClick={togglePlay} aria-label="Lire la vidéo"
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(251,191,36,0.15)', backdropFilter: 'blur(4px)', border: '2px solid rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 28, height: 28, marginLeft: 3 }}><path d="M8 5v14l11-7z"/></svg>
            </div>
          </button>
        )}

        <VideoPlayerControls
          isPlaying={isPlaying} isFullscreen={isFullscreen}
          currentTime={currentTime} duration={duration}
          volume={volume} isMuted={isMuted} quality={quality}
          showControls={showControls}
          onTogglePlay={togglePlay} onToggleMute={toggleMute}
          onToggleFullscreen={toggleFullscreen}
          onVolumeChange={handleVolumeChange}
          onSeek={handleSeek} onQualityChange={handleQualityChange}
        />
      </div>
      <style>{`@keyframes sc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
