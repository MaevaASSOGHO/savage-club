import { NextResponse } from "next/dist/server/web/spec-extension/response";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// app/api/auth/reset-password/route.ts
export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token et mot de passe requis" }, { status: 400 });
    }

    const url = `${API_URL}/auth/reset-password/${token}`;
    console.log("Calling:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);

    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Erreur" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Reset password error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}