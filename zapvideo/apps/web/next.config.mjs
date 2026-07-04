import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// carrega o .env da raiz do monorepo no processo do servidor
// (o Next só carrega .env do diretório do app; o middleware lê process.env)
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(monorepoRoot, '.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // módulos nativos/servidor não devem ser empacotados pelo webpack
    serverComponentsExternalPackages: ['better-sqlite3', '@zapvideo/core', '@zapvideo/agent'],
  },
};

export default nextConfig;
