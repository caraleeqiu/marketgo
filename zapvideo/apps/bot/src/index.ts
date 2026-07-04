import makeWASocket, {
  DisconnectReason,
  downloadMediaMessage,
  useMultiFileAuthState,
  type WAMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import {
  config,
  getOrCreateSession,
  logEvent,
  newId,
  openDb,
  uploadsDir,
} from '@zapvideo/core';
import { handleIncoming, previewCaption, type Incoming } from './flow';

/**
 * Bot WhatsApp (canal NÃO-oficial via Baileys) — MODO PASSIVO APENAS.
 *
 * Regras de segurança de conta (ver pesquisa: bots passivos <2% de ban/ano,
 * bots que disparam para desconhecidos 15-30%):
 *  - só responde a mensagens recebidas; NUNCA inicia conversa
 *  - ignora grupos e broadcast
 *  - use um número de teste dedicado, nunca o número principal do negócio
 */

const AUTH_DIR = path.resolve(__dirname, '../auth');
const logger = pino({ level: 'warn' });

async function main() {
  if (!config.enableBot) {
    console.log('[bot] ENABLE_BOT=false — bot desativado. Saindo.');
    return;
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const sock = makeWASocket({ auth: state, logger });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('[bot] escaneie o QR code com o WhatsApp do número de teste:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const code = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log('[bot] conexão caiu, reconectando…');
        main();
      } else {
        console.log('[bot] sessão deslogada. Apague apps/bot/auth e escaneie de novo.');
      }
    }
    if (connection === 'open') console.log('[bot] conectado ✅');
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await onMessage(sock, msg);
      } catch (err) {
        console.error('[bot] erro ao processar mensagem:', err);
      }
    }
  });

  startDeliveryLoop(sock);
}

async function onMessage(sock: ReturnType<typeof makeWASocket>, msg: WAMessage) {
  const jid = msg.key.remoteJid;
  if (!jid || msg.key.fromMe) return;
  // passivo: só conversas diretas (ignora grupos/status/broadcast)
  if (!jid.endsWith('@s.whatsapp.net')) return;

  const m = msg.message;
  if (!m) return;

  const session = getOrCreateSession(`wa:${jid}`, 'bot', jid.split('@')[0]);
  let incoming: Incoming | null = null;

  if (m.imageMessage) {
    const buffer = (await downloadMediaMessage(msg, 'buffer', {})) as Buffer;
    const dest = path.join(uploadsDir(), `${newId('b')}.jpg`);
    fs.writeFileSync(dest, buffer);
    incoming = { kind: 'image', path: dest };
  } else if (m.videoMessage) {
    const buffer = (await downloadMediaMessage(msg, 'buffer', {})) as Buffer;
    const dest = path.join(uploadsDir(), `${newId('b')}.mp4`);
    fs.writeFileSync(dest, buffer);
    incoming = { kind: 'video', path: dest };
  } else {
    const text = m.conversation || m.extendedTextMessage?.text;
    if (text) incoming = { kind: 'text', text };
  }
  if (!incoming) return;

  logEvent('bot_message_in', { kind: incoming.kind }, { sessionId: session.id });
  const result = await handleIncoming(session, incoming);
  for (const reply of result.replies) {
    await sock.sendMessage(jid, { text: reply });
  }
}

/**
 * Entrega de vídeos prontos: o worker renderiza; aqui a cada 5s buscamos jobs
 * de bot concluídos e ainda não entregues (marcados via evento bot_delivered).
 */
function startDeliveryLoop(sock: ReturnType<typeof makeWASocket>) {
  setInterval(async () => {
    const rows = openDb()
      .prepare(
        `SELECT j.id, j.session_id, j.preview_path FROM jobs j
         WHERE j.source = 'bot' AND j.status = 'done'
           AND NOT EXISTS (
             SELECT 1 FROM events e WHERE e.name = 'bot_delivered' AND e.job_id = j.id
           )`
      )
      .all() as { id: string; session_id: string; preview_path: string }[];

    for (const row of rows) {
      const jid = row.session_id.replace(/^wa:/, '');
      if (!jid || !row.preview_path || !fs.existsSync(row.preview_path)) continue;
      try {
        await sock.sendMessage(jid, {
          video: fs.readFileSync(row.preview_path),
          caption: previewCaption(row.id),
        });
        logEvent('bot_delivered', undefined, { sessionId: row.session_id, jobId: row.id });
        console.log(`[bot] prévia ${row.id} entregue para ${jid}`);
      } catch (err) {
        console.error(`[bot] falha ao entregar ${row.id}:`, err);
      }
    }
  }, 5000);
}

main();
