import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT_BODY } from '../theme';

/** Lista de argumentos de venda, um por vez. */
export const Bullets: React.FC<{ bullets: string[]; accentColor: string; startFrame?: number }> = ({
  bullets,
  accentColor,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        bottom: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      {bullets.slice(0, 3).map((b, i) => {
        const enter = spring({
          frame: frame - startFrame - i * Math.round(fps * 0.4),
          fps,
          config: { damping: 15 },
        });
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              opacity: enter,
              transform: `translateX(${(1 - enter) * 80}px)`,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: accentColor,
                flexShrink: 0,
                boxShadow: '0 0 16px rgba(0,0,0,0.4)',
              }}
            />
            <div
              style={{
                fontFamily: FONT_BODY,
                fontWeight: 700,
                fontSize: 46,
                color: '#fff',
                textShadow: '0 3px 16px rgba(0,0,0,0.75)',
              }}
            >
              {b}
            </div>
          </div>
        );
      })}
    </div>
  );
};
