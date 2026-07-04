import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZapVídeo — vídeos de venda para WhatsApp em 2 minutos',
  description:
    'Transforme fotos do seu produto ou curso em vídeos profissionais para Status e WhatsApp. Sem editor, sem designer.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0f14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
