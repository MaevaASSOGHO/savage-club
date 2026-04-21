// components/messages/types.ts

export type ConvType = "SAVAGE" | "VIP" | "CUSTOM_CONTENT" | "DIRECT";

export type Conversation = {
  id: string;
  type: ConvType;
  lastMessageAt: string;
  expiresAt: string | null;
  unreadCount: number;
  lastMessage: {
    content: string | null;
    mediaType: string;
    createdAt: string;
    senderId: string;
  } | null;
  other: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    isVerified: boolean;
  } | null;
};

export type Message = {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string;
  createdAt: string;
  senderId: string;
  price: number | null;
  isUnlocked: boolean;
  locked: boolean;
  sender: { id: string; username: string; displayName: string | null; avatar: string | null };
};

export const TABS_CREATOR: { key: ConvType; label: string }[] = [
  { key: "SAVAGE",         label: "Savage" },
  { key: "VIP",            label: "Savage VIP" },
  { key: "CUSTOM_CONTENT", label: "Contenu perso" },
];

export function formatTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export function formatDate(date: string) {
  const d         = new Date(date);
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatConvTime(date: string) {
  const d = new Date(date);
  if (d.toDateString() === new Date().toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function timeUntilExpiry(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "Expirée";
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `Expire dans ${d}j`;
  if (h > 0) return `Expire dans ${h}h`;
  return "Expire bientôt";
}

export function getMessagePreview(message: Conversation['lastMessage']): string {
  if (!message) return "Nouvelle conversation";
  
  // Média
  if (message.mediaType === "IMAGE") return "📷 Photo";
  if (message.mediaType === "VIDEO") return "🎥 Vidéo";
  
  // Texte
  const text = message.content || "";
  if (!text) return "💬 Message";
  
  // Vérifier si c'est du texte chiffré (hex)
  const isHex = text.length > 20 && /^[0-9a-f]+$/i.test(text.slice(0, 30));
  if (isHex) {
    // Essayer de décoder si c'est du contenu chiffré
    try {
      const decoded = decodeURIComponent(escape(atob(text)));
      if (decoded && decoded.length > 0 && decoded !== text) {
        return decoded.length > 50 ? decoded.slice(0, 50) + "..." : decoded;
      }
    } catch {
      // Si erreur, c'est probablement du vrai texte chiffré
      return "🔒 Message chiffré";
    }
  }
  
  // Texte normal
  return text.length > 50 ? text.slice(0, 50) + "..." : text;
}