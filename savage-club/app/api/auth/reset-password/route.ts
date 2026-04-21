// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token et mot de passe requis" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    // Appeler votre API backend
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Erreur lors de la réinitialisation" },
        { status: res.status }
      );
    }

    return NextResponse.json({ 
      message: "Mot de passe réinitialisé avec succès" 
    });
    
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}