import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';

/**
 * Foto com movimento lento (zoom + pan) durante `durationInFrames`,
 * com fade nas bordas do slice para encadear slides.
 */
export const KenBurns: React.FC<{
  src: string;
  durationInFrames: number;
  direction?: number; // alterna o sentido do pan por índice
}> = ({ src, durationInFrames, direction = 0 }) => {
  const frame = useCurrentFrame();
  const t = frame / Math.max(1, durationInFrames);

  const zoomIn = direction % 2 === 0;
  const scale = interpolate(t, [0, 1], zoomIn ? [1.05, 1.22] : [1.22, 1.05]);
  const panX = interpolate(t, [0, 1], direction % 4 < 2 ? [-3, 3] : [3, -3]);

  const fade = 8; // frames de crossfade
  const opacity = interpolate(
    frame,
    [0, fade, durationInFrames - fade, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translateX(${panX}%)`,
        }}
      />
    </AbsoluteFill>
  );
};
