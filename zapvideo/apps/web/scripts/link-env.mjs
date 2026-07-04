// Garante apps/web/.env → ../../.env (o Next só carrega .env do diretório do
// app, e o middleware só enxerga variáveis coletadas pelo loader do Next no
// momento do BUILD — por isso o link precisa existir antes de `next build`).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootEnv = path.resolve(appDir, '../../.env');
const localEnv = path.join(appDir, '.env');

if (fs.existsSync(rootEnv) && !fs.existsSync(localEnv)) {
  fs.symlinkSync(path.relative(appDir, rootEnv), localEnv);
  console.log('[link-env] apps/web/.env → ../../.env');
}
