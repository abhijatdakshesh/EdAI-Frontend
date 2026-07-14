/**
 * Proxy LMS requests to identity — Phase 1: identity is source of truth;
 * synth fallbacks only when identity is unreachable.
 */

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

export async function proxyLmsGet(
  pathWithQuery: string,
  accessToken: string,
): Promise<Response | null> {
  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}${pathWithQuery}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res;
  } catch {
    return null;
  }
}

export async function proxyLmsMutation(
  path: string,
  accessToken: string,
  init: { method: string; body?: string },
): Promise<Response | null> {
  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return res;
  } catch {
    return null;
  }
}
