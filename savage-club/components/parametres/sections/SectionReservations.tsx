// components/parametres/sections/SectionReservations.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SectionTitle from "@/components/parametres/ui/SectionTitle";
import { generateSlots, groupSlotsByDay } from "@/lib/slots";

type BookingStatus =
  | "PENDING_PAYMENT" | "PENDING_CONFIRM"
  | "COUNTER_PROPOSED" | "COUNTER_REPLIED"
  | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Booking = {
  id: string;
  type: "AUDIO_CALL" | "VIDEO_CALL";
  status: BookingStatus;
  scheduledAt: string;
  counterProposedAt: string | null;
  counterRepliedAt:  string | null;
  negotiationCount:  number;
  duration: number;
  amount: number;
  note: string | null;
  requester: { id: string; username: string; displayName: string | null; avatar: string | null };
  creator:   { id: string; username: string; displayName: string | null; avatar: string | null };
};

type Props = { userRole: string };

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; dot: string }> = {
  PENDING_PAYMENT:  { label: "Paiement en attente",         color: "text-white/40",   dot: "bg-white/20"  },
  PENDING_CONFIRM:  { label: "En attente de confirmation",  color: "text-amber-400",  dot: "bg-amber-400" },
  COUNTER_PROPOSED: { label: "Nouveau créneau proposé",     color: "text-blue-400",   dot: "bg-blue-400"  },
  COUNTER_REPLIED:  { label: "Contre-proposition envoyée",  color: "text-purple-400", dot: "bg-purple-400"},
  CONFIRMED:        { label: "Confirmé ✓",                  color: "text-green-400",  dot: "bg-green-400" },
  CANCELLED:        { label: "Annulé",                      color: "text-red-400",    dot: "bg-red-400"   },
  COMPLETED:        { label: "Terminé",                     color: "text-white/30",   dot: "bg-white/20"  },
};

const TYPE_ICON: Record<string, string> = { AUDIO_CALL: "🎙", VIDEO_CALL: "📹" };

function formatDate(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function timeUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  if (diff < 0) return null;
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `dans ${d} j`;
  if (h > 0) return `dans ${h} h`;
  return "Bientôt";
}

