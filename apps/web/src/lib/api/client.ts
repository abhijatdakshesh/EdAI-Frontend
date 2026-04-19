/**
 * EdAI Web — authenticated API client.
 *
 * Attaches Bearer token from NextAuth session (`accessToken`).
 * Falls back to unauthenticated requests when no session (e.g. public mocks).
 */

import { getSession } from "next-auth/react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const session = await getSession();
  const accessToken = session?.accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401 && accessToken) {
    // The cached client-side session token is expired. Ask the NextAuth session
    // endpoint to re-evaluate it — this runs the server-side jwt callback which
    // silently calls /api/auth/refresh and stores a new access token in the cookie.
    try {
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const freshSession = (await sessionRes.json()) as {
          accessToken?: string;
          error?: string;
        };
        const freshToken = freshSession?.accessToken;

        if (freshSession.error === "RefreshAccessTokenError" || !freshToken) {
          // Refresh failed server-side — token is unrecoverable, redirect to login
          window.location.href = "/login";
          return undefined as unknown as T;
        }

        if (freshToken !== accessToken) {
          // Got a new token — retry the original request with it
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${freshToken}`,
          };
          const retry = await fetch(`${API_BASE}${path}`, {
            ...init,
            headers: retryHeaders,
          });
          if (!retry.ok) {
            const err = (await retry.json().catch(() => ({}))) as {
              message?: string;
            };
            throw new Error(err.message ?? `Request failed: ${retry.status}`);
          }
          if (retry.status === 204) return undefined as unknown as T;
          return (await retry.json()) as T;
        }
      }
    } catch (refreshError) {
      if (refreshError instanceof Error) throw refreshError;
    }

    // Refresh did not produce a new token — surface the original 401
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? "Unauthorized");
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as unknown as T;

  return (await res.json()) as T;
}

export const apiGet = <T>(path: string) => apiFetch<T>(path, { method: "GET" });

export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiPut = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const apiDelete = <T>(path: string) =>
  apiFetch<T>(path, { method: "DELETE" });

/** @deprecated Use apiFetch / apiGet / apiPost directly. */
export const apiClient = {
  get: apiGet,
  post: apiPost,
};
