// components/messages/ConversationWindow.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import { formatDate, timeUntilExpiry, type Conversation, type Message } from "./types";
import PaymentMethodSelector from "@/components/payments/PaymentMethodSelector";

const TTL_OPTIONS = [
  { value: "1h",  label: "1 heure" },
  { value: "24h", label: "24 heures" },
  { value: "3d",  label: "3 jours" },
  { value: "7d",  label: "7 jours" },
];

export default function ConversationWindow({
  conversation, currentUserId, isCreator, onBack, onDelete: onDeleteConv,
}: {
  conversation: Conversation;
  currentUserId: string;
  isCreator: boolean;
  onBack: () => void;
  onDelete: (id: string) => void;
}) {
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [expired,        setExpired]        = useState(false);
  const [text,           setText]           = useState("");
  const [price,          setPrice]          = useState("");
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [sending,        setSending]        = useState(false);
  const [hasMore,        setHasMore]        = useState(false);
  const [cursor,         setCursor]         = useState<string | null>(null);
  const [showSettings,   setShowSettings]   = useState(false);
  const [unlockData,     setUnlockData]     = useState<{
    msgId:    string;
    amount:   number;
    senderId: string;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  function fetchMessages() {
    fetch(`/api/conversations/${conversation.id}/messages`)
      .then((r) => {
        if (r.status === 410) { setExpired(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setMessages(data.messages ?? []);
        setHasMore(data.hasMore);
        setCursor(data.nextCursor);
      })
      .finally(() => setLoading(false));
  }

  // Charger les messages au montage
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setExpired(false);
    fetchMessages();
  }, [conversation.id]);

  // Recharger les messages quand l'utilisateur revient sur la page
  // (après un paiement Stripe ou MF)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchMessages();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function loadMore() {
    if (!cursor) return;
    const res  = await fetch(`/api/conversations/${conversation.id}/messages?cursor=${cursor}`);
    const data = await res.json();
    setMessages((prev) => [...(data.messages ?? []), ...prev]);
    setHasMore(data.hasMore);
    setCursor(data.nextCursor);
  }

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    const parsedPrice = price ? parseInt(price) : undefined;
    const tmp: Message = {
      id: `tmp-${Date.now()}`, content: text.trim(), mediaUrl: null,
      mediaType: "TEXT", createdAt: new Date().toISOString(),
      senderId: currentUserId, price: parsedPrice ?? null,
      isUnlocked: !parsedPrice, locked: false,
      sender: { id: currentUserId, username: "Vous", displayName: "Vous", avatar: null },
    };
    setMessages((prev) => [...prev, tmp]);
    const savedText = text.trim();
    setText(""); setPrice(""); setShowPriceInput(false);
    const res  = await fetch(`/api/conversations/${conversation.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: savedText, price: parsedPrice }),
    });
    const real = await res.json();
    setSending(false);
    setMessages((prev) => prev.map((m) => m.id === tmp.id ? real : m));
  }

  async function sendMedia(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { url } = await (await fetch("/api/upload", { method: "POST", body: formData })).json();
    const mediaType   = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
    const parsedPrice = price ? parseInt(price) : undefined;
    await fetch(`/api/conversations/${conversation.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "", mediaUrl: url, mediaType, price: parsedPrice }),
    });
    const data = await (await fetch(`/api/conversations/${conversation.id}/messages`)).json();
    setMessages(data.messages ?? []);
    setPrice(""); setShowPriceInput(false);
  }

  async function handleDelete(msgId: string, forEveryone: boolean) {
    await fetch(`/api/conversations/${conversation.id}/messages/${msgId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteFor: forEveryone ? "everyone" : "me" }),
    });
    if (forEveryone) {
      setMessages((prev) => prev.map((m) =>
        m.id === msgId ? { ...m, content: "Message supprimé", mediaUrl: null, locked: false } : m
      ));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    }
  }

  async function handleUnlock(msgId: string) {
    const res  = await fetch(
      `/api/conversations/${conversation.id}/messages/${msgId}/unlock`,
      { method: "POST" }
    );
    const data = await res.json();
    if (!res.ok) return;

    // Contenu gratuit → afficher directement
    if (!data.requiresPayment) {
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...data } : m));
      return;
    }

    // Contenu payant → ouvrir le sélecteur de paiement
    const msg = messages.find((m) => m.id === msgId);
    setUnlockData({
      msgId,
      amount:   data.amount,
      senderId: msg?.sender?.id ?? conversation.other?.id ?? "",
    });
  }

  async function handleSetTTL(ttl: string) {
    await fetch(`/api/conversations/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ttl }),
    });
    setShowSettings(false);
  }

  async function handleDeleteConversation() {
    if (!confirm("Supprimer cette conversation ?")) return;
    await fetch(`/api/conversations/${conversation.id}`, { method: "DELETE" });
    onDeleteConv(conversation.id);
  }

  const grouped: { date: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const dateStr = formatDate(msg.createdAt);
    const last    = grouped[grouped.length - 1];
    if (last?.date === dateStr) last.messages.push(msg);
    else grouped.push({ date: dateStr, messages: [msg] });
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 flex-shrink-0">
        <button onClick={onBack} className="md:hidden text-white/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        {conversation.other && (
          <Link href={`/profil/${conversation.other.username}`}
            className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <Avatar user={conversation.other} size="9"/>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {conversation.other.displayName ?? conversation.other.username}
              </p>
              <p className="text-white/30 text-xs truncate">@{conversation.other.username}</p>
            </div>
          </Link>
        )}

        {conversation.expiresAt && (
          <span className="text-amber-400/60 text-[10px] bg-amber-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
            {timeUntilExpiry(conversation.expiresAt)}
          </span>
        )}

        <div className="relative flex-shrink-0">
          <button onClick={() => setShowSettings((v) => !v)}
            className="text-white/30 hover:text-white transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
          {showSettings && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)}/>
              <div className="absolute z-20 right-0 top-full mt-1 bg-[#2D1B3F] border border-white/10 rounded-xl shadow-xl py-2 w-52">
                {isCreator && (
                  <>
                    <p className="px-3 py-1 text-white/30 text-[10px] uppercase tracking-wider">Durée de vie</p>
                    {TTL_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => handleSetTTL(opt.value)}
                        className="w-full text-left px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors">
                        ⏱ {opt.label}
                      </button>
                    ))}
                    <div className="border-t border-white/8 mt-1 pt-1"/>
                  </>
                )}
                <button onClick={handleDeleteConversation}
                  className="w-full text-left px-3 py-2 text-red-400/70 hover:text-red-400 hover:bg-white/5 text-sm transition-colors">
                  {isCreator ? "🗑 Supprimer la conversation" : "🚪 Quitter la conversation"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {expired && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-center">
          <p className="text-red-400 text-xs">Cette conversation a expiré.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}>
        {hasMore && (
          <button onClick={loadMore} className="w-full text-center text-white/30 text-xs hover:text-white/60 py-2">
            Charger les messages précédents
          </button>
        )}
        {loading && (
          <div className="flex justify-center py-8">
            <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        )}
        {grouped.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-white/8"/>
              <span className="text-white/25 text-[10px] font-medium flex-shrink-0">{group.date}</span>
              <div className="flex-1 h-px bg-white/8"/>
            </div>
            <div className="space-y-2">
              {group.messages.map((msg) => (
                <MessageBubble
                  key={msg.id} msg={msg}
                  isMine={msg.senderId === currentUserId}
                  onDelete={handleDelete}
                  onUnlock={handleUnlock}
                  isCreator={isCreator}
                />
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {!expired && (
        <div className="border-t border-white/8 flex-shrink-0">
          {isCreator && showPriceInput && (
            <div className="px-4 pt-3 pb-1 flex items-center gap-2">
              <span className="text-amber-400/60 text-xs">Prix :</span>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder="0 = gratuit" min="0"
                className="flex-1 bg-white/5 border border-amber-400/20 rounded-lg px-3 py-1.5 text-white text-xs placeholder-white/25 outline-none focus:border-amber-400/50"
              />
              <span className="text-white/30 text-xs">FCFA</span>
              <button onClick={() => { setShowPriceInput(false); setPrice(""); }}
                className="text-white/30 hover:text-white/60 text-xs">✕</button>
            </div>
          )}
          <div className="flex items-center gap-2.5 px-4 py-3">
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && sendMedia(e.target.files[0])}
            />
            <button onClick={() => fileRef.current?.click()} className="text-white/30 hover:text-white/60 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            {isCreator && (
              <button onClick={() => setShowPriceInput((v) => !v)}
                className={`transition-colors ${showPriceInput ? "text-amber-400" : "text-white/30 hover:text-amber-400/60"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </button>
            )}
            <input type="text" value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={price ? `Message payant (${parseInt(price).toLocaleString("fr-FR")} FCFA)` : "Message..."}
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/40 transition-colors"
            />
            <button onClick={send} disabled={!text.trim() || sending}
              className="text-amber-400 disabled:opacity-30 hover:text-amber-300 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Sélecteur de paiement pour déblocage contenu */}
      {unlockData && (
        <PaymentMethodSelector
          amount={unlockData.amount}
          label={`Débloquer le contenu — ${unlockData.amount.toLocaleString("fr-FR")} FCFA`}
          onClose={() => setUnlockData(null)}
          mfPayload={{
            type:        "MESSAGE",
            recipientId: unlockData.senderId,
            route:       "unlock",
            returnTo:    "/messages",
            extra: {
              messageId:      unlockData.msgId,
              conversationId: conversation.id,
            },
          }}
          stripePayload={{
            type:           "MESSAGE",
            recipientId:    unlockData.senderId,
            description:    "Déblocage contenu payant",
            returnTo:       "/messages",
            messageId:      unlockData.msgId,
            conversationId: conversation.id,
          }}
        />
      )}
    </div>
  );
}
