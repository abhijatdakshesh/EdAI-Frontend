import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';
const ALLOWED_PREFIX = `${IDENTITY_SERVICE_URL}/api/placement/`;

type Ctx = { params?: { path?: string[] } };
type AuthedReq = Parameters<Parameters<typeof auth>[0]>[0];

async function proxyToBackend(req: AuthedReq, ctx: Ctx | undefined, method: string): Promise<NextResponse> {
  try {
    const accessToken = req.auth?.accessToken;
    if (!accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const pathSegments = (ctx?.params?.path ?? []).join('/');
    const url = new URL(req.url);

    // Build target URL and validate it stays within /api/placement/ — prevents path traversal/SSRF
    const backendUrl = new URL(`${IDENTITY_SERVICE_URL}/api/placement/${pathSegments}${url.search}`);
    if (!backendUrl.toString().startsWith(ALLOWED_PREFIX)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
    const isWriteMethod = method !== 'GET' && method !== 'HEAD';
    if (isWriteMethod) headers['Content-Type'] = 'application/json';

    const body = isWriteMethod ? await req.text() : undefined;

    const res = await fetch(backendUrl.toString(), { method, headers, body });

    // PDF passthrough — preserve binary response
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
  } catch (err) {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}

export const GET    = auth((req, ctx: Ctx) => proxyToBackend(req, ctx, 'GET'));
export const POST   = auth((req, ctx: Ctx) => proxyToBackend(req, ctx, 'POST'));
export const PUT    = auth((req, ctx: Ctx) => proxyToBackend(req, ctx, 'PUT'));
export const PATCH  = auth((req, ctx: Ctx) => proxyToBackend(req, ctx, 'PATCH'));
export const DELETE = auth((req, ctx: Ctx) => proxyToBackend(req, ctx, 'DELETE'));
