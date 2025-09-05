import { NextResponse } from 'next/server';
import { upsertFromFile } from '@/lib/seeders/subtopicSeeder';
import { withCors, preflight } from '../../_lib/cors';

export async function OPTIONS() { return preflight(); }

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return withCors(NextResponse.json({ error: 'Forbidden outside development' }, { status: 403 }));
  }
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file') || 'curriculum/primary-6/mathematics/algebra/unknown-letter.json';
    const res = await upsertFromFile(file, { seedFlow: true });
    return withCors(NextResponse.json({ ok: true, ...res }));
  } catch (e) {
    return withCors(NextResponse.json({ error: (e as Error).message }, { status: 500 }));
  }
}

export async function GET(request: Request) {
  // Convenience in dev: allow seeding via GET from browser
  return POST(request);
}
