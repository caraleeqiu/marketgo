import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig, OffthreadVideo } from 'remotion';
import type { VideoParams } from '@zapvideo/core';
import type { RenderExtras } from '../theme';
import { COLORS } from '../theme';
import { KenBurns } from '../components/KenBurns';
import { TitleBlock } from '../components/TitleBlock';
import { Bullets } from '../components/Bullets';
import { EndCard } from '../components/EndCard';
import { Watermark } from '../components/Watermark';

const END_CARD_SEC = 3.2;

/**
 * Template "promo": abertura (foto animada por IA quando houver) →
 * slideshow Ken Burns com título/preço/bullets → cartela final de CTA.
 */
export const Promo: React.FC<VideoParams & RenderExtras> = (p) => {
  const { fps, durationInFrames } = useVideoConfig();
  const endCardFrames = Math.round(END_CARD_SEC * fps);
  const showFrames = durationInFrames - endCardFrames;

  const introFrames = p.introFxPath ? Math.min(Math.round(3 * fps), showFrames) : 0;
  const slidesFrames = showFrames - introFrames;
  const images = p.images.length > 0 ? p.images : [];
  const perSlide = images.length > 0 ? Math.floor(slidesFrames / images.length) : slidesFrames;

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {p.musicTrack !== 'nenhuma' ? (
        <Audio src={staticFile(`music/${p.musicTrack}.wav`)} volume={0.55} />
      ) : null}

      {introFrames > 0 && p.introFxPath ? (
        <Sequence durationInFrames={introFrames}>
          <OffthreadVideo src={p.introFxPath} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
        </Sequence>
      ) : null}

      <Sequence from={introFrames} durationInFrames={slidesFrames}>
        <AbsoluteFill>
          {images.map((src, i) => (
            <Sequence key={i} from={i * perSlide} durationInFrames={i === images.length - 1 ? slidesFrames - i * perSlide : perSlide}>
              <KenBurns src={src} durationInFrames={perSlide} direction={i} />
            </Sequence>
          ))}
          {/* véu para legibilidade do texto */}
          <AbsoluteFill
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.72) 100%)',
            }}
          />
          <TitleBlock title={p.title} price={p.price} accentColor={p.accentColor} />
          <Bullets bullets={p.bullets} accentColor={p.accentColor} startFrame={Math.round(fps * 0.6)} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={showFrames} durationInFrames={endCardFrames}>
        <EndCard cta={p.cta} whatsapp={p.whatsapp} accentColor={p.accentColor} />
      </Sequence>

      {p.watermark ? <Watermark /> : null}
    </AbsoluteFill>
  );
};
