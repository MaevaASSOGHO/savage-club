// app/api/payments/moneyfusion/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkMFPaymentStatus }      from "@/lib/payments/providers/moneyfusion";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token requis" }, { status: 400 });

  try {
    const data = await checkMFPaymentStatus(token);
    return NextResponse.json({ statut: data.data?.statut, data: data.data });
  } catch (err) {
    return NextResponse.json({ error: "Erreur vérification" }, { status: 500 });
  }
}
