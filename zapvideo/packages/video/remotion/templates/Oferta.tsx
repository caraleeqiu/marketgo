import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { VideoParams } from '@zapvideo/core';
import type { RenderExtras } from '../theme';
import { COLORS, FONT_TITLE } from '../theme';
import { KenBurns } from '../components/KenBurns';
import { Bullets } from '../components/Bullets';
import { EndCard } from '../components/EndCard';
import { Watermark } from '../components/Watermark';

const END_CARD_SEC = 3.2;

/** Selo pulsante de urgência. */
const UrgencyBadge: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 1 + 0.06 * Math.sin((frame / fps) * Math.PI * 3);
  return (
    <div
      style={{
        position: 'absolute',
        top: 90,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        transform: `scale(${pulse})`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_TITLE,
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: 4,
          color: '#fff',
          background: '#e11d48',
          padding: '14px 42px',
          borderRadius: 999,
          boxShadow: `0 0 40px ${accentColor}88`,
        }}
      >
        ⏰ SÓ ESTA SEMANA
      </div>
    </div>
  );
};

/** Preço gigante com riscado opcional ("de R$X por R$Y" cabe no title). */
const BigPrice: React.FC<{ price?: string; accentColor: string }> = ({ price, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - Math.round(fps * 0.5), fps, config: { damping: 11 } });
  if (!price) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 640,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.6, 1])}) rotate(-3deg)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_TITLE,
          fontWeight: 700,
          fontSize: 110,
          color: '#0b0f14',
          background: accentColor,
          padding: '18px 64px',
          borderRadius: 24,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {price}
      </div>
    </div>
  );
};

/** Template "oferta": urgência de promoção relâmpago. */
export const Oferta: React.FC<VideoParams & RenderExtras> = (p) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const endCardFrames = Math.round(END_CARD_SEC * fps);
  const showFrames = durationInFrames - endCardFrames;
  const images = p.images;
  const perSlide = images.length > 0 ? Math.floor(showFrames / images.length) : showFrames;

  const titleEnter = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {p.musicTrack !== 'nenhuma' ? (
        <Audio src={staticFile(`music/${p.musicTrack}.wav`)} volume={0.6} />
      ) : null}

      <Sequence durationInFrames={showFrames}>
        <AbsoluteFill>
          {images.map((src, i) => (
            <Sequence key={i} from={i * perSlide} durationInFrames={i === images.length - 1 ? showFrames - i * perSlide : perSlide}>
              <KenBurns src={src} durationInFrames={perSlide} direction={i + 1} />
            </Sequence>
          ))}
          <AbsoluteFill
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.8) 100%)',
            }}
          />
          <UrgencyBadge accentColor={p.accentColor} />
          <div
            style={{
              position: 'absolute',
              top: 230,
              left: 48,
              right: 48,
              textAlign: 'center',
              fontFamily: FONT_TITLE,
              fontWeight: 700,
              fontSize: 96,
              lineHeight: 1.05,
              color: '#fff',
              textShadow: '0 6px 30px rgba(0,0,0,0.8)',
              opacity: titleEnter,
              transform: `translateY(${(1 - titleEnter) * 80}px)`,
            }}
          >
            {p.title}
          </div>
          <BigPrice price={p.price} accentColor={p.accentColor} />
          <Bullets bullets={p.bullets} accentColor={p.accentColor} startFrame={Math.round(fps * 1)} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={showFrames} durationInFrames={endCardFrames}>
        <EndCard cta={p.cta} whatsapp={p.whatsapp} accentColor={p.accentColor} />
      </Sequence>

      {p.watermark ? <Watermark /> : null}
    </AbsoluteFill>
  );
};
