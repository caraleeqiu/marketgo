import { claimNextJob, failJob, finishJob, logEvent } from '@zapvideo/core';
import { ensureBundle, renderJobVideo } from './renderer';

const POLL_MS = 2000;

/**
 * Worker de render: consome a fila `jobs` no SQLite.
 * Processa um job por vez — para o volume do MVP é suficiente e evita
 * brigar por CPU com o próprio render (que já paraleliza por frames).
 */
async function loop() {
  const job = claimNextJob();
  if (!job) {
    setTimeout(loop, POLL_MS);
    return;
  }
  console.log(`[worker] renderizando job ${job.id} (${job.params.template})…`);
  const started = Date.now();
  try {
    const { previewPath, cleanPath } = await renderJobVideo(job);
    finishJob(job.id, previewPath, cleanPath);
    logEvent('render_done', { ms: Date.now() - started, template: job.params.template }, { jobId: job.id, sessionId: job.sessionId });
    console.log(`[worker] job ${job.id} pronto em ${Math.round((Date.now() - started) / 1000)}s`);
  } catch (err) {
    const message = (err as Error).stack || String(err);
    console.error(`[worker] job ${job.id} falhou:`, message);
    failJob(job.id, message);
    logEvent('render_error', { error: message.slice(0, 500) }, { jobId: job.id, sessionId: job.sessionId });
  }
  setImmediate(loop);
}

async function main() {
  console.log('[worker] iniciando; pré-aquecendo bundle Remotion…');
  try {
    await ensureBundle();
    console.log('[worker] bundle pronto, aguardando jobs.');
  } catch (err) {
    console.error('[worker] falha ao empacotar Remotion:', err);
    process.exit(1);
  }
  loop();
}

main();
