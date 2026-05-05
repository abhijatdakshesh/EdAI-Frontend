import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

// Route prefixes to specific internal service URLs (add more as services are deployed)
const SERVICE_ROUTES: [string, string][] = [
  // ['/api/attendance', process.env.ACADEMICS_SERVICE_URL ?? IDENTITY_SERVICE_URL],
  // ['/api/fees', process.env.FEES_SERVICE_URL ?? IDENTITY_SERVICE_URL],
];

function resolveUpstream(pathname: string): string {
  for (const [prefix, url] of SERVICE_ROUTES) {
    if (pathname.startsWith(prefix)) return url;
  }
  return IDENTITY_SERVICE_URL;
}

async function proxy(
  req: Parameters<Parameters<typeof auth>[0]>[0],
  method: string,
): Promise<NextResponse> {
  try {
    const accessToken = req.auth?.accessToken;
    if (!accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const url = new URL(req.url);
    const upstream = resolveUpstream(url.pathname);
    const backendUrl = `${upstream}${url.pathname}${url.search}`;

    const isWrite = method !== 'GET' && method !== 'HEAD';
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      ...(isWrite ? { 'Content-Type': 'application/json' } : {}),
    };

    const body = isWrite ? await req.text() : null;
    const res = await fetch(backendUrl, { method, headers, body });

    const contentType = res.headers.get('content-type') ?? 'application/json';
    if (contentType.includes('application/pdf')) {
      const buf = await res.arrayBuffer();
      return new NextResponse(buf, {
        status: res.status,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': res.headers.get('Content-Disposition') ?? 'attachment',
        },
      });
    }

    const data = await res.text();
    return new NextResponse(data, { status: res.status, headers: { 'Content-Type': contentType } });
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}

export const GET    = auth(async (req) => proxy(req, 'GET'));
export const POST   = auth(async (req) => proxy(req, 'POST'));
export const PUT    = auth(async (req) => proxy(req, 'PUT'));
export const PATCH  = auth(async (req) => proxy(req, 'PATCH'));
export const DELETE = auth(async (req) => proxy(req, 'DELETE'));
