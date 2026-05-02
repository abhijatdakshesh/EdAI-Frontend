import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';
const ALLOWED_PREFIX = `${IDENTITY_SERVICE_URL}/api/placement/`;

async function proxyToBackend(req: Parameters<Parameters<typeof auth>[0]>[0], method: string): Promise<NextResponse> {
  try {
    const accessToken = req.auth?.accessToken;
    if (!accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const url = new URL(req.url);
    // Extract path segments after /api/placement/ from the incoming URL
    const match = url.pathname.match(/\/api\/placement\/(.*)/);
    const pathSegments = match?.[1] ?? '';

    // Reject path traversal attempts and any non-safe characters before constructing the URL
    if (!/^[a-zA-Z0-9/_-]*$/.test(pathSegments)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const backendUrl = new URL(`${IDENTITY_SERVICE_URL}/api/placement/${pathSegments}${url.search}`);
    if (!backendUrl.toString().startsWith(ALLOWED_PREFIX)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
    const isWriteMethod = method !== 'GET' && method !== 'HEAD';
    if (isWriteMethod) headers['Content-Type'] = 'application/json';

    const body = isWriteMethod ? await req.text() : null;
    const res = await fetch(backendUrl.toString(), { method, headers, body });

    if (res.headers.get('content-type')?.includes('application/pdf')) {
      const buf = await res.arrayBuffer();
      return new NextResponse(buf, {
        status: res.status,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': res.headers.get('Content-Disposition') ?? 'attachment; filename="resume.pdf"',
        },
      });
    }

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}

export const GET    = auth(async (req) => proxyToBackend(req, 'GET'));
export const POST   = auth(async (req) => proxyToBackend(req, 'POST'));
export const PUT    = auth(async (req) => proxyToBackend(req, 'PUT'));
export const PATCH  = auth(async (req) => proxyToBackend(req, 'PATCH'));
export const DELETE = auth(async (req) => proxyToBackend(req, 'DELETE'));
