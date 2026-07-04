import { NextResponse } from 'next/server';
import { getJob } from '@zapvideo/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const job = getJob(params.id);
  if (!job) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({
    id: job.id,
    status: job.status,
    template: job.params.template,
    title: job.params.title,
    error: job.status === 'error' ? 'Falha ao gerar o vídeo. Tente novamente.' : undefined,
  });
}
