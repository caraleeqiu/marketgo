import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { Caption } from '@zapvideo/core';
import { FONT_BODY } from '../theme';

/**
 * Faixa de legenda sobre o clipe do depoimento.
 * Com `captions` mostra o segmento ativo; sem elas, mostra a citação fixa.
 */
export const CaptionStrip: React.FC<{
  captions?: Caption[];
  quote?: string;
  accentColor: string;
}> = ({ captions, quote, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tSec = frame / fps;

  let text: string | undefined;
  if (captions && captions.length > 0) {
    text = captions.find((c) => tSec >= c.start && tSec < c.end)?.text;
  } else if (quote) {
    text = `“${quote}”`;
  }
  if (!text) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 48,
        right: 48,
        bottom: 220,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: FONT_BODY,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.3,
          color: '#fff',
          background: 'rgba(0,0,0,0.62)',
          borderLeft: `10px solid ${accentColor}`,
          borderRadius: 16,
          padding: '20px 32px',
          textAlign: 'center',
        }}
      >
        {text}
      </div>
    </div>
  );
};
