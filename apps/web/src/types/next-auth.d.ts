import type { UserRole, Language } from "@/lib/auth/session";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
      institutionId?: string;
      preferredLanguage?: Language;
      sapId?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    /** Set to "RefreshAccessTokenError" when token refresh fails. */
    error?: string;
  }

  interface User {
    role?: UserRole;
    institutionId?: string;
    preferredLanguage?: Language;
    sapId?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    institutionId?: string;
    preferredLanguage?: Language;
    sapId?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    error?: string;
  }
}
