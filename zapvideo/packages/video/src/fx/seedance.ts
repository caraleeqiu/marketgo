import fs from 'fs';
import path from 'path';
import { config, newId } from '@zapvideo/core';
import type { VideoFxProvider } from './provider';

const FAL_ENDPOINT = 'https://fal.run/fal-ai/bytedance/seedance/v1/pro/image-to-video';

/**
 * Seedance (ByteDance) via fal.ai — image-to-video para a abertura de 3s.
 * Implementação mínima e tolerante a falha: qualquer erro devolve null e o
 * render segue sem o efeito (nunca bloqueia a fila).
 *
 * Quando o time migrar para Seedance 2.5/endpoint próprio da BytePlus, basta
 * ajustar FAL_ENDPOINT e o corpo da requisição aqui.
 */
export const seedanceProvider: VideoFxProvider = {
  name: 'seedance',
  async animateImage(imagePath, prompt, outDir) {
    try {
      const imageB64 = fs.readFileSync(imagePath).toString('base64');
      const ext = path.extname(imagePath).replace('.', '') || 'jpeg';
      const res = await fetch(FAL_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Key ${config.seedanceApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: `data:image/${ext};base64,${imageB64}`,
          prompt,
          duration: 3,
          aspect_ratio: '9:16',
        }),
        signal: AbortSignal.timeout(180_000),
      });
      if (!res.ok) {
        console.warn(`[fx:seedance] HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
        return null;
      }
      const data = (await res.json()) as { video?: { url?: string } };
      const videoUrl = data.video?.url;
      if (!videoUrl) return null;
      const clip = await fetch(videoUrl, { signal: AbortSignal.timeout(120_000) });
      if (!clip.ok) return null;
      const outPath = path.join(outDir, `fx-${newId()}.mp4`);
      fs.writeFileSync(outPath, Buffer.from(await clip.arrayBuffer()));
      return outPath;
    } catch (err) {
      console.warn('[fx:seedance] falhou, seguindo sem efeito:', (err as Error).message);
      return null;
    }
  },
};
