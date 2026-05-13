// app/admin/components/AdminMessages.tsx
"use client";
import { useEffect, useRef, useState } from "react";
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
  const [sending,         setSending]         = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => setConversations(Array.isArray(d.conversations) ? d.conversations : []))
      .finally(() => setLoadingConvs(false));
  }, []);

  async function openConversation(conv: Conversation) {
    setSelectedConv(conv);
    setLoadingMessages(true);
    const res  = await fetch(`/api/admin/messages/${conv.id}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : (data.messages ?? []));
    setLoadingMessages(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    // Marquer comme lu
    if (conv.unreadCount > 0) {
      await fetch(`/api/conversations/${conv.id}/read`, { method: "POST" });
      setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
    }
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
              <div className="relative">
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
                {conv.lastMessage && (
                  <p className="text-white/40 text-[10px] truncate mt-0.5">{conv.lastMessage.content}</p>
                )}
              </div>
            </button>
          ))}
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
              <div>
                <p className="text-white font-semibold text-sm">
                  {selectedConv.other?.displayName ?? selectedConv.other?.username}
                </p>
                <p className="text-white/30 text-xs">@{selectedConv.other?.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
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
