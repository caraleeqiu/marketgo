import React from 'react';
import { Composition } from 'remotion';
import type { VideoParams } from '@zapvideo/core';
import './fonts';
import { FPS, HEIGHT, WIDTH, RenderExtras } from './theme';
import { Promo } from './templates/Promo';
import { Oferta } from './templates/Oferta';
import { Depoimento, DEPO_INTRO_SEC, DEPO_OUTRO_SEC } from './templates/Depoimento';

type Props = VideoParams & RenderExtras;

const baseDefaults: Props = {
  template: 'promo',
  images: [],
  title: 'Curso de Manicure Profissional',
  bullets: ['Certificado incluso', 'Turmas aos sábados', 'Material completo'],
  price: 'R$ 297',
  cta: 'Garanta sua vaga!',
  whatsapp: '(11) 99999-9999',
  accentColor: '#22c55e',
  musicTrack: 'energia',
  durationSec: 18,
  watermark: true,
};

/**
 * Duração dinâmica: promo/oferta usam durationSec; depoimento =
 * intro + clipe (medido pelo worker) + outro.
 */
function metadata(kind: 'timed' | 'clip') {
  return ({ props }: { props: Props }) => {
    if (kind === 'clip') {
      const clip = Math.max(2, props.clipDurationSec ?? 8);
      return {
        durationInFrames: Math.round((DEPO_INTRO_SEC + clip + DEPO_OUTRO_SEC) * FPS),
        props,
      };
    }
    const sec = Math.min(40, Math.max(10, props.durationSec || 18));
    return { durationInFrames: Math.round(sec * FPS), props };
  };
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="promo"
        component={Promo}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={18 * FPS}
        defaultProps={baseDefaults}
        calculateMetadata={metadata('timed')}
      />
      <Composition
        id="oferta"
        component={Oferta}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={18 * FPS}
        defaultProps={{ ...baseDefaults, template: 'oferta' as const }}
        calculateMetadata={metadata('timed')}
      />
      <Composition
        id="depoimento"
        component={Depoimento}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={14 * FPS}
        defaultProps={{
          ...baseDefaults,
          template: 'depoimento' as const,
          quote: 'Depois do curso consegui meu primeiro emprego na área!',
          studentName: 'Maria Silva',
          courseName: 'Auxiliar Administrativo',
        }}
        calculateMetadata={metadata('clip')}
      />
    </>
  );
};
