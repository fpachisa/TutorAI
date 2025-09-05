import { NextResponse } from 'next/server';

const ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*';

export function corsHeaders() {
  return new Headers({
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
  });
}

export function withCors<T>(res: NextResponse<T>) {
  const headers = corsHeaders();
  headers.forEach((value, key) => res.headers.set(key, value));
  return res;
}

export function preflight() {
  return withCors(new NextResponse(null, { status: 204 }));
}

