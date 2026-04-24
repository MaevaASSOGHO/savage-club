// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token et mot de passe requis" }, { status: 400 });
    }

    const url = `${API_URL}/auth/reset-password/${token}`;
    console.log("URL appelée:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const text = await res.text();
    console.log("Réponse brute:", text);

    let data;
    try { data = JSON.parse(text); }
    catch { return NextResponse.json({ error: "Réponse invalide du serveur" }, { status: 500 }); }

    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Erreur" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Reset password error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}