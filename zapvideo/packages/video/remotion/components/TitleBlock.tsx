import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT_TITLE } from '../theme';

/** Título grande + selo de preço, animados na entrada. */
export const TitleBlock: React.FC<{
  title: string;
  price?: string;
  accentColor: string;
}> = ({ title, price, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const y = interpolate(enter, [0, 1], [60, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 120,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        padding: '0 64px',
        transform: `translateY(${y}px)`,
        opacity: enter,
      }}
    >
      <div
        style={{
          fontFamily: FONT_TITLE,
          fontWeight: 700,
          fontSize: 84,
          lineHeight: 1.08,
          color: '#fff',
          textAlign: 'center',
          textShadow: '0 4px 24px rgba(0,0,0,0.65)',
        }}
      >
        {title}
      </div>
      {price ? (
        <div
          style={{
            fontFamily: FONT_TITLE,
            fontWeight: 700,
            fontSize: 64,
            color: '#0b0f14',
            background: accentColor,
            padding: '12px 44px',
            borderRadius: 999,
            boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
          }}
        >
          {price}
        </div>
      ) : null}
    </div>
  );
};
