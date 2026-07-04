'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Uploaded = { id: string; path: string; type: string };

const SWATCHES = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

function Wizard() {
  const router = useRouter();
  const isDepoimento = useSearchParams().get('tipo') === 'depoimento';

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [files, setFiles] = useState<Uploaded[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [description, setDescription] = useState('');
  const [copyReady, setCopyReady] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const [title, setTitle] = useState('');
  const [bullets, setBullets] = useState('');
  const [price, setPrice] = useState('');
  const [cta, setCta] = useState(isDepoimento ? 'Venha ser o próximo!' : 'Chame no WhatsApp!');
  const [whatsapp, setWhatsapp] = useState('');
  const [studentName, setStudentName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [quote, setQuote] = useState('');
  const [template, setTemplate] = useState(isDepoimento ? 'depoimento' : 'promo');
  const [accentColor, setAccentColor] = useState('#22c55e');
  const [musicTrack, setMusicTrack] = useState(isDepoimento ? 'calma' : 'energia');

  async function handleUpload(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      Array.from(list)
        .slice(0, 5)
        .forEach((f) => form.append('files', f));
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no upload');
      setFiles(data.files);
      setPreviews(Array.from(list).slice(0, 5).map((f) => URL.createObjectURL(f)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateCopy() {
    if (isDepoimento) {
      setStep(3);
      return;
    }
    if (description.trim().length < 5) {
      setError('Conte um pouco sobre o que você vende.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, template }),
      });
      const data = await res.json();
      if (data.copy) {
        setTitle(data.copy.title);
        setBullets((data.copy.bullets || []).join('\n'));
        if (data.copy.price) setPrice(data.copy.price);
        setCta(data.copy.cta);
        setCopyReady(true);
      } else {
        setManualMode(true);
      }
      setStep(3);
    } catch {
      setManualMode(true);
      setStep(3);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    setBusy(true);
    setError('');
    try {
      const body = isDepoimento
        ? {
            template: 'depoimento',
            clipPath: files[0]?.path,
            title: studentName || 'Nosso aluno',
            studentName,
            courseName,
            quote,
            cta,
            whatsapp,
            accentColor,
            musicTrack,
          }
        : {
            template,
            images: files.map((f) => f.path),
            title,
            bullets: bullets.split('\n').map((b) => b.trim()).filter(Boolean),
            price,
            cta,
            whatsapp,
            accentColor,
            musicTrack,
            durationSec: 18,
          };
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar o vídeo');
      router.push(`/video/${data.jobId}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>{isDepoimento ? 'Depoimento de aluno' : 'Vídeo de divulgação'}</h1>
      <div className="steps">
        <span className={step >= 1 ? 'on' : ''} />
        <span className={step >= 2 ? 'on' : ''} />
        <span className={step >= 3 ? 'on' : ''} />
      </div>

      {step === 1 && (
        <div className="card">
          <h2>{isDepoimento ? '1. Envie o vídeo do aluno' : '1. Envie as fotos (1 a 5)'}</h2>
          <p className="dim" style={{ margin: '8px 0' }}>
            {isDepoimento
              ? 'Pode ser gravado no celular, na vertical. A gente deixa profissional.'
              : 'Fotos do produto, da loja ou do curso — direto da galeria.'}
          </p>
          <input
            type="file"
            accept={isDepoimento ? 'video/mp4,video/quicktime' : 'image/*'}
            multiple={!isDepoimento}
            onChange={(e) => handleUpload(e.target.files)}
          />
          {previews.length > 0 && !isDepoimento && (
            <div className="thumbs">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`foto ${i + 1}`} />
              ))}
            </div>
          )}
          {previews.length > 0 && isDepoimento && <p style={{ marginTop: 10 }}>🎥 Vídeo recebido!</p>}
          {error && <p className="error">{error}</p>}
          <button className="btn" style={{ marginTop: 16 }} disabled={files.length === 0 || busy} onClick={() => setStep(2)}>
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          {isDepoimento ? (
            <>
              <h2>2. Sobre o aluno</h2>
              <label>
                Nome do aluno
                <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Maria Silva" />
              </label>
              <label>
                Curso / serviço
                <input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Curso de Manicure" />
              </label>
              <label>
                Frase de destaque (aparece como legenda)
                <input value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Consegui meu primeiro emprego na área!" />
              </label>
            </>
          ) : (
            <>
              <h2>2. Descreva seu negócio</h2>
              <p className="dim" style={{ margin: '8px 0' }}>
                Uma frase basta — a gente escreve o texto do vídeo pra você. ✨
              </p>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Curso de barbeiro profissional, R$ 397, com certificado e kit de ferramentas"
              />
            </>
          )}
          {error && <p className="error">{error}</p>}
          <button className="btn" style={{ marginTop: 16 }} disabled={busy} onClick={handleGenerateCopy}>
            {busy ? 'Escrevendo…' : 'Continuar'}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2>3. Revise e gere</h2>
          {manualMode && <p className="dim" style={{ margin: '8px 0' }}>Preencha o texto do seu vídeo:</p>}
          {copyReady && <p className="dim" style={{ margin: '8px 0' }}>Texto pronto! Ajuste se quiser:</p>}

          {!isDepoimento && (
            <>
              <label>
                Título
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Curso de Barbeiro Profissional" />
              </label>
              <label>
                Argumentos de venda (um por linha, até 3)
                <textarea rows={3} value={bullets} onChange={(e) => setBullets(e.target.value)} placeholder={'Certificado incluso\nAulas práticas'} />
              </label>
              <label>
                Preço (opcional)
                <input value={price} onChange={(e) => setPrice(e.target.value)} maxLength={20} placeholder="R$ 397" />
              </label>
              <label>
                Estilo
                <select value={template} onChange={(e) => setTemplate(e.target.value)}>
                  <option value="promo">Divulgação (clássico)</option>
                  <option value="oferta">Oferta relâmpago (urgência)</option>
                </select>
              </label>
            </>
          )}

          <label>
            Chamada final
            <input value={cta} onChange={(e) => setCta(e.target.value)} maxLength={50} />
          </label>
          <label>
            Seu WhatsApp (aparece no vídeo)
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
          </label>
          <label>
            Cor de destaque
            <div className="swatches">
              {SWATCHES.map((c) => (
                <button key={c} className={accentColor === c ? 'on' : ''} style={{ background: c }} onClick={() => setAccentColor(c)} aria-label={c} />
              ))}
            </div>
          </label>
          <label>
            Música
            <select value={musicTrack} onChange={(e) => setMusicTrack(e.target.value)}>
              <option value="energia">Animada</option>
              <option value="calma">Suave</option>
              <option value="nenhuma">Sem música</option>
            </select>
          </label>

          {error && <p className="error">{error}</p>}
          <button className="btn" style={{ marginTop: 16 }} disabled={busy} onClick={handleCreate}>
            {busy ? 'Enviando…' : '🎬 Gerar meu vídeo grátis'}
          </button>
        </div>
      )}
    </main>
  );
}

export default function CriarPage() {
  return (
    <Suspense>
      <Wizard />
    </Suspense>
  );
}
