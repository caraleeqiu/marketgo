// Importado ANTES de @zapvideo/core: isola o SQLite dos testes num tmpdir.
// (imports ES são içados — setar env no corpo do arquivo de teste é tarde demais)
import os from 'os';
import path from 'path';

process.env.DATA_DIR = path.join(os.tmpdir(), `zapvideo-agent-test-${process.pid}`);
delete process.env.ANTHROPIC_API_KEY;
