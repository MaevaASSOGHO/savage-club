// app/messages/page.tsx
"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Sidebar from "@/components/Sidebar";
import Avatar from "@/components/messages/Avatar";
import ConversationWindow from "@/components/messages/ConversationWindow";
import { useConversations } from "@/components/messages/useConversations";
import { TABS_CREATOR, formatConvTime, type Conversation } from "@/components/messages/types";

function ConversationItem({
  conv, isActive, currentUserId, onClick,
}: {
  conv: Conversation; isActive: boolean; currentUserId: string; onClick: () => void;
}) {
  const isExpired = conv.expiresAt && new Date(conv.expiresAt) < new Date();

  function getPreview() {
    const msg = conv.lastMessage;
    if (!msg) return "Nouvelle conversation";
    if (msg.mediaType === "IMAGE") return "📷 Photo";
    if (msg.mediaType === "VIDEO") return "🎥 Vidéo";
    const text = msg.content ?? "";
    // Contenu chiffré (hex) → afficher générique
    if (text.length > 40 && /^[0-9a-f]+$/i.test(text.slice(0, 40))) return "💬 Message";
    return text || "💬 Message";
  }

  const preview = getPreview();
  const isMine  = conv.lastMessage?.senderId === currentUserId;

  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-white/5 border-b border-white/5 ${
        isActive ? "bg-white/8" : ""} ${isExpired ? "opacity-40" : ""}`}
    >
      {conv.other ? <Avatar user={conv.other} size="10"/> : <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0"/>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm truncate ${conv.unreadCount > 0 ? "text-white font-semibold" : "text-white/80"}`}>
            {conv.other?.displayName ?? conv.other?.username ?? "Utilisateur"}
          </p>
          <span className="text-white/25 text-[10px] flex-shrink-0">
            {conv.lastMessage ? formatConvTime(conv.lastMessage.createdAt) : ""}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-white/40 text-xs truncate">
            {isMine ? "Vous: " : ""}{preview}
          </p>
          {conv.unreadCount > 0 && (
            <span className="bg-amber-400 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
              {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MessagesInner() {
  const { status } = useSession();
  const { user }   = useCurrentUser();
  const isCreator  = user?.role === "CREATOR" || user?.role === "TRAINER";

  const { activeTab, setActiveTab, convos, activeConv, setActiveConv, loading, handleDeleteConv } =
    useConversations(user?.id, status, isCreator);

  if (status === "loading" || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  const totalUnread = convos.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="flex-1 flex overflow-hidden min-h-0">

      {/* ── Liste ── */}
      <div className={`flex flex-col border-r border-white/8 flex-shrink-0 min-h-0 ${
        activeConv ? "hidden md:flex w-80" : "flex w-full md:w-80"}`}>

        <div className="px-4 pt-6 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-white font-black text-xl">Messages</h1>
            {totalUnread > 0 && (
              <span className="bg-amber-400 text-black text-xs font-black px-2 py-0.5 rounded-full">{totalUnread}</span>
            )}
          </div>
        </div>

        {isCreator && (
          <div className="px-3 pb-3 flex-shrink-0">
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
              {TABS_CREATOR.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.key ? "bg-amber-400 text-black" : "text-white/40 hover:text-white"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <svg className="animate-spin w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : convos.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <span className="text-3xl">💬</span>
              <p className="text-white/30 text-sm">Aucune conversation</p>
            </div>
          ) : (
            convos.map((conv) => (
              <ConversationItem key={conv.id} conv={conv}
                isActive={conv.id === activeConv?.id}
                currentUserId={user.id}
                onClick={() => setActiveConv(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Conversation active ── */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${activeConv ? "flex" : "hidden md:flex"}`}>
        {activeConv ? (
          <ConversationWindow
            conversation={activeConv}
            currentUserId={user.id}
            isCreator={isCreator}
            onBack={() => setActiveConv(null)}
            onDelete={handleDeleteConv}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <p className="text-white/30 text-sm">Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div className="flex h-screen bg-[#1a0533] overflow-hidden">
      <Sidebar />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      }>
        <MessagesInner />
      </Suspense>
    </div>
  );
}
