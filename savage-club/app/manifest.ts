// app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Savage Club",
    short_name: "Savage Club",
    description: "La plateforme exclusive des créateurs Savage.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a0533",
    theme_color: "#1a0533",
    categories: ["social", "entertainment"],
    lang: "fr",
    icons: [
      {
        // ⚠️ Remplacer par votre icône 192×192 PNG
        // Chemin recommandé : public/icons/icon-192.png
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        // ⚠️ Remplacer par votre icône 192×192 PNG (maskable — fond plein)
        // Chemin recommandé : public/icons/icon-192-maskable.png
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        // ⚠️ Remplacer par votre icône 512×512 PNG
        // Chemin recommandé : public/icons/icon-512.png
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // ⚠️ Remplacer par votre icône 512×512 PNG (maskable — fond plein)
        // Chemin recommandé : public/icons/icon-512-maskable.png
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        // ⚠️ Optionnel — capture d'écran pour les stores PWA
        src: "/screenshots/feed.png",
        sizes: "390x844",
        type: "image/png",
        // @ts-ignore — form_factor est valide mais pas encore dans les types Next.js
        form_factor: "narrow",
      },
    ],
  };
}
