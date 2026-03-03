import { useState, useEffect } from 'react';
import { GestanteLayout } from '../../components/layout/GestanteLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import { getMedicamentosGestanteService } from '../../services/gestanteService';
import type { Medicamento } from '../../types/domain';

// ─── Card de medicamento ──────────────────────────────────────────────────────
interface MedCardProps {
  med: Medicamento;
}
function MedCard({ med }: MedCardProps) {
  return (
    <article
      className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex items-start gap-4 transition-shadow hover:shadow-card-md"
      aria-label={`Medicamento: ${med.nome}`}
    >
      {/* Ícone */}
      <div className="bg-brand-50 text-brand-700 rounded-xl p-3 flex-shrink-0" aria-hidden="true">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      </div>

      {/* Dados */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-slate-900 truncate">{med.nome}</h3>
          <Badge variant={med.ativo ? 'success' : 'neutral'}>
            {med.ativo ? 'Em uso' : 'Encerrado'}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          <span className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">Dose:</span> {med.dosagem}
          </span>
          <span className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">Frequência:</span> {med.frequencia}
          </span>
          {(med.dataPrescricao ?? med.dataInicio) && (
            <span className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">Desde:</span>{' '}
              {formatDate(med.dataPrescricao ?? med.dataInicio!)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export function GestanteMedicamentos() {
  const { user } = useAuth();

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  function loadMeds() {
    if (!user) return;
    setLoading(true);
    getMedicamentosGestanteService(user.id)
      .then(setMedicamentos)
      .catch(() => setError('Não foi possível carregar os medicamentos. Tente novamente.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadMeds, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const ativos    = medicamentos.filter(m => m.ativo);
  const historico = medicamentos.filter(m => !m.ativo);

  return (
    <GestanteLayout>
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-3">
        <h1 className="text-base font-semibold text-slate-900">Medicamentos</h1>
      </header>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Meus medicamentos</h2>
          <p className="text-sm text-slate-400 mt-0.5">Prescrições gerenciadas pelo seu médico</p>
        </div>

        {loading ? (
          <PageSpinner label="Carregando medicamentos…" />
        ) : error ? (
          <div role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={loadMeds} className="text-xs font-semibold underline ml-4">
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {/* Aviso sobre edição */}
            <div className="mb-6 flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-500">
              <svg className="w-5 h-5 flex-shrink-0 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span>As prescrições são gerenciadas pelo seu médico. Em caso de dúvidas, entre em contato com ele.</span>
            </div>

            {/* Ativos */}
            <section aria-label="Medicamentos em uso" className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Em uso
                <span className="ml-2 text-sm font-normal text-slate-400">({ativos.length})</span>
              </h2>
              {ativos.length === 0 ? (
                <Card>
                  <CardBody className="py-12 text-center text-slate-400">
                    <p className="text-sm">Nenhum medicamento ativo no momento.</p>
                  </CardBody>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ativos.map(m => <MedCard key={m.id} med={m} />)}
                </div>
              )}
            </section>

            {/* Histórico */}
            {historico.length > 0 && (
              <section aria-label="Histórico de medicamentos">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  Histórico
                  <span className="ml-2 text-sm font-normal text-slate-400">({historico.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {historico.map(m => <MedCard key={m.id} med={m} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </GestanteLayout>
  );
}
