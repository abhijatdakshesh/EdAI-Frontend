/**
 * NextAuth v5 configuration for EdAI / RV Trust.
 *
 * Authentication flow:
 *   1. User submits email + password on /login.
 *   2. NextAuth Credentials.authorize() calls POST /api/auth/login on the
 *      identity service (NestJS, port 3001) and receives a real JWT pair.
 *   3. The access token + refresh token are stored in the encrypted NextAuth
 *      session cookie (httpOnly, Secure, SameSite=Lax).
 *   4. Every API call reads the token via getSession() → attaches Bearer header.
 *   5. When the access token expires the JWT callback silently refreshes it
 *      using /api/auth/refresh.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { UserRole, Language } from "@/lib/auth/session";

// ── Backend response shapes ───────────────────────────────────────────────────

interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId: string;
  preferredLanguage: Language;
  sapId?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: BackendUser;
}

interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

// ── Identity service base URL ─────────────────────────────────────────────────
// In Next.js server-side code use the internal URL (no NEXT_PUBLIC_ prefix).

const IDENTITY_URL =
  process.env.IDENTITY_SERVICE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3001";

/** When the identity service is offline, matching rows allow sign-in (same emails as login page dev hints). */
const DEV_CREDENTIALS: Record<
  string,
  { password: string; role: UserRole; name: string }
> = {
  "admin@rvce.edu": { password: "Admin@123", role: "ADMIN", name: "Admin User" },
  "teacher@rvce.edu": { password: "Teacher@123", role: "FACULTY", name: "Teacher" },
  "student@rvce.edu": { password: "Student@123", role: "STUDENT", name: "Student" },
  "parent@rvce.edu": { password: "Parent@123", role: "PARENT", name: "Parent" },
  "hod@rvce.edu": { password: "Hod@123", role: "HOD", name: "Head of Department" },
  "principal@rvce.edu": { password: "Principal@123", role: "PRINCIPAL", name: "Principal" },
};

function tryDevLogin(
  email: string,
  password: string,
):
  | {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      institutionId: string;
      preferredLanguage: Language;
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresAt: number;
    }
  | null {
  const row = DEV_CREDENTIALS[email.toLowerCase()];
  if (!row || row.password !== password) return null;
  return {
    id: `dev-${email}`,
    name: row.name,
    email,
    role: row.role,
    institutionId: "rv-dev",
    preferredLanguage: "en",
    accessToken: "dev-access-token",
    refreshToken: "dev-refresh-token",
    accessTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
}

// ── NextAuth config ───────────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? "development-only-do-not-use-in-production",
  pages: { signIn: "/login" },

  providers: [
    Credentials({
      name: "EdAI Identity",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      /**
       * Called by NextAuth when the user submits the login form.
       * Returns a User object on success, null on failure.
       */
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        try {
          const res = await fetch(`${IDENTITY_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (res.ok) {
            const data = (await res.json()) as LoginResponse;

            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              institutionId: data.user.institutionId,
              preferredLanguage: data.user.preferredLanguage,
              sapId: data.user.sapId,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              accessTokenExpiresAt: Date.now() + data.expiresIn * 1_000,
            };
          }
        } catch {
          // Identity service unreachable — fall through to dev credentials
        }

        const dev = tryDevLogin(email, password);
        return dev;
      },
    }),
  ],

  callbacks: {
    /**
     * jwt — runs on every token creation and when the session is read.
     * Handles silent token refresh when the access token is near expiry.
     */
    async jwt({ token, user }) {
      // First call after login — user contains the authorize() return value
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        const u = user as {
          role?: UserRole;
          institutionId?: string;
          preferredLanguage?: Language;
          sapId?: string;
          accessToken?: string;
          refreshToken?: string;
          accessTokenExpiresAt?: number;
        };
        token.role = u.role;
        token.institutionId = u.institutionId;
        token.preferredLanguage = u.preferredLanguage;
        token.sapId = u.sapId;
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.accessTokenExpiresAt = u.accessTokenExpiresAt;
        return token;
      }

      // Subsequent calls — refresh the access token if it's expired or expiring soon
      const expiresAt = token.accessTokenExpiresAt as number | undefined;
      const isExpired = expiresAt ? Date.now() >= expiresAt - 30_000 : false;

      if (
        isExpired &&
        token.refreshToken &&
        token.refreshToken !== "dev-refresh-token"
      ) {
        try {
          const res = await fetch(`${IDENTITY_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: token.refreshToken }),
          });

          if (res.ok) {
            const data = (await res.json()) as RefreshResponse;
            token.accessToken = data.accessToken;
            token.accessTokenExpiresAt = Date.now() + data.expiresIn * 1_000;
          } else {
            // Refresh failed — mark token as invalid so the session callback
            // can return an error and the client can redirect to /login
            token.error = "RefreshAccessTokenError";
          }
        } catch {
          token.error = "RefreshAccessTokenError";
        }
      }

      return token;
    },

    /**
     * session — shapes what getSession() / useSession() returns to the client.
     */
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? "";
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.role = (token.role as UserRole) ?? "FACULTY";
        session.user.institutionId = token.institutionId as string | undefined;
        session.user.preferredLanguage = token.preferredLanguage as Language | undefined;
        session.user.sapId = token.sapId as string | undefined;
      }
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (refresh tokens live this long)
  },
});
