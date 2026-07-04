import { NextRequest, NextResponse } from 'next/server';
import { logEvent, saveLead } from '@zapvideo/core';
import { sessionId } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { phone, jobId } = await req.json();
  const clean = String(phone || '').replace(/[^\d+() -]/g, '').trim();
  // número BR: DDD + 8-9 dígitos
  if (clean.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Número inválido. Use DDD + número.' }, { status: 400 });
  }
  saveLead(clean, jobId, 'paywall');
  logEvent('phone_submitted', undefined, { sessionId: sessionId(), jobId });
  return NextResponse.json({ ok: true });
}
