// next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: {
      id:              string;
      name?:           string | null;
      email?:          string | null;
      image?:          string | null;
      accessToken?:    string;
      role?:           "USER" | "CREATOR" | "TRAINER";
      onboardingStep?: number;
      username?:       string | null;
    };
  }
}

// Exposer les champs custom dans le JWT aussi
// (utile si tu utilises getToken() dans des route handlers)
declare module "next-auth/jwt" {
  interface JWT {
    id?:              string;
    accessToken?:     string;
    role?:            "USER" | "CREATOR" | "TRAINER";
    onboardingStep?:  number;
    username?:        string | null;
  }
}
