import path from 'path';
import fs from 'fs';
import os from 'os';
import { bundle } from '@remotion/bundler';
import { getVideoMetadata, renderMedia, selectComposition } from '@remotion/renderer';
import { config, rendersDir, type RenderJob, type VideoParams } from '@zapvideo/core';
import { startAssetServer, toAssetUrl } from './assetServer';
import { getFxProvider } from './fx/provider';
import { transcribeClip } from './captions';

let bundlePromise: Promise<string> | null = null;

/** Bundle do projeto Remotion (webpack) — feito uma vez por processo. */
export function ensureBundle(): Promise<string> {
  if (!bundlePromise) {
    const entry = path.resolve(__dirname, '../remotion/index.ts');
    console.log('[renderer] empacotando composições Remotion…');
    bundlePromise = bundle({
      entryPoint: entry,
      publicDir: path.resolve(__dirname, '../remotion/public'),
      outDir: path.join(os.tmpdir(), 'zapvideo-remotion-bundle'),
    });
  }
  return bundlePromise;
}

export interface RenderResult {
  previewPath: string;
  cleanPath: string;
}

/**
 * Renderiza as duas versões de um job:
 *  - prévia 720x1280 com marca d'água (a que o usuário recebe de graça)
 *  - final 1080x1920 limpa (liberada após pagamento — fake door por ora)
 */
export async function renderJobVideo(job: RenderJob): Promise<RenderResult> {
  const serveUrl = await ensureBundle();
  const assets = await startAssetServer();
  try {
    const params: VideoParams = { ...job.params };

    // 1) Abertura animada por IA (opcional, só promo/oferta, nunca bloqueia)
    if (params.template !== 'depoimento' && params.images.length > 0) {
      const fx = getFxProvider();
      if (fx.name !== 'none') {
        const intro = await fx.animateImage(
          params.images[0],
          `Product showcase video, smooth camera motion, vibrant, ${params.title}`,
          rendersDir()
        );
        if (intro) params.introFxPath = intro;
      }
    }

    // 2) Legendas automáticas do depoimento (opcional)
    let clipDurationSec: number | undefined;
    if (params.template === 'depoimento' && params.clipPath) {
      try {
        const meta = await getVideoMetadata(params.clipPath);
        clipDurationSec = Math.min(60, meta.durationInSeconds || 8);
      } catch {
        clipDurationSec = 8;
      }
      if (!params.captions || params.captions.length === 0) {
        const captions = await transcribeClip(params.clipPath);
        if (captions) params.captions = captions;
      }
    }

    // 3) Caminhos locais → URLs do asset server (o Chromium não lê o fs)
    const inputBase: Record<string, unknown> = {
      ...params,
      images: params.images.map((p) => toAssetUrl(assets.baseUrl, p)),
      clipPath: params.clipPath ? toAssetUrl(assets.baseUrl, params.clipPath) : undefined,
      introFxPath: params.introFxPath ? toAssetUrl(assets.baseUrl, params.introFxPath) : undefined,
      clipDurationSec,
    };

    const outDir = path.join(rendersDir(), job.id);
    fs.mkdirSync(outDir, { recursive: true });
    const previewPath = path.join(outDir, 'preview.mp4');
    const cleanPath = path.join(outDir, 'final.mp4');

    const renderOnce = async (watermark: boolean, outputLocation: string, scale: number) => {
      const inputProps = { ...inputBase, watermark };
      const composition = await selectComposition({
        serveUrl,
        id: params.template,
        inputProps,
        browserExecutable: config.remotionBrowserExecutable,
      });
      await renderMedia({
        composition,
        serveUrl,
        codec: 'h264',
        outputLocation,
        inputProps,
        scale,
        browserExecutable: config.remotionBrowserExecutable,
        concurrency: config.renderConcurrency,
        chromiumOptions: { gl: 'angle-egl' },
        logLevel: 'warn',
      });
    };

    await renderOnce(true, previewPath, 2 / 3); // prévia 720x1280
    await renderOnce(false, cleanPath, 1); // final 1080x1920

    return { previewPath, cleanPath };
  } finally {
    assets.close();
  }
}
