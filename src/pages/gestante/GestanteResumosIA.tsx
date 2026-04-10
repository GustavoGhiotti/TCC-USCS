import { useEffect, useMemo, useState } from 'react';
import { GestanteLayout } from '../../components/layout/GestanteLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import {
  getResumosIAGestante,
  type ResumoIAComData,
} from '../../services/gestanteService';

type TipoFiltro = 'todos' | 'diario' | 'semanal';

const TIPO_FILTROS: { value: TipoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'diario', label: 'Diários' },
  { value: 'semanal', label: 'Semanais' },
];

function SemaforoBadge({ status }: { status: 'verde' | 'amarelo' | 'vermelho' }) {
  const config = {
    verde: { variant: 'success' as const, label: 'Estável' },
    amarelo: { variant: 'warning' as const, label: 'Atenção' },
    vermelho: { variant: 'danger' as const, label: 'Alerta' },
  };

  const current = config[status];
  return <Badge variant={current.variant}>{current.label}</Badge>;
}

function Disclaimer() {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700"
    >
      <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <span>
        <strong>Resumo aprovado pelo médico após revisão clínica.</strong>{' '}
        Este conteúdo foi liberado para acompanhamento e não substitui consulta ou avaliação médica.
      </span>
    </div>
  );
}

interface DetalheModalProps {
  resumo: ResumoIAComData;
  onClose: () => void;
}

function DetalheModal({ resumo, onClose }: DetalheModalProps) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Resumo ${resumo.tipo === 'diario' ? 'diário' : 'semanal'} - ${formatDate(resumo.data)}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <Disclaimer />

        <section aria-labelledby="detalhe-resumo">
          <h3 id="detalhe-resumo" className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Análise
          </h3>
          <p className="text-sm leading-relaxed text-slate-700">{resumo.resumo}</p>
        </section>

        {resumo.sintomasIdentificados.length > 0 && (
          <section aria-labelledby="detalhe-sintomas">
            <h3 id="detalhe-sintomas" className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sintomas identificados
            </h3>
            <div className="flex flex-wrap gap-2">
              {resumo.sintomasIdentificados.map((sintoma) => (
                <Badge key={sintoma} variant="neutral">
                  {sintoma}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {resumo.avisos.length > 0 && (
          <section aria-labelledby="detalhe-avisos">
            <h3 id="detalhe-avisos" className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avisos
            </h3>
            <ul className="space-y-1.5">
              {resumo.avisos.map((aviso, index) => (
                <li key={`${aviso}-${index}`} className="flex items-start gap-2 text-sm text-amber-700">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {aviso}
                </li>
              ))}
            </ul>
          </section>
        )}

        {resumo.recomendacoes && (
          <section aria-labelledby="detalhe-recomendacoes">
            <h3 id="detalhe-recomendacoes" className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recomendações
            </h3>
            <p className="text-sm leading-relaxed text-slate-700">{resumo.recomendacoes}</p>
          </section>
        )}

        <div className="border-t border-slate-100 pt-2">
          <a
            href="/gestante/relatos"
            className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            Ver dados brutos (relatos relacionados) →
          </a>
        </div>
      </div>
    </Modal>
  );
}

interface ResumoRowProps {
  resumo: ResumoIAComData;
  onClick: () => void;
}

function ResumoRow({ resumo, onClick }: ResumoRowProps) {
  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-slate-50/60"
      onClick={onClick}
      onKeyDown={(event) => event.key === 'Enter' && onClick()}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalhes do resumo de ${formatDate(resumo.data)}`}
    >
      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-800">{formatDate(resumo.data)}</td>
      <td className="px-5 py-3.5">
        <Badge variant="info">{resumo.tipo === 'diario' ? 'Diário' : 'Semanal'}</Badge>
      </td>
      <td className="px-5 py-3.5">
        <SemaforoBadge status={resumo.semaforo} />
      </td>
      <td className="max-w-sm px-5 py-3.5 text-slate-500">
        <p className="truncate">{resumo.resumo}</p>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs font-medium text-brand-600">Ver detalhes →</span>
      </td>
    </tr>
  );
}

export function GestanteResumosIA() {
  const { user } = useAuth();
  const [resumos, setResumos] = useState<ResumoIAComData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('todos');
  const [detalhe, setDetalhe] = useState<ResumoIAComData | null>(null);

  function loadResumos() {
    if (!user) return;
    setLoading(true);
    setError(null);
    getResumosIAGestante(user.id)
      .then(setResumos)
      .catch(() => setError('Não foi possível carregar os resumos. Tente novamente.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadResumos, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (filtroTipo === 'todos') return resumos;
    return resumos.filter((resumo) => resumo.tipo === filtroTipo);
  }, [filtroTipo, resumos]);

  return (
    <GestanteLayout>
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-6 py-3 backdrop-blur">
        <h1 className="text-base font-semibold text-slate-900">Resumos IA</h1>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Resumos da assistente</h2>
          <p className="mt-0.5 text-sm text-slate-400">Resumos revisados pelo médico com base nos seus relatos</p>
        </div>

        <div className="mb-6">
          <Disclaimer />
        </div>

        <div role="tablist" aria-label="Filtrar por tipo de resumo" className="mb-6 flex flex-wrap gap-2">
          {TIPO_FILTROS.map((filtro) => (
            <button
              key={filtro.value}
              role="tab"
              type="button"
              aria-selected={filtroTipo === filtro.value}
              onClick={() => setFiltroTipo(filtro.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filtroTipo === filtro.value
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {filtro.label}
              {filtro.value !== 'todos' && (
                <span className="ml-1 opacity-70">
                  ({resumos.filter((resumo) => resumo.tipo === filtro.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSpinner label="Carregando resumos..." />
        ) : error ? (
          <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={loadResumos} className="ml-4 text-xs font-semibold underline">
              Tentar novamente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <svg className="mx-auto mb-3 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <p className="text-sm text-slate-400">Nenhum resumo foi liberado pelo médico ainda.</p>
              <p className="mt-2 text-xs text-slate-400">Os resumos de IA só aparecem aqui depois da revisão e aprovação médica.</p>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="hidden sm:block">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Data</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Análise</th>
                        <th className="sr-only px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((resumo) => (
                        <ResumoRow key={resumo.id} resumo={resumo} onClick={() => setDetalhe(resumo)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="space-y-3 sm:hidden">
              {filtered.map((resumo) => (
                <button
                  key={resumo.id}
                  type="button"
                  onClick={() => setDetalhe(resumo)}
                  className="w-full text-left"
                  aria-label={`Ver detalhes do resumo de ${formatDate(resumo.data)}`}
                >
                  <Card hoverable>
                    <CardHeader>
                      <span className="text-sm font-semibold text-slate-800">{formatDate(resumo.data)}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="info">{resumo.tipo === 'diario' ? 'Diário' : 'Semanal'}</Badge>
                        <SemaforoBadge status={resumo.semaforo} />
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <p className="line-clamp-2 text-sm text-slate-500">{resumo.resumo}</p>
                      {resumo.avisos.length > 0 && (
                        <p className="mt-2 text-xs font-medium text-amber-600">
                          {resumo.avisos.length} aviso{resumo.avisos.length > 1 ? 's' : ''} →
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {detalhe && <DetalheModal resumo={detalhe} onClose={() => setDetalhe(null)} />}
    </GestanteLayout>
  );
}
