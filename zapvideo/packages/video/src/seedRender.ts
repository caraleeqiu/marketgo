import fs from 'fs';
import path from 'path';
import { createJob, finishJob, getJob, uploadsDir, type VideoParams, defaultParams } from '@zapvideo/core';
import { renderJobVideo } from './renderer';

/** Renderiza direto (sem worker) e marca o job como concluído na fila. */
async function renderSeed(params: VideoParams) {
  const job = getJob(createJob(params, 'web'))!;
  const out = await renderJobVideo(job);
  finishJob(job.id, out.previewPath, out.cleanPath);
  return out;
}

/**
 * Demonstração: renderiza os 3 templates com os assets de exemplo do repo.
 * O clipe do "depoimento" é o próprio vídeo promo renderizado antes —
 * assim o seed não depende de nenhum mp4 externo.
 *
 *   npm run seed:render -w packages/video
 */
async function main() {
  const seedDir = path.resolve(__dirname, '../seed-assets');
  const dest = uploadsDir();
  const images: string[] = [];
  for (const f of fs.readdirSync(seedDir).filter((f) => f.endsWith('.jpg') || f.endsWith('.png'))) {
    const to = path.join(dest, `seed-${f}`);
    fs.copyFileSync(path.join(seedDir, f), to);
    images.push(to);
  }
  if (images.length === 0) throw new Error(`Nenhuma imagem de seed em ${seedDir}`);

  const promo: VideoParams = {
    ...defaultParams('promo'),
    images,
    title: 'Curso de Barbeiro Profissional',
    bullets: ['Certificado reconhecido', 'Aulas práticas', 'Kit de ferramentas incluso'],
    price: 'R$ 397',
    cta: 'Últimas vagas de julho!',
    whatsapp: '(11) 98765-4321',
    durationSec: 16,
  };

  const oferta: VideoParams = {
    ...defaultParams('oferta'),
    template: 'oferta',
    images,
    title: 'Matrícula com 50% OFF',
    bullets: ['Só até sexta', 'Turma manhã e noite'],
    price: 'R$ 198',
    cta: 'Chama no WhatsApp agora!',
    whatsapp: '(11) 98765-4321',
    accentColor: '#f59e0b',
    durationSec: 14,
  };

  console.log('== render promo ==');
  const promoOut = await renderSeed(promo);
  console.log('promo:', promoOut.previewPath);

  console.log('== render oferta ==');
  const ofertaOut = await renderSeed(oferta);
  console.log('oferta:', ofertaOut.previewPath);

  // usa o próprio promo final como "clipe do aluno"
  const clipCopy = path.join(dest, 'seed-clip.mp4');
  fs.copyFileSync(promoOut.cleanPath, clipCopy);
  const depoimento: VideoParams = {
    ...defaultParams('depoimento'),
    template: 'depoimento',
    clipPath: clipCopy,
    studentName: 'João Pereira',
    courseName: 'Barbeiro Profissional',
    quote: 'Em 2 meses já estava atendendo meus primeiros clientes.',
    cta: 'Venha ser o próximo!',
    whatsapp: '(11) 98765-4321',
    accentColor: '#38bdf8',
    musicTrack: 'calma',
    durationSec: 0,
  };

  console.log('== render depoimento ==');
  const depoOut = await renderSeed(depoimento);
  console.log('depoimento:', depoOut.previewPath);

  console.log('\nSeed concluído. Vídeos em data/renders/.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
