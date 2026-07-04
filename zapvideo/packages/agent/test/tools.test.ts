import './setup'; // precisa vir antes de @zapvideo/core (isola o DATA_DIR)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultParams, getOrCreateSession } from '@zapvideo/core';
import { applyParamsUpdate, executeTool, updateParamsSchema } from '../src/tools';
import { runAgentTurn } from '../src/harness';

test('applyParamsUpdate aplica apenas os campos presentes', () => {
  const params = { ...defaultParams('promo'), title: 'Original', durationSec: 18 };
  const next = applyParamsUpdate(params, { durationSec: 12, accentColor: '#3b82f6' });
  assert.equal(next.title, 'Original');
  assert.equal(next.durationSec, 12);
  assert.equal(next.accentColor, '#3b82f6');
});

test('template não muda para depoimento via update', () => {
  const params = { ...defaultParams('depoimento') };
  const next = applyParamsUpdate(params, { template: 'oferta' });
  assert.equal(next.template, 'depoimento');
});

test('updateParamsSchema rejeita cor inválida', () => {
  assert.equal(updateParamsSchema.safeParse({ accentColor: 'azul' }).success, false);
  assert.equal(updateParamsSchema.safeParse({ accentColor: '#3b82f6' }).success, true);
});

test('start_render exige fotos para promo', () => {
  const session = getOrCreateSession(`t-${Date.now()}`, 'bot');
  session.videoParams = { ...defaultParams('promo'), title: 'X', images: [] };
  const out = executeTool('start_render', {}, { session, channel: 'bot' });
  assert.match(out, /nenhuma foto/i);
});

test('start_render cria job e respeita limite por sessão', () => {
  const session = getOrCreateSession(`t2-${Date.now()}`, 'bot');
  session.videoParams = { ...defaultParams('promo'), title: 'X', images: ['/tmp/x.jpg'] };
  for (let i = 0; i < 3; i++) {
    const out = executeTool('start_render', {}, { session, channel: 'bot' });
    assert.match(out, /jobId=/);
  }
  const blocked = executeTool('start_render', {}, { session, channel: 'bot' });
  assert.match(blocked, /limite/i);
});

test('runAgentTurn degrada para modo manual sem ANTHROPIC_API_KEY', async () => {
  const session = getOrCreateSession(`t3-${Date.now()}`, 'bot');
  const result = await runAgentTurn(session, 'bot', 'oi');
  // no ambiente de teste não há chave configurada
  if (!process.env.ANTHROPIC_API_KEY) {
    assert.equal(result.mode, 'manual');
  }
});
