// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { sendResetPasswordEmail } from "@/lib/emails/resend";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "L'email est requis" }, { status: 400 });

    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body:    JSON.stringify({ email }),
    });

    const data = await res.json();

    // Envoyer l'email si un token a été généré
    if (data.token) {
      await sendResetPasswordEmail(email, data.token).catch((err) => {
        console.error("Erreur envoi email reset:", err);
      });
    }

    return NextResponse.json({ 
      message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation" 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}