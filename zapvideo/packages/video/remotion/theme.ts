export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const COLORS = {
  bg: '#0b0f14',
  text: '#ffffff',
  textDim: 'rgba(255,255,255,0.72)',
};

export const FONT_TITLE = 'Montserrat';
export const FONT_BODY = 'Montserrat';

/** Props extras injetadas pelo worker além dos VideoParams */
export interface RenderExtras {
  watermark: boolean;
  /** duração do clipe do depoimento, medida pelo worker */
  clipDurationSec?: number;
}
