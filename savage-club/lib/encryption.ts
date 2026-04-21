// lib/encryption.ts
// Chiffrement AES-256-GCM côté serveur (comme Telegram serveur, OnlyFans)
// Le serveur peut déchiffrer pour modération, mais les messages sont illisibles en base

import crypto from "crypto";

const ALGORITHM  = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH  = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits auth tag

// Clé dérivée depuis ENCRYPTION_SECRET (variable d'environnement)
function getMasterKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) throw new Error("ENCRYPTION_SECRET manquant dans .env");
  // Dériver une clé 256-bit depuis le secret via SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

export type EncryptedPayload = {
  ciphertext: string; // hex
  iv: string;         // hex — stocké séparément en base
};

/**
 * Chiffre un texte avec AES-256-GCM
 * Retourne le ciphertext (avec auth tag) et l'IV séparément
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const key = getMasterKey();
  const iv  = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag(); // 16 bytes d'authentification

  // Concaténer encrypted + tag
  const ciphertext = Buffer.concat([encrypted, tag]).toString("hex");

  return {
    ciphertext,
    iv: iv.toString("hex"),
  };
}

/**
 * Déchiffre un payload AES-256-GCM
 */
export function decrypt(payload: EncryptedPayload): string {
  const key  = getMasterKey();
  const iv   = Buffer.from(payload.iv, "hex");
  const data = Buffer.from(payload.ciphertext, "hex");

  // Séparer encrypted et auth tag (16 derniers bytes)
  const tag       = data.subarray(data.length - TAG_LENGTH);
  const encrypted = data.subarray(0, data.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Chiffrer un message avant stockage (texte + mediaUrl si présent)
 * Retourne { content, mediaUrl, iv } à stocker en base
 */
export function encryptMessage(content: string, mediaUrl?: string | null): {
  content: string;
  mediaUrl: string | null;
  iv: string;
} {
  // Chiffrer le contenu texte
  const textPayload = encrypt(content || "");

  // Chiffrer l'URL du média si présente (pour cacher les URLs aussi)
  let encryptedMediaUrl: string | null = null;
  if (mediaUrl) {
    const mediaPayload = encrypt(mediaUrl);
    // Stocker mediaUrl chiffré avec son propre IV séparé par ":"
    encryptedMediaUrl = `${mediaPayload.iv}:${mediaPayload.ciphertext}`;
  }

  return {
    content:  textPayload.ciphertext,
    mediaUrl: encryptedMediaUrl,
    iv:       textPayload.iv,
  };
}

/**
 * Déchiffrer un message récupéré de la base
 */
export function decryptMessage(row: {
  content: string;
  mediaUrl: string | null;
  iv: string | null;
}): { content: string; mediaUrl: string | null } {
  // Si pas d'IV → message non chiffré (ancien message)
  if (!row.iv) {
    return { content: row.content, mediaUrl: row.mediaUrl };
  }

  const content = decrypt({ ciphertext: row.content, iv: row.iv });

  let mediaUrl: string | null = null;
  if (row.mediaUrl) {
    try {
      const [ivHex, ciphertext] = row.mediaUrl.split(":");
      mediaUrl = decrypt({ ciphertext, iv: ivHex });
    } catch {
      mediaUrl = row.mediaUrl; // fallback si non chiffré
    }
  }

  return { content, mediaUrl };
}
