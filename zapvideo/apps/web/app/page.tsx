import Link from 'next/link';

export default function Landing() {
  return (
    <main>
      <p style={{ fontSize: '2rem' }}>⚡</p>
      <h1>
        Transforme fotos em <span style={{ color: 'var(--accent)' }}>vídeos de venda</span> em 2
        minutos
      </h1>
      <p className="dim" style={{ marginTop: 12 }}>
        Vídeos profissionais para o Status e WhatsApp do seu negócio. Sem editor, sem designer, sem
        complicação — direto do celular.
      </p>

      <div className="card">
        <h2>📸 Vídeo de divulgação</h2>
        <p className="dim" style={{ margin: '8px 0 14px' }}>
          Envie fotos do seu produto, curso ou serviço e receba um vídeo pronto para postar.
        </p>
        <Link className="btn" href="/criar?tipo=divulgacao">
          Criar vídeo de divulgação
        </Link>
      </div>

      <div className="card">
        <h2>🎓 Depoimento de aluno</h2>
        <p className="dim" style={{ margin: '8px 0 14px' }}>
          Envie o vídeo cru do seu aluno ou cliente e receba uma versão profissional com legenda e
          sua marca.
        </p>
        <Link className="btn secondary" href="/criar?tipo=depoimento">
          Melhorar um depoimento
        </Link>
      </div>

      <p className="dim" style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: 24 }}>
        Prévia grátis • Feito para pequenos negócios brasileiros 🇧🇷
      </p>
    </main>
  );
}
