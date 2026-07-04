import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT_TITLE, FONT_BODY } from '../theme';

/** Cartela final com CTA e número de WhatsApp. */
export const EndCard: React.FC<{
  cta: string;
  whatsapp?: string;
  accentColor: string;
}> = ({ cta, whatsapp, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 13 } });
  const pulse = 1 + 0.03 * Math.sin((frame / fps) * Math.PI * 2.2);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 30%, ${accentColor}33, ${COLORS.bg} 70%)`,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 48,
        padding: '0 72px',
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
          fontFamily: FONT_TITLE,
          fontWeight: 700,
          fontSize: 88,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.12,
        }}
      >
        {cta}
      </div>
      {whatsapp ? (
        <div
          style={{
            transform: `scale(${pulse})`,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            background: accentColor,
            borderRadius: 999,
            padding: '26px 56px',
          }}
        >
          {/* balão de conversa */}
          <svg width="56" height="56" viewBox="0 0 24 24" fill="#0b0f14">
            <path d="M12 3C7.03 3 3 6.82 3 11.5c0 2.29.97 4.37 2.56 5.9L5 21l3.8-1.35c1 .29 2.07.45 3.2.45 4.97 0 9-3.82 9-8.6S16.97 3 12 3z" />
          </svg>
          <span
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 700,
              fontSize: 56,
              color: '#0b0f14',
            }}
          >
            {whatsapp}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
