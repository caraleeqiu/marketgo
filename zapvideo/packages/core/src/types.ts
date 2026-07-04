export type TemplateId = 'promo' | 'depoimento' | 'oferta';

export type MusicTrack = 'energia' | 'calma' | 'nenhuma';

export interface Caption {
  /** segundos, relativo ao início do clipe */
  start: number;
  end: number;
  text: string;
}

/**
 * Parâmetros completos de um vídeo. É o contrato entre o agent (que os
 * produz/edita), a fila de render e os templates Remotion (que os consomem).
 */
export interface VideoParams {
  template: TemplateId;
  /** caminhos absolutos das fotos enviadas (promo/oferta: 1–5) */
  images: string[];
  /** caminho absoluto do clipe enviado (depoimento) */
  clipPath?: string;
  title: string;
  /** até 3 argumentos de venda */
  bullets: string[];
  price?: string;
  cta: string;
  /** número WhatsApp exibido no CTA final */
  whatsapp?: string;
  /** modo depoimento */
  studentName?: string;
  courseName?: string;
  /** citação usada quando não há legendas automáticas */
  quote?: string;
  captions?: Caption[];
  /** cor de destaque (hex) */
  accentColor: string;
  musicTrack: MusicTrack;
  /** 15–25s (promo/oferta); depoimento segue o clipe */
  durationSec: number;
  /** caminho de um mp4 de abertura gerado por IA (opcional) */
  introFxPath?: string;
}

export type JobStatus = 'queued' | 'rendering' | 'done' | 'error';

export interface RenderJob {
  id: string;
  status: JobStatus;
  params: VideoParams;
  previewPath?: string;
  cleanPath?: string;
  error?: string;
  source: 'web' | 'bot';
  sessionId?: string;
  createdAt: string;
}

export const DEFAULT_ACCENT = '#22c55e';

export function defaultParams(template: TemplateId): VideoParams {
  return {
    template,
    images: [],
    title: '',
    bullets: [],
    cta: 'Chame no WhatsApp!',
    accentColor: DEFAULT_ACCENT,
    musicTrack: 'energia',
    durationSec: 18,
  };
}
