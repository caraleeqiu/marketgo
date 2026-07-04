import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FONT_TITLE } from '../theme';

/** Marca d'água diagonal repetida — presente só na prévia gratuita. */
export const Watermark: React.FC = () => {
  const rows = Array.from({ length: 6 });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {rows.map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${i * 18 - 4}%`,
            left: '-20%',
            width: '140%',
            transform: 'rotate(-24deg)',
            fontFamily: FONT_TITLE,
            fontWeight: 700,
            fontSize: 54,
            letterSpacing: 6,
            color: 'rgba(255,255,255,0.16)',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          ZapVídeo • PRÉVIA • ZapVídeo • PRÉVIA • ZapVídeo • PRÉVIA
        </div>
      ))}
    </AbsoluteFill>
  );
};
