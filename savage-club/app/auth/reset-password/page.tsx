// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token et mot de passe requis" }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data.error || "Erreur" }, { status: res.status });
  }

  return NextResponse.json(data);
}