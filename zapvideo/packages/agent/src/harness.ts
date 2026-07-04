import Anthropic from '@anthropic-ai/sdk';
import { config, logEvent, saveSession, type SessionRow, type VideoParams } from '@zapvideo/core';
import {
  applyCopy,
  applyParamsUpdate,
  executeTool,
  toolDefinitions,
  updateParamsSchema,
  writeCopySchema,
  type UpdateParamsInput,
  type WriteCopyInput,
} from './tools';

const MAX_TURNS = 8; // teto duro de iterações do loop por chamada
const MAX_TOKENS = 1024;

// Persona versionada em código — mudanças aqui são mudanças de produto.
const SYSTEM_PROMPT = `Você é o ZapVídeo, assistente que cria vídeos de venda para pequenos negócios brasileiros (lojas, cursos, salões).

Regras:
- Responda SEMPRE em português brasileiro, tom simpático e direto, mensagens curtas (é WhatsApp).
- Fluxo: colete 1-5 fotos do produto/negócio → peça uma descrição de uma frase (o que é, preço, diferencial) → use write_copy → use start_render → avise que a prévia chega em minutos.
- Quando o usuário pedir mudanças ("mais curto", "muda a cor"), use update_video_params e depois start_render de novo.
- Nunca invente depoimentos de alunos ou clientes. Se pedirem, explique que só editamos depoimentos reais.
- Não prometa nada fora do escopo (pagamentos, agendamentos, etc).`;

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!config.anthropicApiKey) return null;
  if (!client) {
    client = new Anthropic({
      apiKey: config.anthropicApiKey,
      timeout: 30_000, // ms
      maxRetries: 2,
    });
  }
  return client;
}

export interface AgentResult {
  /** 'ok' = LLM respondeu; 'manual' = sem chave, chamador usa o fluxo manual */
  mode: 'ok' | 'manual';
  /** mensagens de texto para mostrar/enviar ao usuário */
  replies: string[];
  /** parâmetros de vídeo após a rodada */
  videoParams?: VideoParams;
}

interface LlmCallMeta {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

async function callModel(
  messages: Anthropic.MessageParam[],
  opts: { toolChoice?: Anthropic.MessageCreateParams['tool_choice']; sessionId?: string }
): Promise<{ response: Anthropic.Message; meta: LlmCallMeta } | null> {
  const c = getClient();
  if (!c) return null;
  const started = Date.now();
  try {
    const response = await c.messages.create({
      model: config.agentModel,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions as Anthropic.Tool[],
      tool_choice: opts.toolChoice,
      messages,
    });
    const meta = {
      latencyMs: Date.now() - started,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
    logEvent('llm_call', { model: config.agentModel, ...meta, stopReason: response.stop_reason }, { sessionId: opts.sessionId });
    return { response, meta };
  } catch (err) {
    // Erros retryable já foram tentados pelo SDK (maxRetries=2).
    // Qualquer falha degrada para modo manual — nunca derruba o fluxo do usuário.
    if (err instanceof Anthropic.RateLimitError) {
      console.warn('[agent] rate limit — degradando para modo manual');
    } else if (err instanceof Anthropic.APIConnectionError) {
      console.warn('[agent] falha de conexão com a API:', err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.warn(`[agent] erro da API (${err.status}):`, err.message);
    } else {
      console.warn('[agent] erro inesperado:', err);
    }
    logEvent('llm_error', { error: String(err).slice(0, 300) }, { sessionId: opts.sessionId });
    return null;
  }
}

function extractToolInput<T>(response: Anthropic.Message, toolName: string): T | null {
  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === toolName) {
      return block.input as T;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Entradas rasas (web): uma chamada com tool_choice forçado, sem loop.
// ---------------------------------------------------------------------------

/** Gera o texto de marketing a partir de uma descrição de uma frase. */
export async function generateCopy(
  description: string,
  template: string,
  sessionId?: string
): Promise<WriteCopyInput | null> {
  const result = await callModel(
    [
      {
        role: 'user',
        content: `Escreva o texto de um vídeo "${template}" para este negócio: ${description}`,
      },
    ],
    { toolChoice: { type: 'tool', name: 'write_copy' }, sessionId }
  );
  if (!result) return null;
  const input = extractToolInput<unknown>(result.response, 'write_copy');
  if (!input) return null;
  const parsed = writeCopySchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

/** Converte "muda a cor pra azul e deixa mais curto" em um diff de parâmetros. */
export async function parseEditInstruction(
  params: VideoParams,
  instruction: string,
  sessionId?: string
): Promise<VideoParams | null> {
  const result = await callModel(
    [
      {
        role: 'user',
        content: `Vídeo atual: ${JSON.stringify({
          title: params.title,
          bullets: params.bullets,
          price: params.price,
          cta: params.cta,
          accentColor: params.accentColor,
          musicTrack: params.musicTrack,
          durationSec: params.durationSec,
          template: params.template,
        })}\n\nPedido do usuário: "${instruction}"`,
      },
    ],
    { toolChoice: { type: 'tool', name: 'update_video_params' }, sessionId }
  );
  if (!result) return null;
  const input = extractToolInput<unknown>(result.response, 'update_video_params');
  if (!input) return null;
  const parsed = updateParamsSchema.safeParse(input);
  if (!parsed.success) return null;
  return applyParamsUpdate(params, parsed.data);
}

// re-export para chamadores que aplicam copy manualmente (modo degradado)
export { applyCopy, applyParamsUpdate };
export type { WriteCopyInput, UpdateParamsInput };

// ---------------------------------------------------------------------------
// Entrada profunda (bot): loop completo de conversa com ferramentas.
// ---------------------------------------------------------------------------

/**
 * Processa uma mensagem do usuário dentro de uma sessão persistente.
 * O histórico vive em sessions.history_json; o loop tem teto de MAX_TURNS
 * iterações e as renderizações são limitadas por sessão (ver tools.ts).
 */
export async function runAgentTurn(
  session: SessionRow,
  channel: 'web' | 'bot',
  userMessage: string
): Promise<AgentResult> {
  if (!getClient()) {
    return { mode: 'manual', replies: [], videoParams: session.videoParams };
  }

  const history = session.history as Anthropic.MessageParam[];
  history.push({ role: 'user', content: userMessage });

  const replies: string[] = [];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const result = await callModel(history, { sessionId: session.id });
    if (!result) {
      // falha de LLM no meio do loop: salva o que temos e degrada
      saveSession(session);
      return { mode: 'manual', replies, videoParams: session.videoParams };
    }
    const { response } = result;
    history.push({ role: 'assistant', content: response.content });

    for (const block of response.content) {
      if (block.type === 'text' && block.text.trim()) replies.push(block.text.trim());
    }

    if (response.stop_reason !== 'tool_use') break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      let output: string;
      try {
        output = executeTool(block.name, block.input, { session, channel });
      } catch (err) {
        output = `Erro ao executar ${block.name}: ${(err as Error).message}`;
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: output });
    }
    history.push({ role: 'user', content: toolResults });
  }

  // trims histórico para não crescer sem limite (mantém últimos 40 itens)
  session.history = history.slice(-40);
  saveSession(session);
  return { mode: 'ok', replies, videoParams: session.videoParams };
}
