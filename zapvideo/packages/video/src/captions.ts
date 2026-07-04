import fs from 'fs';
import path from 'path';
import { config, type Caption } from '@zapvideo/core';

/**
 * Legendas automáticas do clipe de depoimento via Whisper (OpenAI).
 * Sem OPENAI_API_KEY (ou em erro) retorna null — o template usa a citação
 * digitada (`quote`) no lugar.
 */
export async function transcribeClip(clipPath: string): Promise<Caption[] | null> {
  if (!config.openaiApiKey) return null;
  try {
    const form = new FormData();
    const buf = fs.readFileSync(clipPath);
    form.append('file', new Blob([buf]), path.basename(clipPath));
    form.append('model', 'whisper-1');
    form.append('language', 'pt');
    form.append('response_format', 'verbose_json');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.openaiApiKey}` },
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      console.warn(`[captions] HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return null;
    }
    const data = (await res.json()) as {
      segments?: { start: number; end: number; text: string }[];
    };
    if (!data.segments || data.segments.length === 0) return null;
    return data.segments.map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }));
  } catch (err) {
    console.warn('[captions] transcrição falhou, usando citação:', (err as Error).message);
    return null;
  }
}
