import { NextRequest, NextResponse } from 'next/server';
import { createJob, getJob, logEvent, openDb } from '@zapvideo/core';
import { parseEditInstruction } from '@zapvideo/agent';
import { sessionId } from '@/lib/session';

export const runtime = 'nodejs';

const MAX_EDITS_PER_JOB_CHAIN = 2;

/**
 * "Mude com uma frase": o agent converte a instrução em diff de parâmetros
 * e re-renderiza. Sem LLM configurado devolve { manual: true }.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const job = getJob(params.id);
  if (!job) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const sid = sessionId();
  const edits = (openDb()
    .prepare(`SELECT COUNT(*) c FROM events WHERE name = 'video_edited' AND session_id = ?`)
    .get(sid) as { c: number }).c;
  if (edits >= MAX_EDITS_PER_JOB_CHAIN) {
    return NextResponse.json({ error: 'Limite de ajustes atingido nesta sessão.' }, { status: 429 });
  }

  const { instruction } = await req.json();
  if (!instruction || typeof instruction !== 'string') {
    return NextResponse.json({ error: 'Diga o que quer mudar.' }, { status: 400 });
  }

  const newParams = await parseEditInstruction(job.params, instruction.slice(0, 300), sid);
  if (!newParams) return NextResponse.json({ manual: true });

  const newJobId = createJob(newParams, 'web', sid);
  logEvent('video_edited', { from: job.id, instruction: instruction.slice(0, 200) }, { sessionId: sid, jobId: newJobId });
  return NextResponse.json({ jobId: newJobId });
}