// Hook — compte à rebours en temps réel, se met à jour chaque seconde
function useCallCountdown(scheduledAt: string, status: BookingStatus) {
  const [msLeft, setMsLeft] = useState(() => new Date(scheduledAt).getTime() - Date.now());

  useEffect(() => {
    if (status !== "CONFIRMED") return;
    const interval = setInterval(() => {
      setMsLeft(new Date(scheduledAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt, status]);

  const canJoin  = msLeft <= 5 * 60 * 1000 && msLeft > -10 * 60 * 1000; // -10min = appel en cours
  const isLate   = msLeft < 0;
  const minutes  = Math.floor(Math.abs(msLeft) / 60000);
  const seconds  = Math.floor((Math.abs(msLeft) % 60000) / 1000);
  const display  = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { msLeft, canJoin, isLate, display };
}


// ── Sélecteur de créneau ──────────────────────────────────────────────────
function SlotPicker({
  onSelect, onClose, title,
}: {
  onSelect: (date: Date) => void;
  onClose: () => void;
  title: string;
}) {
  const slots = generateSlots();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const groups = groupSlotsByDay(slots)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60">
      <div className="bg-[#1E0A3C] border border-white/10 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
          <p className="text-white font-semibold text-sm">{title}</p>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold capitalize mb-2">
                {group.label}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {group.slots.map((slot) => {
                  const isSelected = selectedSlot?.getTime() === slot.getTime();
                  return (
                    <button
                      key={slot.toISOString()}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isSelected
                          ? "bg-amber-400 border-amber-400 text-black font-bold"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                      }`}
                    >
                      {slot.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
          <button
            onClick={() => selectedSlot && onSelect(selectedSlot)}
            disabled={!selectedSlot}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-bold py-2.5 rounded-xl transition-all text-sm"
          >
            Confirmer ce créneau
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Carte de réservation ──────────────────────────────────────────────────
function BookingCard({
  booking, perspective, onUpdate,
}: {
  booking: Booking;
  perspective: "requester" | "creator";
  onUpdate: (id: string, newStatus: BookingStatus, newSlot?: string) => void;
}) {
  const router      = useRouter();
  const status      = STATUS_CONFIG[booking.status];
  const other       = perspective === "requester" ? booking.creator : booking.requester;
  const { canJoin, isLate, display, msLeft } = useCallCountdown(booking.scheduledAt, booking.status);
  const [acting, setActing]         = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerAction, setPickerAction] = useState<"counter_propose" | "counter_reply">("counter_propose");

  const MAX = 2;
  const canNegotiate = booking.negotiationCount < MAX;

  async function callAction(action: string, proposedAt?: string) {
    setActing(true);
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, proposedAt }),
    });
    setActing(false);
    if (res.ok) {
      const data = await res.json();
      onUpdate(booking.id, data.status, data.scheduledAt);
    }
  }

  function openPicker(action: "counter_propose" | "counter_reply") {
    setPickerAction(action);
    setShowPicker(true);
    setShowMenu(false);
  }

  // Créneau à afficher selon le statut
  const proposedSlot = booking.status === "COUNTER_PROPOSED"
    ? booking.counterProposedAt
    : booking.status === "COUNTER_REPLIED"
    ? booking.counterRepliedAt
    : null;

  const isMyTurn =
    (perspective === "requester" && booking.status === "COUNTER_PROPOSED") ||
    (perspective === "creator"   && (booking.status === "PENDING_CONFIRM" || booking.status === "COUNTER_REPLIED"));

  return (
    <>
      {showPicker && (
        <SlotPicker
          title={pickerAction === "counter_propose" ? "Proposer un autre créneau" : "Suggérer une nouvelle heure"}
          onClose={() => setShowPicker(false)}
          onSelect={(date) => {
            setShowPicker(false);
            callAction(pickerAction, date.toISOString());
          }}
        />
      )}

      <div className="bg-white/5 border border-white/8 rounded-2xl p-4 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{TYPE_ICON[booking.type]}</span>
            <span className="text-white font-semibold text-sm">
              {booking.type === "VIDEO_CALL" ? "Appel vidéo" : "Appel audio"}
            </span>
            <span className="text-white/30 text-xs">· {booking.duration} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`}/>
            <span className={`text-xs ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {/* Interlocuteur */}
        <div className="flex items-center gap-2.5">
          <Link href={`/profil/${other.username}`} className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-700">
              {other.avatar
                ? <img src={other.avatar} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    {other.username[0].toUpperCase()}
                  </div>
              }
            </div>
          </Link>
          <div>
            <Link href={`/profil/${other.username}`} className="text-white text-sm font-medium hover:text-amber-400 transition-colors">
              {other.displayName ?? other.username}
            </Link>
            <p className="text-white/30 text-xs">
              {perspective === "creator" ? "Demande de" : "Avec"} @{other.username}
            </p>
          </div>
        </div>

        {/* Date + montant + bouton rejoindre */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div>
            <p className="text-amber-400 text-sm font-medium">{formatDate(booking.scheduledAt)}</p>
            {booking.status === "CONFIRMED" && msLeft > 5 * 60 * 1000 && (
              <p className="text-white/80 text-xs"> {timeUntil(booking.scheduledAt)}</p>
            )}
            {booking.status === "CONFIRMED" && canJoin && !isLate && (
              <p className="text-green-400 text-xs font-mono animate-pulse">
                ⏱ {display}
              </p>
            )}
            {booking.status === "CONFIRMED" && isLate && canJoin && (
              <p className="text-amber-400/70 text-xs">En cours</p>
            )}
          </div>
          <span className="text-white/50 text-sm">
            {booking.amount > 0 ? `${booking.amount.toLocaleString("fr-FR")} FCFA` : "Gratuit"}
          </span>
        </div>

        {/* Bouton rejoindre l'appel */}
        {booking.status === "CONFIRMED" && canJoin && (
          <button
            onClick={() => router.push(`/appel/room/${booking.id}`)}
            className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl transition-all ${
              isLate
                ? "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20 animate-pulse"
                : "bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400"
            }`}
          >
            {booking.type === "VIDEO_CALL"
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 01.16 2.2 2 2 0 012.15 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.23 7.61a16 16 0 006.16 6.16"/></svg>
            }
            {isLate ? "Rejoindre l'appel en cours" : "Rejoindre l'appel"}
          </button>
        )}

        {/* Nouveau créneau proposé */}
        {proposedSlot && (
          <div className="bg-blue-400/10 border border-blue-400/20 rounded-xl px-3 py-2.5 space-y-1">
            <p className="text-blue-400/70 text-[10px] uppercase tracking-wider font-semibold">
              Nouveau créneau proposé
            </p>
            <p className="text-blue-400 text-sm font-medium">{formatDate(proposedSlot)}</p>
          </div>
        )}

        {/* Compteur négociations */}
        {booking.negotiationCount > 0 && booking.status !== "CONFIRMED" && booking.status !== "CANCELLED" && (
          <p className="text-white/20 text-[10px] text-right">
            {booking.negotiationCount}/{MAX} négociation{booking.negotiationCount > 1 ? "s" : ""}
            {!canNegotiate ? " — Prochaine annulation automatique" : ""}
          </p>
        )}

        {/* Note */}
        {booking.note && (
          <p className="text-white/30 text-xs italic bg-white/3 rounded-lg px-3 py-2">
            "{booking.note}"
          </p>
        )}

        {/* ── ACTIONS ── */}

        {/* Créateur — demande initiale */}
        {perspective === "creator" && booking.status === "PENDING_CONFIRM" && (
          <div className="flex gap-2 pt-1 relative">
            <button
              onClick={() => callAction("confirm")}
              disabled={acting}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-semibold text-sm py-2 rounded-xl transition-all disabled:opacity-40"
            >
              {acting ? "..." : "✓ Confirmer"}
            </button>

            <div className="relative flex-1">
              <button
                onClick={() => setShowMenu((v) => !v)}
                disabled={acting}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm py-2 rounded-xl transition-all disabled:opacity-40"
              >
                Refuser ▾
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}/>
                  <div className="absolute z-20 bottom-full mb-1 right-0 bg-[#2D1B3F] border border-white/10 rounded-xl shadow-xl py-1 w-52">
                    {canNegotiate && (
                      <button
                        onClick={() => openPicker("counter_propose")}
                        className="w-full text-left px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-colors"
                      >
                        📅 Proposer une autre heure
                      </button>
                    )}
                    <button
                      onClick={() => { setShowMenu(false); callAction("cancel"); }}
                      className="w-full text-left px-3 py-2.5 text-red-400/70 hover:text-red-400 hover:bg-white/5 text-sm transition-colors"
                    >
                      ✕ Refuser définitivement
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Créateur — répondre à une contre-réponse de l'abonné */}
        {perspective === "creator" && booking.status === "COUNTER_REPLIED" && (
          <div className="flex gap-2 pt-1 relative">
            <button
              onClick={() => callAction("accept_counter")}
              disabled={acting}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-semibold text-sm py-2 rounded-xl transition-all disabled:opacity-40"
            >
              {acting ? "..." : "✓ Accepter ce créneau"}
            </button>
            <button
              onClick={() => callAction("cancel")}
              disabled={acting}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400/70 hover:text-red-400 text-sm py-2 rounded-xl transition-all disabled:opacity-40"
            >
              Annuler
            </button>
          </div>
        )}

        {/* Abonné — répondre à une contre-proposition du créateur */}
        {perspective === "requester" && booking.status === "COUNTER_PROPOSED" && (
          <div className="flex gap-2 pt-1 relative">
            <button
              onClick={() => callAction("accept_counter")}
              disabled={acting}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-semibold text-sm py-2 rounded-xl transition-all disabled:opacity-40"
            >
              {acting ? "..." : "✓ Accepter"}
            </button>

            <div className="relative flex-1">
              <button
                onClick={() => setShowMenu((v) => !v)}
                disabled={acting}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm py-2 rounded-xl transition-all disabled:opacity-40"
              >
                Refuser ▾
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}/>
                  <div className="absolute z-20 bottom-full mb-1 right-0 bg-[#2D1B3F] border border-white/10 rounded-xl shadow-xl py-1 w-52">
                    {canNegotiate && (
                      <button
                        onClick={() => openPicker("counter_reply")}
                        className="w-full text-left px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-colors"
                      >
                        📅 Suggérer une autre heure
                      </button>
                    )}
                    <button
                      onClick={() => { setShowMenu(false); callAction("cancel"); }}
                      className="w-full text-left px-3 py-2.5 text-red-400/70 hover:text-red-400 hover:bg-white/5 text-sm transition-colors"
                    >
                      ✕ Refuser définitivement
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
type MainTab = "sent" | "received";
type SubTab  = "upcoming" | "past";

export default function SectionReservations({ userRole }: Props) {
  const isCreatorOrTrainer = userRole === "CREATOR" || userRole === "TRAINER";

  const [mainTab, setMainTab] = useState<MainTab>("sent");
  const [subTab,  setSubTab]  = useState<SubTab>("upcoming");

  const [sentBookings,     setSentBookings]     = useState<Booking[]>([]);
  const [receivedBookings, setReceivedBookings] = useState<Booking[]>([]);
  const [loadingSent,      setLoadingSent]      = useState(true);
  const [loadingReceived,  setLoadingReceived]  = useState(false);
  const [receivedLoaded,   setReceivedLoaded]   = useState(false);

  useEffect(() => {
    fetch("/api/me/bookings?as=requester")
      .then((r) => r.json())
      .then((data) => setSentBookings(Array.isArray(data) ? data : []))
      .catch(() => setSentBookings([]))
      .finally(() => setLoadingSent(false));
  }, []);

  useEffect(() => {
    if (mainTab !== "received" || receivedLoaded) return;
    setLoadingReceived(true);
    fetch("/api/me/bookings?as=creator")
      .then((r) => r.json())
      .then((data) => { setReceivedBookings(Array.isArray(data) ? data : []); setReceivedLoaded(true); })
      .catch(() => setReceivedBookings([]))
      .finally(() => setLoadingReceived(false));
  }, [mainTab, receivedLoaded]);

  function handleUpdate(id: string, newStatus: BookingStatus, newSlot?: string) {
    const update = (prev: Booking[]) => prev.map((b) =>
      b.id === id
        ? { ...b, status: newStatus, ...(newSlot ? { scheduledAt: newSlot } : {}) }
        : b
    );
    setSentBookings(update);
    setReceivedBookings(update);
  }

  const now = Date.now();
  function splitBookings(list: Booking[]) {
    return {
      upcoming: list.filter((b) =>
        b.status !== "CANCELLED" && b.status !== "COMPLETED" &&
        new Date(b.scheduledAt).getTime() > now
      ),
      past: list.filter((b) =>
        b.status === "CANCELLED" || b.status === "COMPLETED" ||
        new Date(b.scheduledAt).getTime() <= now
      ),
    };
  }

  const activeList        = mainTab === "sent" ? sentBookings : receivedBookings;
  const activePerspective = mainTab === "sent" ? "requester" : "creator";
  const loading           = mainTab === "sent" ? loadingSent : loadingReceived;
  const { upcoming, past }= splitBookings(activeList);
  const displayed         = subTab === "upcoming" ? upcoming : past;
  const pendingCount      = receivedBookings.filter(
    (b) => b.status === "PENDING_CONFIRM" || b.status === "COUNTER_REPLIED"
  ).length;

  return (
    <div className="space-y-5">
      <SectionTitle>Mes réservations</SectionTitle>

      {isCreatorOrTrainer && (
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(["sent", "received"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all relative ${
                mainTab === tab ? "bg-amber-400 text-black" : "text-white/50 hover:text-white"
              }`}
            >
              {tab === "sent" ? "Mes demandes" : "Demandes reçues"}
              {tab === "received" && pendingCount > 0 && mainTab !== "received" && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {(["upcoming", "past"] as const).map((key) => {
          const count = key === "upcoming" ? upcoming.length : past.length;
          return (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                subTab === key ? "bg-white/15 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              {key === "upcoming" ? "Programmées" : "Passées"}
              {count > 0 && (
                <span className="ml-1.5 text-xs bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <span className="text-3xl">{subTab === "upcoming" ? "📅" : "🗓"}</span>
          <p className="text-white/30 text-sm">
            {mainTab === "received"
              ? subTab === "upcoming" ? "Aucune demande en attente." : "Aucune demande passée."
              : subTab === "upcoming" ? "Aucun appel programmé." : "Aucun appel passé."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              perspective={activePerspective as "requester" | "creator"}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
