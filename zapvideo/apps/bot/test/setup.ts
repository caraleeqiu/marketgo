// Importado ANTES de @zapvideo/core: isola o SQLite dos testes num tmpdir.
import os from 'os';
import path from 'path';

process.env.DATA_DIR = path.join(os.tmpdir(), `zapvideo-bot-test-${process.pid}`);
delete process.env.ANTHROPIC_API_KEY;
