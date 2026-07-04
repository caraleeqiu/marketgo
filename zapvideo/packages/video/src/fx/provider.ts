import { config } from '@zapvideo/core';
import { seedanceProvider } from './seedance';

/**
 * Abstração dos efeitos de vídeo por IA (abertura animada a partir da 1ª foto).
 * `none` = sem efeito (puro template). Trocar para Seedance 2.5 depois é só
 * configurar VIDEO_FX_PROVIDER=seedance + chave no .env.
 */
export interface VideoFxProvider {
  name: string;
  /**
   * Anima uma imagem estática em um clipe curto (~3s, 9:16).
   * Retorna o caminho absoluto do mp4 gerado (dentro do DATA_DIR),
   * ou null se indisponível — o template então segue sem abertura IA.
   */
  animateImage(imagePath: string, prompt: string, outDir: string): Promise<string | null>;
}

const noneProvider: VideoFxProvider = {
  name: 'none',
  animateImage: async () => null,
};

export function getFxProvider(): VideoFxProvider {
  if (config.videoFxProvider === 'seedance' && config.seedanceApiKey) {
    return seedanceProvider;
  }
  return noneProvider;
}
