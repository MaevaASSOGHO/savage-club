// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/auth" },
});

export const config = {
  matcher: [
    "/",
    "/messages/:path*",
    "/parametres/:path*",
    "/create/:path*",
    "/ma-liste/:path*",
    "/decouvrir/:path*",
    "/formateurs/:path*",
    "/appel/:path*",
  ],
};