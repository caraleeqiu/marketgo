'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type JobInfo = { id: string; status: string; title: string; error?: string };

const PRICE = 'R$ 15';

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobInfo | null>(null);
  const [instruction, setInstruction] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const watchedLogged = useRef(false);

  const track = useCallback((name: string, props?: Record<string, unknown>) => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, jobId: id, props }),
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch(`/api/videos/${id}`);
        if (!alive) return;
        if (res.ok) {
          const data = (await res.json()) as JobInfo;
          setJob(data);
          if (data.status === 'done' || data.status === 'error') return;
        }
      } catch {}
      if (alive) setTimeout(poll, 3000);
    }
    poll();
    return () => {
      alive = false;
    };
  }, [id]);

  async function handleEdit() {
    if (instruction.trim().length < 3) return;
    setEditBusy(true);
    setEditMsg('');
    try {
      const res = await fetch(`/api/videos/${id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction }),
      });
      const data = await res.json();
      if (data.jobId) {
        router.push(`/video/${data.jobId}`);
        return;
      }
      setEditMsg(data.error || 'Ajuste automático indisponível — crie um novo vídeo com as mudanças.');
    } catch {
      setEditMsg('Não deu certo, tente de novo.');
    } finally {
      setEditBusy(false);
    }
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const waShare = `https://wa.me/?text=${encodeURIComponent(`Olha o vídeo que eu fiz no ZapVídeo: ${shareUrl}`)}`;

  if (!job) {
    return (
      <main>
        <div className="spinner" />
      </main>
    );
  }

  if (job.status === 'error') {
    return (
      <main>
        <h1>Ops 😅</h1>
        <p className="dim" style={{ marginTop: 12 }}>{job.error}</p>
        <a className="btn" style={{ marginTop: 24 }} href="/criar">
          Tentar de novo
        </a>
      </main>
    );
  }

  if (job.status !== 'done') {
    return (
      <main>
        <h1>Gerando seu vídeo…</h1>
        <p className="dim" style={{ marginTop: 8 }}>
          Fica pronto em poucos minutos. Pode deixar esta página aberta. ⏳
        </p>
        <div className="spinner" />
      </main>
    );
  }

  return (
    <main>
      <h1>Seu vídeo está pronto! 🎉</h1>
      <video
        className="preview"
        style={{ marginTop: 16 }}
        src={`/api/videos/${id}/file`}
        controls
        playsInline
        onPlay={() => {
          if (!watchedLogged.current) {
            watchedLogged.current = true;
            track('preview_watched');
          }
        }}
      />

      <button
        className="btn"
        style={{ marginTop: 16 }}
        onClick={() => {
          track('paywall_click', { price: PRICE });
          router.push(`/pagamento/${id}`);
        }}
      >
        Baixar sem marca d&apos;água — {PRICE}
      </button>

      <a
        className="btn secondary"
        style={{ marginTop: 10 }}
        href={waShare}
        target="_blank"
        rel="noreferrer"
        onClick={() => track('whatsapp_share')}
      >
        Compartilhar no WhatsApp
      </a>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>Quer mudar algo?</h2>
        <p className="dim" style={{ margin: '6px 0' }}>
          Diga em uma frase — ex.: &quot;deixa mais curto&quot;, &quot;muda a cor pra azul&quot;.
        </p>
        <input value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="O que você quer mudar?" />
        {editMsg && <p className="error">{editMsg}</p>}
        <button className="btn secondary" style={{ marginTop: 10 }} disabled={editBusy} onClick={handleEdit}>
          {editBusy ? 'Aplicando…' : 'Aplicar mudança'}
        </button>
      </div>
    </main>
  );
}
