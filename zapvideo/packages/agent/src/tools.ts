import { z } from 'zod';
import {
  createJob,
  getJob,
  logEvent,
  type SessionRow,
  type VideoParams,
} from '@zapvideo/core';

/**
 * Ferramentas do harness. Cada uma tem: schema zod (validação), JSON Schema
 * (enviado à API) e implementação. As mesmas ferramentas servem o fluxo raso
 * do web (chamada única com tool_choice forçado) e o loop completo do bot.
 */

export const MAX_RENDERS_PER_SESSION = 3;

// ---------- write_copy ----------

export const writeCopySchema = z.object({
  title: z.string().min(3).max(60).describe('Título curto e vendedor'),
  bullets: z.array(z.string().min(2).max(50)).min(1).max(3),
  price: z.string().max(20).optional(),
  cta: z.string().min(3).max(50),
});
export type WriteCopyInput = z.infer<typeof writeCopySchema>;

// ---------- update_video_params ----------

export const updateParamsSchema = z.object({
  title: z.string().max(60).optional(),
  bullets: z.array(z.string().max(50)).max(3).optional(),
  price: z.string().max(20).optional(),
  cta: z.string().max(50).optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .describe('Cor de destaque em hex'),
  musicTrack: z.enum(['energia', 'calma', 'nenhuma']).optional(),
  durationSec: z.number().min(10).max(30).optional(),
  template: z.enum(['promo', 'oferta']).optional().describe('Trocar o estilo do vídeo (não vale para depoimento)'),
});
export type UpdateParamsInput = z.infer<typeof updateParamsSchema>;

// ---------- JSON Schemas para a API ----------

export const toolDefinitions = [
  {
    name: 'write_copy',
    description:
      'Escreve o texto de marketing do vídeo (título, argumentos de venda, CTA) a partir da descrição do negócio dada pelo usuário. Sempre em português brasileiro, tom vendedor mas natural.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Título curto e chamativo (máx 60 caracteres, sem aspas)' },
        bullets: {
          type: 'array',
          items: { type: 'string' },
          description: '1 a 3 argumentos de venda curtos (máx 50 caracteres cada)',
        },
        price: { type: 'string', description: 'Preço formatado, ex "R$ 297" ou "R$ 99/mês" (omitir se não informado)' },
        cta: { type: 'string', description: 'Chamada para ação curta, ex "Garanta sua vaga!"' },
      },
      required: ['title', 'bullets', 'cta'],
    },
  },
  {
    name: 'update_video_params',
    description:
      'Aplica uma mudança pedida pelo usuário ao vídeo atual (ex: "mais curto", "muda a cor pra azul", "tira a música"). Só inclua os campos que devem mudar.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        bullets: { type: 'array', items: { type: 'string' } },
        price: { type: 'string' },
        cta: { type: 'string' },
        accentColor: { type: 'string', description: 'Cor hex, ex "#3b82f6". Azul=#3b82f6, verde=#22c55e, vermelho=#ef4444, laranja=#f59e0b, rosa=#ec4899, roxo=#8b5cf6' },
        musicTrack: { type: 'string', enum: ['energia', 'calma', 'nenhuma'] },
        durationSec: { type: 'number', description: 'Duração em segundos (10-30). "mais curto"≈12, "mais longo"≈25' },
        template: { type: 'string', enum: ['promo', 'oferta'], description: 'Estilo do vídeo' },
      },
      required: [],
    },
  },
  {
    name: 'start_render',
    description:
      'Coloca o vídeo com os parâmetros atuais na fila de renderização. Use quando o usuário já forneceu fotos e o texto está pronto.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'check_render',
    description: 'Consulta o status do último vídeo renderizado desta conversa.',
    input_schema: {
      type: 'object' as const,
      properties: { jobId: { type: 'string' } },
      required: ['jobId'],
    },
  },
];

// ---------- implementações ----------

export interface ToolContext {
  session: SessionRow;
  channel: 'web' | 'bot';
}

export function applyParamsUpdate(params: VideoParams, update: UpdateParamsInput): VideoParams {
  const next = { ...params };
  if (update.title !== undefined) next.title = update.title;
  if (update.bullets !== undefined) next.bullets = update.bullets;
  if (update.price !== undefined) next.price = update.price;
  if (update.cta !== undefined) next.cta = update.cta;
  if (update.accentColor !== undefined) next.accentColor = update.accentColor;
  if (update.musicTrack !== undefined) next.musicTrack = update.musicTrack;
  if (update.durationSec !== undefined) next.durationSec = update.durationSec;
  if (update.template !== undefined && next.template !== 'depoimento') next.template = update.template;
  return next;
}

export function applyCopy(params: VideoParams, copy: WriteCopyInput): VideoParams {
  return { ...params, title: copy.title, bullets: copy.bullets, price: copy.price, cta: copy.cta };
}

/** Executa uma ferramenta chamada pelo modelo; retorna o texto do tool_result. */
export function executeTool(name: string, input: unknown, ctx: ToolContext): string {
  switch (name) {
    case 'write_copy': {
      const copy = writeCopySchema.parse(input);
      ctx.session.videoParams = applyCopy(
        ctx.session.videoParams ?? ({} as VideoParams),
        copy
      );
      return 'Texto aplicado ao vídeo.';
    }
    case 'update_video_params': {
      const update = updateParamsSchema.parse(input);
      if (!ctx.session.videoParams) return 'Erro: ainda não existe um vídeo nesta conversa.';
      ctx.session.videoParams = applyParamsUpdate(ctx.session.videoParams, update);
      return 'Parâmetros atualizados.';
    }
    case 'start_render': {
      const params = ctx.session.videoParams;
      if (!params) return 'Erro: parâmetros do vídeo ainda não definidos.';
      if (params.template !== 'depoimento' && params.images.length === 0) {
        return 'Erro: nenhuma foto recebida ainda. Peça ao usuário para enviar 1 a 5 fotos.';
      }
      if (ctx.session.rendersUsed >= MAX_RENDERS_PER_SESSION) {
        return `Erro: limite de ${MAX_RENDERS_PER_SESSION} renderizações desta conversa atingido.`;
      }
      const jobId = createJob(params, ctx.channel, ctx.session.id);
      ctx.session.rendersUsed += 1;
      logEvent('video_created', { template: params.template, via: 'agent' }, { sessionId: ctx.session.id, jobId });
      return `Vídeo na fila. jobId=${jobId}. Avise o usuário que fica pronto em poucos minutos.`;
    }
    case 'check_render': {
      const { jobId } = z.object({ jobId: z.string() }).parse(input);
      const job = getJob(jobId);
      if (!job) return 'Job não encontrado.';
      return `Status: ${job.status}${job.error ? ` (erro: ${job.error.slice(0, 200)})` : ''}`;
    }
    default:
      return `Ferramenta desconhecida: ${name}`;
  }
}
