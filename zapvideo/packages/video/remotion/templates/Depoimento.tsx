import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { VideoParams } from '@zapvideo/core';
import type { RenderExtras } from '../theme';
import { COLORS, FONT_BODY, FONT_TITLE } from '../theme';
import { CaptionStrip } from '../components/CaptionStrip';
import { EndCard } from '../components/EndCard';
import { Watermark } from '../components/Watermark';

export const DEPO_INTRO_SEC = 2.6;
export const DEPO_OUTRO_SEC = 3.2;

/** Cartela de abertura: nome do aluno + curso. */
const IntroCard: React.FC<{ studentName?: string; courseName?: string; accentColor: string }> = ({
  studentName,
  courseName,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 25%, ${accentColor}2e, ${COLORS.bg} 70%)`,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 30,
        padding: '0 72px',
      }}
    >
      <div
        style={{
          fontFamily: FONT_BODY,
          fontWeight: 400,
          fontSize: 44,
          letterSpacing: 6,
          color: 'rgba(255,255,255,0.75)',
          textTransform: 'uppercase',
          opacity: enter,
        }}
      >
        História de aluno
      </div>
      <div
        style={{
          fontFamily: FONT_TITLE,
          fontWeight: 700,
          fontSize: 92,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.1,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 60}px)`,
        }}
      >
        {studentName || 'Nosso aluno'}
      </div>
      {courseName ? (
        <div
          style={{
            fontFamily: FONT_BODY,
            fontWeight: 700,
            fontSize: 46,
            color: '#0b0f14',
            background: accentColor,
            padding: '10px 38px',
            borderRadius: 999,
            opacity: enter,
          }}
        >
          {courseName}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * Template "depoimento": cartela de abertura → clipe do aluno com moldura
 * e legenda → cartela final com CTA da escola.
 */
export const Depoimento: React.FC<VideoParams & RenderExtras> = (p) => {
  const { fps, durationInFrames } = useVideoConfig();
  const introFrames = Math.round(DEPO_INTRO_SEC * fps);
  const outroFrames = Math.round(DEPO_OUTRO_SEC * fps);
  const clipFrames = Math.max(1, durationInFrames - introFrames - outroFrames);

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {p.musicTrack !== 'nenhuma' ? (
        // volume baixo para não brigar com a fala do aluno
        <Audio src={staticFile(`music/${p.musicTrack}.wav`)} volume={0.12} />
      ) : null}

      <Sequence durationInFrames={introFrames}>
        <IntroCard studentName={p.studentName} courseName={p.courseName} accentColor={p.accentColor} />
      </Sequence>

      <Sequence from={introFrames} durationInFrames={clipFrames}>
        <AbsoluteFill style={{ padding: 26 }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 36,
              overflow: 'hidden',
              border: `10px solid ${p.accentColor}`,
              position: 'relative',
            }}
          >
            {p.clipPath ? (
              <OffthreadVideo
                src={p.clipPath}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <AbsoluteFill style={{ background: COLORS.bg }} />
            )}
          </div>
        </AbsoluteFill>
        <CaptionStrip captions={p.captions} quote={p.quote} accentColor={p.accentColor} />
      </Sequence>

      <Sequence from={introFrames + clipFrames} durationInFrames={outroFrames}>
        <EndCard cta={p.cta} whatsapp={p.whatsapp} accentColor={p.accentColor} />
      </Sequence>

      {p.watermark ? <Watermark /> : null}
    </AbsoluteFill>
  );
};
