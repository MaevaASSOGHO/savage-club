// app/layout.tsx (mise à jour)
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/components/SessionProvider";
import AntiCapture from "@/components/AntiCapture"; 
import GlobalWatermark from "@/components/GlobalWatermark";
import Providers from "./providers";
import ResponsiveLayout from "@/components/ResponsiveLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Savage Club",
    template: "%s • Savage Club",
  },
  description:
    "La plateforme exclusive des créateurs Savage. Abonnez-vous, découvrez des contenus uniques et interagissez avec vos créateurs préférés.",
  applicationName: "Savage Club",
  authors: [{ name: "Savage Club" }],
  generator: "Next.js",
  keywords: ["savage club", "créateurs", "contenu exclusif", "abonnement"],
  referrer: "origin-when-cross-origin",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png",  sizes: "32x32",  type: "image/png" },
      { url: "/icons/favicon-16.png",  sizes: "16x16",  type: "image/png" },
      { url: "/icons/icon-192.png",    sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://savage-club.vercel.app",
    siteName: "Savage Club",
    title: "Savage Club",
    description:
      "La plateforme exclusive qui rémunère les créateurs africains. Abonnez-vous, découvrez des contenus uniques.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Savage Club",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Savage Club",
    description:
      "La plateforme exclusive qui rémunère les créateurs africains.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL("https://savage-club.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-white bg-gradient-to-b from-[#0a0218] to-[#1a0533] min-h-screen`}>
        <NextAuthProvider>
          <AntiCapture /> 
          <Providers>
            <ResponsiveLayout>
              {children}
            </ResponsiveLayout>
          </Providers>
        </NextAuthProvider>
      </body>
    </html>
  );
}