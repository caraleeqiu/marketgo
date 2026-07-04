import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getJob } from '@zapvideo/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Serve a PRÉVIA com marca d'água (a versão limpa nunca sai por aqui). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const job = getJob(params.id);
  if (!job || job.status !== 'done' || !job.previewPath || !fs.existsSync(job.previewPath)) {
    return NextResponse.json({ error: 'not ready' }, { status: 404 });
  }
  const stat = fs.statSync(job.previewPath);
  const range = req.headers.get('range');
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
    const stream = fs.createReadStream(job.previewPath, { start, end });
    return new NextResponse(stream as unknown as ReadableStream, {
      status: 206,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(end - start + 1),
      },
    });
  }
  const stream = fs.createReadStream(job.previewPath);
  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(stat.size),
      'Accept-Ranges': 'bytes',
    },
  });
}
