"use client";

import { useEffect } from "react";

export default function AntiCapture() {
  useEffect(() => {
    // 🚫 Bloquer clic droit
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // 🚫 Bloquer certaines touches (PrintScreen, Ctrl+S, Ctrl+U…)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && ["s", "u", "p"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
      }
    };

    // 👁 Détection changement d’onglet
    const handleVisibility = () => {
      if (document.hidden) {
        console.log("⚠️ L'utilisateur a quitté l'écran");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}