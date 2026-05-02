// app/appel/[type]/page.tsx
"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { generateSlots, groupSlotsByDay, formatSlot } from "@/lib/slots";
import PaymentMethodSelector from "@/components/payments/PaymentMethodSelector";

type Creator = {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  audioCallPrice: number | null;
  videoCallPrice: number | null;
};

type Step = "slots" | "payment" | "confirmation";

function CallPageInner() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const callType = params.type as "audio" | "video";
  const userId   = searchParams.get("user");

  const [creator,      setCreator]      = useState<Creator | null>(null);
  const [tier,         setTier]         = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [step,         setStep]         = useState<Step>("slots");
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [note,         setNote]         = useState("");
  const [paying,       setPaying]       = useState(false);
  const [bookingId,    setBookingId]    = useState<string | null>(null);
  const [showPayment,  setShowPayment]  = useState(false);
  const [bookingData,  setBookingData]  = useState<any>(null);

  const slots   = generateSlots();
  const grouped = groupSlotsByDay(slots);

  const isVideo     = callType === "video";
  const typeLabel   = isVideo ? "Appel vidéo" : "Appel audio";
  const bookingType = isVideo ? "VIDEO_CALL" : "AUDIO_CALL";

  useEffect(() => {
    if (!userId) return;
    async function load() {
      const res = await fetch(`/api/users/by-id/${userId}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setCreator(data);
      const subRes  = await fetch(`/api/subscriptions?creatorId=${userId}`);
      const subData = await subRes.json();
      setTier(subData.tier);
      setLoading(false);
    }
    load();
  }, [userId]);

  const price = isVideo ? creator?.videoCallPrice : creator?.audioCallPrice;

  async function handleConfirmSlot() {
    if (!selectedSlot || !creator || price === undefined || price === null) return;

    // Appel gratuit → créer directement
    if (price === 0) {
      setPaying(true);
      const res  = await fetch("/api/bookings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          creatorId:   creator.id,
          type:        bookingType,
          scheduledAt: selectedSlot.toISOString(),
          amount:      0,
          note:        note || null,
        }),
      });
      const data = await res.json();
      setPaying(false);
      if (res.ok) { setBookingId(data.booking.id); setStep("confirmation"); }
      return;
    }

    // Appel payant → stocker les données et ouvrir le sélecteur
    setBookingData({
      creatorId:   creator.id,
      type:        bookingType,
      scheduledAt: selectedSlot.toISOString(),
      amount:      price,
      note:        note || null,
    });
    setShowPayment(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a0533]">
        <svg className="animate-spin w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a0533]">
        <p className="text-white/40">Créateur introuvable.</p>
      </div>
    );
  }

  if (!tier || tier === "FREE") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a0533] px-4">
        <div className="max-w-sm w-full bg-[#1E0A3C] rounded-2xl border border-white/10 p-6 text-center space-y-4">
          <span className="text-4xl">🔒</span>
          <p className="text-white font-bold">Abonnement Savage requis</p>
          <p className="text-white/40 text-sm">Abonnez-vous pour réserver un {typeLabel.toLowerCase()}.</p>
          <button onClick={() => router.back()} className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-2.5 rounded-xl transition-all">
            Retour au profil
          </button>
        </div>
      </div>
    );
  }

  if (step === "confirmation") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a0533] px-4">
        <div className="max-w-sm w-full bg-[#1E0A3C] rounded-2xl border border-green-500/20 p-6 text-center space-y-5">
          <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-black text-lg">Réservation envoyée !</p>
            <p className="text-white/40 text-sm mt-1">{typeLabel} avec {creator.displayName ?? creator.username}</p>
          </div>
          {selectedSlot && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-amber-400 font-semibold text-sm">{formatSlot(selectedSlot)}</p>
              <p className="text-white/30 text-xs mt-1">Durée : 10 minutes</p>
            </div>
          )}
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
            <p className="text-amber-400/80 text-xs leading-relaxed">
              ⏳ <strong className="text-amber-400">{creator.displayName ?? creator.username}</strong> doit encore confirmer ce créneau. Vous recevrez une notification dès sa réponse.
            </p>
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push(`/profil/${creator.username}`)}
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-2.5 rounded-xl transition-all text-sm">
              Retour au profil
            </button>
            <button onClick={() => router.push("/parametres?section=reservations")}
              className="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm py-2.5 rounded-xl transition-all">
              Voir mes réservations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a0533]">
      <div className="max-w-lg mx-auto px-4 py-8">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step === "payment" ? setStep("slots") : router.back()} className="text-white/40 hover:text-white transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-purple-700 flex-shrink-0">
            {creator.avatar
              ? <img src={creator.avatar} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-white font-bold">{creator.username[0].toUpperCase()}</div>
            }
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{creator.displayName ?? creator.username}</p>
            <p className="text-white/30 text-xs">
              {typeLabel} · 10 min · {price ? `${price.toLocaleString("fr-FR")} FCFA` : "Gratuit"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {["Choisir un créneau", "Paiement"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                (i === 0 && step === "slots") || (i === 1 && step === "payment")
                  ? "bg-amber-400 text-black" : "bg-white/10 text-white/30"
              }`}>{i + 1}</div>
              <span className={`text-xs ${
                (i === 0 && step === "slots") || (i === 1 && step === "payment")
                  ? "text-white" : "text-white/30"
              }`}>{label}</span>
              {i < 1 && <div className="w-6 h-px bg-white/10"/>}
            </div>
          ))}
        </div>

        {step === "slots" && (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg">Choisir un créneau</h2>
            {grouped.map((group) => (
              <div key={group.label} className="space-y-2">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider capitalize">{group.label}</p>
                <div className="grid grid-cols-3 gap-2">
                  {group.slots.map((slot) => {
                    const isSelected = selectedSlot?.getTime() === slot.getTime();
                    return (
                      <button key={slot.toISOString()} onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium transition-all border ${
                          isSelected
                            ? "bg-amber-400 border-amber-400 text-black font-bold"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                        }`}>
                        {slot.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button onClick={() => setStep("payment")} disabled={!selectedSlot}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-bold py-3 rounded-xl transition-all mt-4">
              Continuer →
            </button>
          </div>
        )}

        {step === "payment" && selectedSlot && (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg">Confirmer et payer</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Type</span>
                <span className="text-white font-medium">{typeLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Créneau</span>
                <span className="text-white font-medium">{formatSlot(selectedSlot)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Durée</span>
                <span className="text-white font-medium">10 minutes</span>
              </div>
              <div className="h-px bg-white/8"/>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-white">Total</span>
                <span className="text-amber-400">{price ? `${price.toLocaleString("fr-FR")} FCFA` : "Gratuit"}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider">
                Message au créateur (optionnel)
              </label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Précisez le sujet de l'appel..." rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/50 resize-none transition-colors"
              />
            </div>

            <button onClick={handleConfirmSlot} disabled={paying}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {paying ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Traitement...
                </>
              ) : price ? `Choisir le paiement — ${price.toLocaleString("fr-FR")} FCFA` : "Confirmer (gratuit)"}
            </button>
          </div>
        )}
      </div>

      {/* Sélecteur de méthode de paiement */}
      {showPayment && creator && price && price > 0 && (
        <PaymentMethodSelector
          amount={price}
          label={`${typeLabel} avec ${creator.displayName ?? creator.username}`}
          onClose={() => setShowPayment(false)}
          mfPayload={{
            type:        bookingType,
            recipientId: creator.id,
            route:       "booking",
            extra:       bookingData,
          }}
          stripePayload={{
            type:        bookingType,
            recipientId: creator.id,
            description: `${typeLabel} — ${creator.displayName ?? creator.username}`,
          }}
        />
      )}
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense>
      <CallPageInner />
    </Suspense>
  );
}
