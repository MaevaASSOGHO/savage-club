// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    }

    const bytes     = await file.arrayBuffer();
    const buffer    = Buffer.from(bytes);
    const base64    = `data:${file.type};base64,${buffer.toString("base64")}`;
    const isVideo   = file.type.startsWith("video/");

    const result = await cloudinary.uploader.upload(base64, {
      folder:        "savage-club",
      resource_type: isVideo ? "video" : "image",
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}