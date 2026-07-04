import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import {
  createJob,
  defaultParams,
  logEvent,
  openDb,
  type TemplateId,
  type VideoParams,
} from '@zapvideo/core';
import { sessionId } from '@/lib/session';

export const runtime = 'nodejs';

const MAX_JOBS_PER_SESSION = 10;

/** Cria um job de renderização a partir dos dados do assistente/wizard. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const sid = sessionId();

  const count = (openDb()
    .prepare(`SELECT COUNT(*) c FROM jobs WHERE session_id = ?`)
    .get(sid) as { c: number }).c;
  if (count >= MAX_JOBS_PER_SESSION) {
    return NextResponse.json({ error: 'Limite de vídeos atingido. Fale com a gente no WhatsApp!' }, { status: 429 });
  }

  const template = (['promo', 'oferta', 'depoimento'] as TemplateId[]).includes(body.template)
    ? (body.template as TemplateId)
    : 'promo';

  const params: VideoParams = {
    ...defaultParams(template),
    template,
    images: Array.isArray(body.images) ? body.images.slice(0, 5) : [],
    clipPath: typeof body.clipPath === 'string' ? body.clipPath : undefined,
    title: String(body.title || '').slice(0, 60),
    bullets: (Array.isArray(body.bullets) ? body.bullets : []).map((b: unknown) => String(b).slice(0, 50)).filter(Boolean).slice(0, 3),
    price: body.price ? String(body.price).slice(0, 20) : undefined,
    cta: String(body.cta || 'Chame no WhatsApp!').slice(0, 50),
    whatsapp: body.whatsapp ? String(body.whatsapp).slice(0, 25) : undefined,
    studentName: body.studentName ? String(body.studentName).slice(0, 40) : undefined,
    courseName: body.courseName ? String(body.courseName).slice(0, 40) : undefined,
    quote: body.quote ? String(body.quote).slice(0, 140) : undefined,
    accentColor: /^#[0-9a-fA-F]{6}$/.test(body.accentColor) ? body.accentColor : defaultParams(template).accentColor,
    musicTrack: ['energia', 'calma', 'nenhuma'].includes(body.musicTrack) ? body.musicTrack : 'energia',
    durationSec: Math.min(30, Math.max(10, Number(body.durationSec) || 18)),
  };

  if (template !== 'depoimento') {
    if (params.images.length === 0) {
      return NextResponse.json({ error: 'Envie pelo menos 1 foto.' }, { status: 400 });
    }
    for (const img of params.images) {
      if (typeof img !== 'string' || !fs.existsSync(img)) {
        return NextResponse.json({ error: 'Upload inválido, tente de novo.' }, { status: 400 });
      }
    }
  } else if (!params.clipPath || !fs.existsSync(params.clipPath)) {
    return NextResponse.json({ error: 'Envie o vídeo do depoimento.' }, { status: 400 });
  }
  if (!params.title) {
    return NextResponse.json({ error: 'O vídeo precisa de um título.' }, { status: 400 });
  }

  const jobId = createJob(params, 'web', sid);
  logEvent('video_created', { template, via: 'wizard' }, { sessionId: sid, jobId });
  return NextResponse.json({ jobId });
}
