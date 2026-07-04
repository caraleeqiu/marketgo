import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@zapvideo/core';
import { sessionId } from '@/lib/session';

export const runtime = 'nodejs';

const ALLOWED_EVENTS = new Set(['preview_watched', 'paywall_click', 'whatsapp_share']);

export async function POST(req: NextRequest) {
  const { name, jobId, props } = await req.json();
  if (!ALLOWED_EVENTS.has(name)) return NextResponse.json({ error: 'evento inválido' }, { status: 400 });
  logEvent(name, props, { sessionId: sessionId(), jobId });
  return NextResponse.json({ ok: true });
}
