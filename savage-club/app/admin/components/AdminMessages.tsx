// app/admin/components/AdminMessages.tsx
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import UserAvatar from "./UserAvatar";

type Message = {
  id:        string;
  content:   string;
  senderId:  string;
  createdAt: string;
};

type Conversation = {
  id:            string;
  lastMessageAt: string;
  unreadCount:   number;
  lastMessage:   { content: string } | null;
  other:         { id: string; username: string; displayName: string | null; avatar: string | null } | null;
};

export default function AdminMessages({ systemUserId }: { systemUserId: string }) {
  const [conversations,   setConversations]   = useState<Conversation[]>([]);
  const [selectedConv,    setSelectedConv]    = useState<Conversation | null>(null);
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [text,            setText]            = useState("");
  const [loadingConvs,    setLoadingConvs]    = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore,     setLoadingMore]     = useState(false);
  const [sending,         setSending]         = useState(false);
  const [nextCursor,      setNextCursor]      = useState<string | null>(null);
  const [hasMore,         setHasMore]         = useState(false);
  const [deleting,          setDeleting]          = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasMoreConvs,      setHasMoreConvs]      = useState(false);
  const [convCursor,        setConvCursor]        = useState<string | null>(null);
  const [loadingMoreConvs,  setLoadingMoreConvs]  = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const topRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => {
        setConversations(Array.isArray(d.conversations) ? d.conversations : []);
        setHasMoreConvs(d.hasMore ?? false);
        setConvCursor(d.nextCursor ?? null);
      })
      .finally(() => setLoadingConvs(false));
  }, []);

  async function loadMoreConversations() {
    if (!convCursor || loadingMoreConvs) return;
    setLoadingMoreConvs(true);
    const res  = await fetch(`/api/admin/messages?cursor=${convCursor}`);
    const data = await res.json();
    setConversations((prev) => [...prev, ...(Array.isArray(data.conversations) ? data.conversations : [])]);
    setHasMoreConvs(data.hasMore ?? false);
    setConvCursor(data.nextCursor ?? null);
    setLoadingMoreConvs(false);
  }

  async function openConversation(conv: Conversation) {
    setSelectedConv(conv);
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);
    setLoadingMessages(true);
    setShowDeleteConfirm(false);

    const res  = await fetch(`/api/admin/messages/${conv.id}`);
    const data = await res.json();
    const msgs = Array.isArray(data) ? data : (data.messages ?? []);
    setMessages(msgs);
    setNextCursor(data.nextCursor ?? null);
    setHasMore(data.hasMore ?? false);
    setLoadingMessages(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    if (conv.unreadCount > 0) {
      await fetch(`/api/conversations/${conv.id}/read`, { method: "POST" });
      setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
    }
  }

  async function loadMoreMessages() {
    if (!selectedConv || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res  = await fetch(`/api/admin/messages/${selectedConv.id}?cursor=${nextCursor}`);
    const data = await res.json();
    const older = Array.isArray(data) ? data : (data.messages ?? []);
    setMessages((prev) => [...older, ...prev]);
    setNextCursor(data.nextCursor ?? null);
    setHasMore(data.hasMore ?? false);
    setLoadingMore(false);
  }

  async function sendMessage() {
    if (!text.trim() || !selectedConv || sending) return;
    setSending(true);
    const res = await fetch(`/api/admin/messages/${selectedConv.id}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ content: text.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      setConversations((prev) => prev.map((c) =>
        c.id === selectedConv.id
          ? { ...c, lastMessageAt: new Date().toISOString(), lastMessage: { content: text.trim() } }
          : c
      ));
    }
    setSending(false);
  }

  async function deleteConversation() {
    if (!selectedConv || deleting) return;
    setDeleting(true);
    const res = await fetch(`/api/conversations/${selectedConv.id}`, { method: "DELETE" });
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== selectedConv.id));
      setSelectedConv(null);
      setMessages([]);
      setShowDeleteConfirm(false);
    }
    setDeleting(false);
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Liste conversations */}
      <div className="w-72 flex-shrink-0 bg-white/3 border border-white/8 rounded-2xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/8">
          <p className="text-white font-semibold text-sm">Messages support</p>
          <p className="text-white/30 text-xs">Compte Savage Club</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8 px-4">Aucun message pour l'instant</p>
          ) : conversations.map((conv) => (
            <button key={conv.id} onClick={() => openConversation(conv)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 ${
                selectedConv?.id === conv.id ? "bg-white/8" : ""
              }`}>
              <div className="relative flex-shrink-0">
                {conv.other && <UserAvatar user={conv.other} size={9}/>}
                {conv.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                    <span className="text-black text-[9px] font-black">{conv.unreadCount}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-white text-xs font-semibold truncate">
                    {conv.other?.displayName ?? conv.other?.username ?? "Utilisateur"}
                  </p>
                  <p className="text-white/20 text-[10px] flex-shrink-0 ml-2">{formatDate(conv.lastMessageAt)}</p>
                </div>
                {conv.lastMessage?.content && (
                  <p className="text-white/40 text-[10px] truncate mt-0.5">
                    {/* Aperçu — les messages déchiffrés sont retournés par l'API */}
                    {conv.lastMessage.content.startsWith("❌") || conv.lastMessage.content.length < 100
                      ? conv.lastMessage.content
                      : "Message"}
                  </p>
                )}
              </div>
            </button>
          ))}
          {hasMoreConvs && (
            <button onClick={loadMoreConversations} disabled={loadingMoreConvs}
              className="w-full py-3 text-white/30 hover:text-white text-xs transition-colors border-t border-white/5 flex items-center justify-center gap-1.5 disabled:opacity-30">
              {loadingMoreConvs ? (
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : "Voir plus"}
            </button>
          )}
        </div>
      </div>

      {/* Zone message */}
      <div className="flex-1 bg-white/3 border border-white/8 rounded-2xl overflow-hidden flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/20 text-sm">Sélectionnez une conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-white/8 flex items-center gap-3">
              {selectedConv.other && <UserAvatar user={selectedConv.other} size={8}/>}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">
                  {selectedConv.other?.displayName ?? selectedConv.other?.username}
                </p>
                <p className="text-white/30 text-xs">@{selectedConv.other?.username}</p>
              </div>
              {/* Boutons header */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Fermer */}
                <button onClick={() => { setSelectedConv(null); setMessages([]); setShowDeleteConfirm(false); }}
                  className="text-white/30 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                  title="Fermer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                {/* Supprimer */}
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-400/50 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                  title="Supprimer la conversation">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Confirmation suppression */}
            {showDeleteConfirm && (
              <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex items-center justify-between">
                <p className="text-red-400 text-xs font-medium">Supprimer cette conversation ?</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className="text-white/40 hover:text-white text-xs transition-colors">Annuler</button>
                  <button onClick={deleteConversation} disabled={deleting}
                    className="bg-red-500 hover:bg-red-400 disabled:opacity-30 text-white text-xs font-bold px-3 py-1 rounded-lg transition-all">
                    {deleting ? "..." : "Supprimer"}
                  </button>
                </div>
              </div>
            )}

            {/* Bouton charger plus */}
            {hasMore && (
              <div className="px-4 pt-3 flex justify-center">
                <button onClick={loadMoreMessages} disabled={loadingMore}
                  className="text-white/40 hover:text-white text-xs transition-colors flex items-center gap-1.5 disabled:opacity-30">
                  {loadingMore ? (
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                  )}
                  Voir les messages précédents
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <div ref={topRef}/>
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                </div>
              ) : messages.map((msg) => {
                const isSystem = msg.senderId === systemUserId;
                return (
                  <div key={msg.id} className={`flex ${isSystem ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isSystem
                        ? "bg-amber-400/20 border border-amber-400/20 text-white"
                        : "bg-white/8 border border-white/8 text-white/80"
                    }`}>
                      {msg.content}
                      <p className={`text-[10px] mt-1 ${isSystem ? "text-amber-400/50 text-right" : "text-white/20"}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>

            {/* Saisie */}
            <div className="px-4 py-3 border-t border-white/8 flex items-end gap-2">
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Répondre en tant que Savage Club..."
                rows={2}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/25 outline-none focus:border-amber-400/40 resize-none transition-colors"
              />
              <button onClick={sendMessage} disabled={!text.trim() || sending}
                className="bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex-shrink-0">
                {sending ? "..." : "Envoyer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
