// hooks/useReelDeepLink.ts
//
// Usage dans la page /reels :
//
//   const containerRef = useRef<HTMLDivElement>(null);
//   useReelDeepLink(reels, containerRef);
//
// Dès que `reels` est chargé, si l'URL contient ?id=POST_ID,
// on scrolle immédiatement sur le reel correspondant (sans animation)
// puis on nettoie le paramètre de l'URL pour éviter de re-scroller
// si l'utilisateur navigue en arrière.

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useReelDeepLink(
  reels: { id: string }[],
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetId = searchParams.get("id");

  useEffect(() => {
    // Attendre que les reels soient chargés et que le DOM soit prêt
    if (!targetId || reels.length === 0 || !containerRef.current) return;

    const index = reels.findIndex((r) => r.id === targetId);
    if (index === -1) return;

    // Chaque reel occupe 100vh dans un snap container vertical
    const container = containerRef.current;
    const itemHeight = container.clientHeight; // = 100vh si fullscreen

    container.scrollTo({ top: index * itemHeight, behavior: "instant" });

    // Nettoyer le param pour éviter un re-scroll au retour arrière
    const url = new URL(window.location.href);
    url.searchParams.delete("id");
    router.replace(url.pathname + (url.search || ""), { scroll: false });
  }, [targetId, reels, containerRef, router]);
}