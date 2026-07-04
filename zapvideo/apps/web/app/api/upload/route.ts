import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { newId, uploadsDir, logEvent } from '@zapvideo/core';
import { sessionId } from '@/lib/session';

export const runtime = 'nodejs';

const MAX_BYTES = 80 * 1024 * 1024; // 80MB (clipes de depoimento)
const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['video/mp4', '.mp4'],
  ['video/quicktime', '.mov'],
]);

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const files = form.getAll('files') as File[];
  if (files.length === 0 || files.length > 5) {
    return NextResponse.json({ error: 'Envie de 1 a 5 arquivos.' }, { status: 400 });
  }
  const saved: { id: string; path: string; type: string }[] = [];
  for (const file of files) {
    const ext = ALLOWED.get(file.type);
    if (!ext) return NextResponse.json({ error: `Formato não suportado: ${file.type}` }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Arquivo muito grande (máx 80MB).' }, { status: 400 });
    const id = newId('u');
    const dest = path.join(uploadsDir(), `${id}${ext}`);
    fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
    saved.push({ id, path: dest, type: file.type });
  }
  logEvent('files_uploaded', { count: saved.length }, { sessionId: sessionId() });
  return NextResponse.json({ files: saved });
}
