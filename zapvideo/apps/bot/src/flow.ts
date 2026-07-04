import {
  config,
  createJob,
  defaultParams,
  logEvent,
  saveSession,
  type SessionRow,
} from '@zapvideo/core';
import { generateCopy, runAgentTurn, MAX_RENDERS_PER_SESSION } from '@zapvideo/agent';

/**
 * Lógica da conversa, separada do transporte (Baileys) para ser testável.
 *
 * Com ANTHROPIC_API_KEY o turno inteiro roda no harness do agent
 * (runAgentTurn). Sem chave, cai numa máquina de estados com roteiro fixo —
 * o usuário nunca fica sem resposta.
 */

export type Incoming =
  | { kind: 'text'; text: string }
  | { kind: 'image'; path: string }
  | { kind: 'video'; path: string };

export interface FlowResult {
  replies: string[];
}

const GREETING =
  'Oi! 👋 Eu sou o ZapVídeo. Me envia de 1 a 5 *fotos* do seu produto ou negócio que eu transformo num vídeo de venda pra você postar no Status. Prévia grátis!';

export async function handleIncoming(session: SessionRow, incoming: Incoming): Promise<FlowResult> {
  // mídia entra nos parâmetros antes de qualquer coisa (com ou sem LLM)
  if (incoming.kind === 'image') {
    const params = session.videoParams ?? defaultParams('promo');
    if (params.images.length >= 5) {
      saveSession(session);
      return { replies: ['Já tenho 5 fotos! Agora me diz em uma frase o que você vende (com preço, se quiser). 📝'] };
    }
    params.images = [...params.images, incoming.path];
    session.videoParams = params;
    saveSession(session);
    const n = params.images.length;
    return {
      replies: [
        n === 1
          ? 'Foto recebida! 📸 Pode mandar mais (até 5), ou me diz em uma frase o que você vende — ex.: "curso de manicure, R$ 297, com certificado".'
          : `Foto ${n} recebida! Manda mais ou me diz o que você vende pra eu montar o vídeo.`,
      ],
    };
  }

  if (incoming.kind === 'video') {
    const params = session.videoParams ?? defaultParams('depoimento');
    params.template = 'depoimento';
    params.clipPath = incoming.path;
    params.musicTrack = 'calma';
    session.videoParams = params;
    saveSession(session);
    return {
      replies: [
        'Vídeo recebido! 🎥 Esse é um depoimento de aluno/cliente? Me diz o *nome da pessoa* e o *curso ou serviço* que eu monto a versão profissional.',
      ],
    };
  }

  // texto: com LLM vai para o harness; sem LLM, roteiro fixo
  if (config.anthropicApiKey) {
    const result = await runAgentTurn(session, 'bot', incoming.text);
    if (result.mode === 'ok') {
      return { replies: result.replies.length > 0 ? result.replies : ['Certo! 👍'] };
    }
    // LLM caiu no meio do caminho — continua no roteiro fixo
  }
  return manualFlow(session, incoming.text);
}

/** Roteiro fixo (sem LLM): coleta → texto → render. */
export async function manualFlow(session: SessionRow, text: string): Promise<FlowResult> {
  const params = session.videoParams;

  if (!params || (params.template !== 'depoimento' && params.images.length === 0)) {
    return { replies: [GREETING] };
  }

  if (session.rendersUsed >= MAX_RENDERS_PER_SESSION) {
    return {
      replies: ['Você já usou os vídeos grátis desta conversa. 😊 Em breve teremos pacotes — responda AVISE que eu te chamo!'],
    };
  }

  const description = text.trim();
  if (description.length < 5) {
    return { replies: ['Me conta em uma frase o que você vende — ex.: "marmitas fit, R$ 18, entrega no centro". 📝'] };
  }

  if (params.template === 'depoimento') {
    params.studentName = params.studentName || description.slice(0, 40);
    params.title = params.studentName;
    params.cta = 'Venha ser o próximo!';
  } else {
    // tenta o LLM para o texto; se não der, usa a própria descrição
    const copy = await generateCopy(description, params.template, session.id);
    if (copy) {
      params.title = copy.title;
      params.bullets = copy.bullets;
      params.price = copy.price;
      params.cta = copy.cta;
    } else {
      params.title = description.slice(0, 60);
      params.bullets = [];
      const priceMatch = description.match(/R\$\s?\d+(?:[.,]\d+)?/i);
      if (priceMatch) params.price = priceMatch[0];
      params.cta = 'Chame no WhatsApp!';
    }
  }
  params.whatsapp = params.whatsapp || formatWaNumber(session.waNumber);

  const jobId = createJob(params, 'bot', session.id);
  session.rendersUsed += 1;
  session.videoParams = params;
  saveSession(session);
  logEvent('video_created', { template: params.template, via: 'bot_manual' }, { sessionId: session.id, jobId });

  return {
    replies: ['Perfeito! 🎬 Estou montando seu vídeo — te mando aqui mesmo em alguns minutos.'],
  };
}

export function formatWaNumber(waNumber?: string): string | undefined {
  if (!waNumber) return undefined;
  const digits = waNumber.replace(/\D/g, '');
  // 55 + DDD + número → (DD) XXXXX-XXXX
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length < 10) return undefined;
  const ddd = local.slice(0, 2);
  const rest = local.slice(2);
  return `(${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
}

/** Mensagem enviada junto com a prévia pronta. */
export function previewCaption(jobId: string): string {
  const url = `${config.publicBaseUrl}/video/${jobId}`;
  return (
    'Prontinho! 🎉 Essa é a prévia gratuita (com marca d’água).\n\n' +
    `Para baixar sem marca d'água e em alta resolução: ${url}\n\n` +
    'Quer mudar algo? É só me dizer — ex.: "muda a cor pra azul" ou "deixa mais curto".'
  );
}
