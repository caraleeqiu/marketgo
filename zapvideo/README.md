# ZapVídeo — MVP

**Vídeos de venda para WhatsApp em 2 minutos.** MVP para validar disposição de pagamento de pequenos negócios e escolas/cursos brasileiros: o usuário envia fotos (ou o vídeo cru de um depoimento de aluno), recebe uma prévia gratuita com marca d'água e encontra um botão "Baixar sem marca d'água — R$ 15" que mede a intenção de pagamento (fake door: coleta o WhatsApp para avisar quando o Pix estiver no ar).

## Arquitetura

```
zapvideo/
├── packages/core     # config, SQLite (jobs/sessions/events/leads), tipos VideoParams
├── packages/video    # templates Remotion (promo/oferta/depoimento) + worker de render
│   └── src/fx/       # VideoFxProvider: none (padrão) | seedance (troca via .env)
├── packages/agent    # harness de ferramentas (Claude API): write_copy, update_video_params,
│                     # start_render, check_render — web e bot usam o mesmo núcleo
├── apps/web          # Next.js PT-BR: landing → wizard → prévia → fake door → /admin
└── apps/bot          # Baileys (canal não-oficial), MODO PASSIVO, opcional
```

Três processos compartilham o mesmo SQLite (`DATA_DIR/zapvideo.db`):

1. **web** — cria jobs, serve prévias, registra eventos do funil
2. **worker** — consome a fila e renderiza 2 versões por job (prévia 720p com marca d'água + final 1080p limpa, que fica guardada para quando houver pagamento real)
3. **bot** (opcional) — conversa no WhatsApp, cria jobs e entrega prévias

## Rodando local

```bash
cd zapvideo
cp .env.example .env       # edite ADMIN_PASS; chaves de IA são opcionais
npm install
npm run build
npm run dev                # web em http://localhost:3000 + worker de render
```

> As trilhas de fundo já estão no repositório (geradas proceduralmente — zero
> problema de licença). Para regenerar ou trocar: `npm run gen:music -w packages/video`,
> ou substitua os arquivos em `packages/video/remotion/public/music/` pelos seus.
>
> O `.env` da raiz é a única fonte de configuração — o build do web cria um
> symlink `apps/web/.env` automaticamente (necessário para o middleware do
> Next enxergar `ADMIN_PASS`). **Rode `npm run build` depois de mudar o .env.**

Sem nenhuma chave configurada o produto funciona em **modo manual**: o usuário digita o texto do vídeo. Com `ANTHROPIC_API_KEY` o texto é escrito pela IA e o "mude com uma frase" fica ativo.

### Demonstração (renderiza os 3 templates com assets de exemplo)

```bash
npm run seed:render -w packages/video
# vídeos em data/renders/<jobId>/preview.mp4
```

### Testes

```bash
npm test    # harness do agent + fluxo do bot
```

## Variáveis de ambiente (.env)

| Variável | Obrigatória | Para quê |
|---|---|---|
| `ADMIN_PASS` | ✅ | senha do painel `/admin` (HTTP Basic, usuário `admin`) |
| `PUBLIC_BASE_URL` | em produção | links de compartilhamento e do bot |
| `ANTHROPIC_API_KEY` | — | copywriting + "mude com uma frase" (sem ela: modo manual) |
| `AGENT_MODEL` | — | padrão `claude-haiku-4-5` |
| `VIDEO_FX_PROVIDER` | — | `none` (padrão) ou `seedance` (abertura animada por IA) |
| `SEEDANCE_API_KEY`/`FAL_KEY` | — | chave para o provider seedance |
| `OPENAI_API_KEY` | — | legendas automáticas (Whisper) no template depoimento |
| `ENABLE_BOT` | — | `true` liga o bot do WhatsApp |
| `REMOTION_BROWSER_EXECUTABLE` | — | caminho de um Chromium local (senão o Remotion baixa um) |

## Deploy num VPS (Docker)

```bash
cp .env.example .env && nano .env    # ADMIN_PASS, PUBLIC_BASE_URL, chaves
docker compose up -d --build         # web + worker
docker compose --profile bot up -d   # + bot (escaneie o QR: docker compose logs -f bot)
```

Requisitos: 2 vCPU / 4GB RAM dão conta do MVP (render 720p+1080p leva ~1-3 min por vídeo).

## Bot do WhatsApp — leia antes de ligar

O bot usa canal **não-oficial** (Baileys). Regras para não perder o número:

- **Use um número de teste dedicado**, nunca o número principal do negócio
- O bot é 100% passivo: só responde a quem manda mensagem primeiro (pesquisa: bots passivos <2% de banimento/ano; disparos ativos para desconhecidos, 15–30%)
- Não adicione funcionalidades de disparo em massa
- Para escalar de verdade, migre para a WhatsApp Cloud API oficial (exige CNPJ + verificação Meta)

## Funil medido (em /admin)

`video_created` → `preview_watched` → `paywall_click` → `phone_submitted` — o sinal de validação do negócio é a conversão *prévia assistida → clique no paywall → número deixado*. Também são registrados `whatsapp_share`, `video_edited` e as chamadas de LLM (latência/tokens).

## Limites conhecidos do MVP

- Fake door: ninguém paga de verdade ainda (Pix real = próxima fase, via Mercado Pago/Asaas)
- Depoimento: **só edita vídeos reais enviados pelo usuário** — o agent recusa pedidos de depoimentos inventados (CDC/publicidade enganosa)
- Uploads e renders ficam no disco local (`DATA_DIR`); troque por S3 quando houver volume
- Seedance 2.5: o provider `seedance` está plugado via fal.ai como placeholder — ajuste o endpoint em `packages/video/src/fx/seedance.ts` quando migrarem para o endpoint definitivo
