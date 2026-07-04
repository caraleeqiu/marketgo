import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

/**
 * Raiz do monorepo = diretório mais próximo (subindo a partir do cwd) cujo
 * package.json declara "workspaces". Não dependemos de __dirname porque o
 * bundler do Next pode embutir este arquivo em .next/server, e nem da posição
 * do .env porque apps/web mantém um symlink de .env para o middleware.
 */
function findWorkspaceRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 10; i++) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.workspaces) return dir;
      } catch {
        // package.json ilegível — continua subindo
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return from;
}

const repoRoot = findWorkspaceRoot(process.cwd());

const envPath = path.join(repoRoot, '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

export const config = {
  repoRoot,
  dataDir: path.resolve(repoRoot, process.env.DATA_DIR || './data'),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  agentModel: process.env.AGENT_MODEL || 'claude-haiku-4-5',
  videoFxProvider: (process.env.VIDEO_FX_PROVIDER || 'none') as 'none' | 'seedance',
  seedanceApiKey: process.env.SEEDANCE_API_KEY || process.env.FAL_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPass: process.env.ADMIN_PASS || '',
  enableBot: process.env.ENABLE_BOT === 'true',
  remotionBrowserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
  renderConcurrency: Number(process.env.RENDER_CONCURRENCY || 1),
};

export function uploadsDir(): string {
  const dir = path.join(config.dataDir, 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function rendersDir(): string {
  const dir = path.join(config.dataDir, 'renders');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
