import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  turbopack: {}, // Next.js 16 : Turbopack activé par défaut — silence le conflit webpack/@serwist
};

export default withSerwist(nextConfig);