// app/appel/room/[bookingId]/page.tsx
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

type BookingData = {
  id: string;
  type: "AUDIO_CALL" | "VIDEO_CALL";
  status: string;
  scheduledAt: string;
  creatorId: string;
  requesterId: string;
  creator:   { id: string; username: string; displayName: string | null; avatar: string | null };
  requester: { id: string; username: string; displayName: string | null; avatar: string | null };
};

type CallState = "waiting" | "connecting" | "connected" | "ended" | "error";

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function CallRoomInner() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router        = useRouter();
  const { status }    = useSession();
  const { user }      = useCurrentUser();

  const [booking,     setBooking]     = useState<BookingData | null>(null);
  const [callState,   setCallState]   = useState<CallState>("waiting");
  const [countdown,   setCountdown]   = useState<number>(0);
  const [duration,    setDuration]    = useState<number>(0);
  const [audioMuted,  setAudioMuted]  = useState(false);
  const [videoHidden, setVideoHidden] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const wsRef          = useRef<WebSocket | null>(null);
  const durationTimer  = useRef<NodeJS.Timeout | null>(null);

  // Refs stables pour les handlers WS (évite la stale closure)
  const isCreatorRef = useRef(false);
  const isVideoRef   = useRef(false);

  const isCreator = user?.id === booking?.creatorId;
  const isVideo   = booking?.type === "VIDEO_CALL";
  const other     = isCreator ? booking?.requester : booking?.creator;

  useEffect(() => { isCreatorRef.current = isCreator; }, [isCreator]);
  useEffect(() => { isVideoRef.current   = isVideo;   }, [isVideo]);

  // 1. Charger le booking
  useEffect(() => {
    if (!bookingId || status !== "authenticated") return;
    fetch(`/api/bookings/${bookingId}/info`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) { setError("Réservation introuvable."); return; }
        if (data.status !== "CONFIRMED") { setError("Cet appel n'est pas encore confirmé."); return; }
        setBooking(data);
      })
      .catch(() => setError("Erreur de chargement."));
  }, [bookingId, status]);

  // 2. Compte à rebours
  useEffect(() => {
    if (!booking) return;
    const scheduled = new Date(booking.scheduledAt).getTime();
    const tick = () => setCountdown(Math.max(0, scheduled - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  // 3. WebSocket — seulement quand booking ET user sont prêts
  useEffect(() => {
    if (!bookingId || !user?.id || !booking?.id) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
    const ws    = new WebSocket(`${wsUrl}/call/${bookingId}?userId=${user.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connecté — rôle:", isCreatorRef.current ? "CRÉATEUR" : "ABONNÉ");
    };

    ws.onmessage = async (event) => {
      let msg: any;
      try { msg = JSON.parse(event.data); } catch { return; }
      console.log("[WS ←]", msg.type);

      switch (msg.type) {
        case "peer-joined":
          if (isCreatorRef.current) setCallState("connecting");
          break;

        case "offer":
          if (!isCreatorRef.current) await handleOffer(msg.offer);
          break;

        case "answer":
          if (isCreatorRef.current) {
            await pcRef.current?.setRemoteDescription(new RTCSessionDescription(msg.answer));
          }
          break;

        case "ice-candidate":
          if (msg.candidate) {
            try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
          }
          break;

        case "peer-left":
        case "call-ended":
          endCall();
          break;
      }
    };

    ws.onerror = () => setError("Impossible de se connecter au serveur d'appel.");
    ws.onclose = (e) => console.log("[WS] Fermé:", e.code, e.reason);

    return () => ws.close();
  }, [bookingId, user?.id, booking?.id]); // dépendances stables

  // Médias locaux
  async function startLocalMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        isVideoRef.current
          ? { audio: true, video: { width: 1280, height: 720, facingMode: "user" } }
          : { audio: true, video: false }
      );
      localStreamRef.current = stream;
      if (localVideoRef.current && isVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch {
      setError("Accès au micro/caméra refusé. Vérifiez les permissions du navigateur.");
      return null;
    }
  }

  // Créateur lance l'appel
  async function startCall() {
    const stream = await startLocalMedia();
    if (!stream) return;
    setCallState("connecting");

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      setCallState("connected");
      startDurationTimer();
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ice-candidate", candidate: e.candidate }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") setError("Connexion WebRTC échouée.");
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    wsRef.current?.send(JSON.stringify({ type: "offer", offer }));
  }

  // Abonné reçoit l'offre
  async function handleOffer(offer: RTCSessionDescriptionInit) {
    const stream = await startLocalMedia();
    if (!stream) return;
    setCallState("connecting");

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      setCallState("connected");
      startDurationTimer();
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ice-candidate", candidate: e.candidate }));
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    wsRef.current?.send(JSON.stringify({ type: "answer", answer }));
  }

  function startDurationTimer() {
    if (durationTimer.current) clearInterval(durationTimer.current);
    durationTimer.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }

  function toggleAudio() {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setAudioMuted((v) => !v);
  }

  function toggleVideo() {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setVideoHidden((v) => !v);
  }

  function endCall() {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "call-ended" }));
    }
    wsRef.current?.close();
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (durationTimer.current) clearInterval(durationTimer.current);
    setCallState("ended");
  }

  // Écrans spéciaux
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a1a] px-4">
      <div className="text-center space-y-4 max-w-sm">
        <span className="text-4xl">⚠️</span>
        <p className="text-white font-semibold">{error}</p>
        <button onClick={() => router.push("/parametres?section=reservations")}
          className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
          ← Retour aux réservations
        </button>
      </div>
    </div>
  );

  if (!booking || status === "loading" || !user) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a1a]">
      <svg className="animate-spin w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  if (callState === "ended") return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a1a] px-4">
      <div className="text-center space-y-4">
        <span className="text-5xl">📞</span>
        <p className="text-white font-bold text-xl">Appel terminé</p>
        <p className="text-white/40 text-sm">Durée : {formatCountdown(duration * 1000)}</p>
        <button onClick={() => router.push("/")}
          className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-6 py-2.5 rounded-full transition-all text-sm">
          Retour à l'accueil
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a1a] text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-purple-700">
            {other?.avatar
              ? <img src={other.avatar} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-white font-bold">
                  {other?.username?.[0]?.toUpperCase()}
                </div>
            }
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{other?.displayName ?? other?.username}</p>
            <p className="text-white/30 text-xs">
              {isVideo ? "Appel vidéo" : "Appel audio"} · {isCreator ? "Vous êtes le créateur" : "Abonné"}
            </p>
          </div>
        </div>
        {callState === "connected" && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            <span className="text-green-400 text-sm font-mono">{formatCountdown(duration * 1000)}</span>
          </div>
        )}
      </div>

      {/* Zone vidéo */}
      <div className="flex-1 relative bg-black flex items-center justify-center">

        {isVideo && (
          <video ref={remoteVideoRef} autoPlay playsInline
            className={`w-full h-full object-cover ${callState !== "connected" ? "hidden" : ""}`}
          />
        )}

        {!isVideo && callState === "connected" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-purple-700 ring-4 ring-amber-400/30">
              {other?.avatar
                ? <img src={other.avatar} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                    {other?.username?.[0]?.toUpperCase()}
                  </div>
              }
            </div>
            <p className="text-white font-semibold">{other?.displayName ?? other?.username}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
              <span className="text-green-400 text-sm">En communication</span>
            </div>
          </div>
        )}

        {(callState === "waiting" || callState === "connecting") && (
          <div className="flex flex-col items-center gap-6 text-center px-8">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-700 ring-4 ring-white/10">
              {other?.avatar
                ? <img src={other.avatar} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                    {other?.username?.[0]?.toUpperCase()}
                  </div>
              }
            </div>

            {callState === "connecting" && (
              <div className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <span className="text-white/60 text-sm">
                  {isCreator ? "L'abonné se connecte..." : "Connexion en cours..."}
                </span>
              </div>
            )}

            {callState === "waiting" && (
              <div className="space-y-3">
                {countdown > 0 ? (
                  <>
                    <p className="text-white/50 text-sm">L'appel commence dans</p>
                    <p className="text-amber-400 font-mono text-4xl font-black">{formatCountdown(countdown)}</p>
                    {isCreator && countdown <= 5 * 60 * 1000 && (
                      <p className="text-white/30 text-xs">Vous pouvez lancer l'appel maintenant</p>
                    )}
                  </>
                ) : (
                  <p className="text-white/50 text-sm">
                    {isCreator ? "Prêt à lancer l'appel" : "En attente du créateur..."}
                  </p>
                )}
              </div>
            )}

            {isCreator && callState === "waiting" && countdown <= 5 * 60 * 1000 && (
              <button onClick={startCall}
                className="flex items-center gap-3 bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-2xl transition-all text-base shadow-lg shadow-green-500/20"
              >
                {isVideo
                  ? <><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>Lancer l'appel vidéo</>
                  : <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 01.16 2.2 2 2 0 012.15 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.23 7.61a16 16 0 006.16 6.16"/></svg>Lancer l'appel audio</>
                }
              </button>
            )}

            {!isCreator && callState === "waiting" && (
              <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center space-y-2">
                <p className="text-white/60 text-sm">En attente que le créateur lance l'appel</p>
                <p className="text-white/30 text-xs">Restez sur cette page</p>
              </div>
            )}
          </div>
        )}

        {isVideo && callState === "connected" && (
          <div className="absolute bottom-20 right-4 w-32 h-48 rounded-xl overflow-hidden border border-white/20 shadow-xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
            {videoHidden && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <span className="text-2xl">🚫</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contrôles */}
      {(callState === "connected" || callState === "connecting") && (
        <div className="flex items-center justify-center gap-4 px-6 py-6 border-t border-white/8">
          <button onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              audioMuted ? "bg-red-500/20 border-2 border-red-500 text-red-400" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {audioMuted ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
                <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
              </svg>
            )}
          </button>

          {isVideo && (
            <button onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                videoHidden ? "bg-red-500/20 border-2 border-red-500 text-red-400" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={videoHidden ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
            </button>
          )}

          <button onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.07 9.5a19.79 19.79 0 01-3-8.63A2 2 0 012.06 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.18 8.91a16 16 0 004.5 4.4z"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function CallRoomPage() {
  return (
    <Suspense>
      <CallRoomInner />
    </Suspense>
  );
}
