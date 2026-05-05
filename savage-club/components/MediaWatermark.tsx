// components/MediaWatermark.tsx
// Version 2 — utilise les transformations Cloudinary au lieu du CSS
// Le watermark est gravé dans l'image servie, pas juste en CSS

"use client";

import { useSession } from "next-auth/react";
import { addCloudinaryWatermark, addCloudinaryVideoWatermark } from "@/lib/cloudinary-watermark";

type Props = {
  postId: string;
  // Optionnel — si fourni, transforme l'URL directement
  // Sinon, le composant gère juste un watermark CSS de fallback
};

// Ce composant est maintenant un no-op visuel —
// le watermark est géré dans l'URL Cloudinary directement via addCloudinaryWatermark()
// On le garde pour la compatibilité mais il ne rend plus rien côté CSS
export default function MediaWatermark({ postId }: Props) {
  return null;
}