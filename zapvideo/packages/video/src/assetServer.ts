import http from 'http';
import fs from 'fs';
import path from 'path';
import { config } from '@zapvideo/core';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

/**
 * Servidor estático mínimo sobre o DATA_DIR, usado só pelo Chromium do
 * Remotion durante o render (uploads não estão no public/ do bundle).
 * Suporta Range (necessário para <OffthreadVideo>/vídeo no Chrome).
 */
export function startAssetServer(): Promise<{ baseUrl: string; close: () => void }> {
  const root = config.dataDir;
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const filePath = path.normalize(path.join(root, urlPath));
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const stat = fs.statSync(filePath);
    const mime = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m && m[1] ? parseInt(m[1], 10) : 0;
      const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': mime,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(filePath).pipe(res);
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ baseUrl: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}

/** Converte um caminho absoluto dentro do DATA_DIR em URL do asset server. */
export function toAssetUrl(baseUrl: string, absPath: string): string {
  const rel = path.relative(config.dataDir, absPath);
  if (rel.startsWith('..')) {
    throw new Error(`Asset fora do DATA_DIR: ${absPath}`);
  }
  return `${baseUrl}/${rel.split(path.sep).map(encodeURIComponent).join('/')}`;
}
