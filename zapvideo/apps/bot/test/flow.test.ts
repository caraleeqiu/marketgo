import './setup'; // precisa vir antes de @zapvideo/core (isola o DATA_DIR)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getOrCreateSession, getJob, openDb } from '@zapvideo/core';
import { handleIncoming, formatWaNumber, previewCaption } from '../src/flow';

function freshSession(id: string) {
  return getOrCreateSession(`wa:${id}-${Date.now()}@s.whatsapp.net`, 'bot', '5511999998888');
}

test('primeira mensagem de texto sem fotos → saudação pedindo fotos', async () => {
  const s = freshSession('a');
  const r = await handleIncoming(s, { kind: 'text', text: 'oi' });
  assert.match(r.replies[0], /fotos/i);
});

test('foto recebida entra nos parâmetros e pede descrição', async () => {
  const s = freshSession('b');
  const r = await handleIncoming(s, { kind: 'image', path: '/tmp/foto1.jpg' });
  assert.match(r.replies[0], /recebida/i);
  assert.equal(s.videoParams?.images.length, 1);
});

test('fotos + descrição → cria job de render (modo manual, sem LLM)', async () => {
  const s = freshSession('c');
  await handleIncoming(s, { kind: 'image', path: '/tmp/foto1.jpg' });
  const r = await handleIncoming(s, { kind: 'text', text: 'Marmitas fit, R$ 18, entrega no centro' });
  assert.match(r.replies[0], /montando seu vídeo/i);

  const row = openDb()
    .prepare(`SELECT id FROM jobs WHERE session_id = ? ORDER BY created_at DESC LIMIT 1`)
    .get(s.id) as { id: string };
  const job = getJob(row.id)!;
  assert.equal(job.params.template, 'promo');
  assert.match(job.params.title, /Marmitas fit/);
  assert.equal(job.params.price, 'R$ 18');
  // número do WhatsApp da sessão vira o CTA do vídeo
  assert.equal(job.params.whatsapp, '(11) 99999-8888');
});

test('vídeo recebido muda o template para depoimento', async () => {
  const s = freshSession('d');
  const r = await handleIncoming(s, { kind: 'video', path: '/tmp/depo.mp4' });
  assert.match(r.replies[0], /depoimento/i);
  assert.equal(s.videoParams?.template, 'depoimento');
  assert.equal(s.videoParams?.clipPath, '/tmp/depo.mp4');
});

test('máximo de 5 fotos', async () => {
  const s = freshSession('e');
  for (let i = 0; i < 5; i++) await handleIncoming(s, { kind: 'image', path: `/tmp/f${i}.jpg` });
  const r = await handleIncoming(s, { kind: 'image', path: '/tmp/f6.jpg' });
  assert.match(r.replies[0], /5 fotos/i);
  assert.equal(s.videoParams?.images.length, 5);
});

test('formatWaNumber formata número brasileiro', () => {
  assert.equal(formatWaNumber('5511987654321'), '(11) 98765-4321');
  assert.equal(formatWaNumber('551133334444'), '(11) 3333-4444');
  assert.equal(formatWaNumber('123'), undefined);
});

test('previewCaption inclui link do paywall', () => {
  assert.match(previewCaption('v123'), /\/video\/v123/);
});
