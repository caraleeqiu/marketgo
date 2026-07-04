'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function PagamentoPage() {
  const { id } = useParams<{ id: string }>();
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, jobId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Número inválido');
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main>
        <h1>Você está na lista! ✅</h1>
        <p className="dim" style={{ marginTop: 12 }}>
          Assim que o pagamento por Pix estiver no ar, você recebe uma mensagem no WhatsApp com{' '}
          <b style={{ color: 'var(--accent)' }}>50% de desconto</b> no seu primeiro vídeo.
        </p>
        <a className="btn secondary" style={{ marginTop: 24 }} href={`/video/${id}`}>
          Voltar para o vídeo
        </a>
      </main>
    );
  }

  return (
    <main>
      <h1>Pagamento via Pix chegando! 💚</h1>
      <p className="dim" style={{ marginTop: 12 }}>
        Estamos finalizando o pagamento por Pix. Deixe seu WhatsApp e a gente te avisa na hora — com{' '}
        <b style={{ color: 'var(--accent)' }}>50% de desconto</b> no seu primeiro vídeo sem marca
        d&apos;água.
      </p>
      <div className="card">
        <label>
          Seu WhatsApp
          <input
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" style={{ marginTop: 14 }} disabled={busy} onClick={submit}>
          {busy ? 'Enviando…' : 'Quero o desconto'}
        </button>
      </div>
      <p className="dim" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
        Sem spam — só o aviso do lançamento.
      </p>
    </main>
  );
}
