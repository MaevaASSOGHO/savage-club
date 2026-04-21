// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "L'email est requis" },
        { status: 400 }
      );
    }

    console.log("Tentative d'envoi vers:", `${API_URL}/auth/forgot-password`);
    console.log("Email:", email);

    // Appeler votre API backend
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json" 
      },
      body: JSON.stringify({ email }),
    });

    console.log("Status de la réponse:", res.status);
    
    // Vérifier le content-type de la réponse
    const contentType = res.headers.get("content-type");
    console.log("Content-Type:", contentType);

    if (!contentType || !contentType.includes("application/json")) {
      // Si ce n'est pas du JSON, lire le texte pour debug
      const text = await res.text();
      console.error("Réponse non-JSON reçue:", text.substring(0, 200));
      
      return NextResponse.json(
        { error: "Le serveur distant a répondu avec un format invalide" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Erreur lors de l'envoi" },
        { status: res.status }
      );
    }

    // Pour des raisons de sécurité, on retourne toujours un succès
    return NextResponse.json({ 
      message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation" 
    });
    
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error instanceof Error ? error.message : "inconnue") },
      { status: 500 }
    );
  }
}