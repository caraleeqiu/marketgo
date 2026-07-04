import { NextRequest, NextResponse } from 'next/server';
import { generateCopy } from '@zapvideo/agent';
import { sessionId } from '@/lib/session';

export const runtime = 'nodejs';

/**
 * Gera o texto de marketing a partir da descrição do negócio.
 * Sem ANTHROPIC_API_KEY (ou em erro) devolve { manual: true } e o
 * front cai no formulário manual — o fluxo nunca bloqueia.
 */
export async function POST(req: NextRequest) {
  const { description, template } = await req.json();
  if (!description || typeof description !== 'string') {
    return NextResponse.json({ error: 'Descreva seu negócio em uma frase.' }, { status: 400 });
  }
  const copy = await generateCopy(description.slice(0, 500), template || 'promo', sessionId());
  if (!copy) return NextResponse.json({ manual: true });
  return NextResponse.json({ copy });
}
