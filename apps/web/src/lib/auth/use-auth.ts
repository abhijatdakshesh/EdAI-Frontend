"use client";

import { signOut, useSession } from "next-auth/react";

import type { UserRole } from "@/lib/auth/session";

/** First route after login — sends each role to their dedicated portal home. */
export function homeRouteForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
    case "TRUSTEE":
    case "PRINCIPAL":
    case "DEAN":
      return "/dashboard";
    case "FACULTY":
    case "HOD":
    case "COUNSELLOR":
      return "/dashboard";
    case "STUDENT":
      return "/student/dashboard";
    case "PARENT":
      return "/parent/dashboard";
    default:
      return "/dashboard";
  }
}

export function useAuth() {
  const { data: session, status } = useSession();
  const ready = status !== "loading";

  return {
    session: session?.user
      ? {
          user: session.user,
          email: session.user.email ?? "",
          role: session.user.role,
        }
      : null,
    ready,
    logout: () => void signOut({ callbackUrl: "/login" }),
  };
}
