import { adminMetrics } from '@zapvideo/core';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const m = adminMetrics();
  const funnel = [
    ['Vídeos criados', m.videosCreated],
    ['Vídeos prontos', m.videosDone],
    ['Cliques no paywall', m.paywallClicks],
    ['WhatsApp deixados', m.phonesSubmitted],
    ['Compartilhamentos', m.whatsappShares],
  ] as const;
  const conv = m.videosDone > 0 ? ((m.paywallClicks / m.videosDone) * 100).toFixed(1) : '—';
  const leadConv = m.paywallClicks > 0 ? ((m.phonesSubmitted / m.paywallClicks) * 100).toFixed(1) : '—';

  return (
    <main style={{ maxWidth: 720 }}>
      <h1>ZapVídeo · Métricas</h1>
      <div className="card">
        {funnel.map(([label, value]) => (
          <div className="metric" key={label}>
            <span className="dim">{label}</span>
            <b>{value}</b>
          </div>
        ))}
        <div className="metric">
          <span className="dim">Prévia → paywall</span>
          <b>{conv}%</b>
        </div>
        <div className="metric">
          <span className="dim">Paywall → número deixado (sinal de pagamento)</span>
          <b>{leadConv}%</b>
        </div>
      </div>

      <div className="card">
        <h2>Últimos vídeos</h2>
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>template</th>
              <th>status</th>
              <th>origem</th>
              <th>quando</th>
            </tr>
          </thead>
          <tbody>
            {m.recentJobs.map((j) => (
              <tr key={j.id}>
                <td>{j.id}</td>
                <td>{j.template}</td>
                <td>{j.status}</td>
                <td>{j.source}</td>
                <td>{j.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Leads (paywall)</h2>
        <table>
          <thead>
            <tr>
              <th>telefone</th>
              <th>vídeo</th>
              <th>quando</th>
            </tr>
          </thead>
          <tbody>
            {m.recentLeads.map((l, i) => (
              <tr key={i}>
                <td>{l.phone}</td>
                <td>{l.jobId ?? '—'}</td>
                <td>{l.ts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
