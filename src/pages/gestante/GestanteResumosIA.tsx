import { useState, useEffect, useMemo } from 'react';
import { GestanteLayout } from '../../components/layout/GestanteLayout';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import {
  getResumosIAGestante,
  type ResumoIAComData,
} from '../../services/gestanteService';

// ─── Tipos de filtro ──────────────────────────────────────────────────────────
type TipoFiltro = 'todos' | 'diario' | 'semanal';

const TIPO_FILTROS: { value: TipoFiltro; label: string }[] = [
  { value: 'todos',   label: 'Todos'   },
  { value: 'diario',  label: 'Diários' },
  { value: 'semanal', label: 'Semanais'},
];

// ─── Badge semáforo ───────────────────────────────────────────────────────────
function SemaforoBadge({ status }: { status: 'verde' | 'amarelo' | 'vermelho' }) {
  const config = {
    verde:    { variant: 'success' as const,  label: 'Estável'  },
    amarelo:  { variant: 'warning' as const,  label: 'Atenção'  },
    vermelho: { variant: 'danger'  as const,  label: 'Alerta'   },
  };
  const c = config[status];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────
function Disclaimer() {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700"
    >
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <span>
        <strong>Resumo automático para apoiar a revisão do médico.</strong>{' '}
        Estas análises não substituem avaliação clínica. Consulte sempre o seu médico responsável.
      </span>
    </div>
  );
}

// ─── Modal de detalhe ─────────────────────────────────────────────────────────
interface DetalheModalProps {
  resumo: ResumoIAComData;
  onClose: () => void;
}
function DetalheModal({ resumo, onClose }: DetalheModalProps) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Resumo ${resumo.tipo === 'diario' ? 'diário' : 'semanal'} — ${formatDate(resumo.data)}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <Disclaimer />

        {/* Resumo */}
        <section aria-labelledby="detalhe-resumo">
          <h3 id="detalhe-resumo" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Análise</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{resumo.resumo}</p>
        </section>

        {/* Sintomas identificados */}
        {resumo.sintomasIdentificados && resumo.sintomasIdentificados.length > 0 && (
          <section aria-labelledby="detalhe-sintomas">
            <h3 id="detalhe-sintomas" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sintomas identificados</h3>
            <div className="flex flex-wrap gap-2">
              {resumo.sintomasIdentificados.map(s => (
                <Badge key={s} variant="neutral">{s}</Badge>
              ))}
            </div>
          </section>
        )}

        {/* Avisos */}
        {resumo.avisos && resumo.avisos.length > 0 && (
          <section aria-labelledby="detalhe-avisos">
            <h3 id="detalhe-avisos" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Avisos</h3>
            <ul className="space-y-1.5">
              {resumo.avisos.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Recomendações */}
        {resumo.recomendacoes && (
          <section aria-labelledby="detalhe-recomendacoes">
            <h3 id="detalhe-recomendacoes" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recomendações</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{resumo.recomendacoes}</p>
          </section>
        )}

        {/* Link para dados brutos */}
        <div className="pt-2 border-t border-slate-100">
          <a
            href="/gestante/relatos"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Ver dados brutos (relatos relacionados) →
          </a>
        </div>
      </div>
    </Modal>
  );
}

// ─── Linha de resumo ──────────────────────────────────────────────────────────
interface ResumoRowProps {
  resumo: ResumoIAComData;
  onClick: () => void;
}
function ResumoRow({ resumo, onClick }: ResumoRowProps) {
  return (
    <tr
      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalhes do resumo de ${formatDate(resumo.data)}`}
    >
      <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">{formatDate(resumo.data)}</td>
      <td className="px-5 py-3.5">
        <Badge variant="info">{resumo.tipo === 'diario' ? 'Diário' : 'Semanal'}</Badge>
      </td>
      <td className="px-5 py-3.5">
        <SemaforoBadge status={resumo.semaforo} />
      </td>
      <td className="px-5 py-3.5 text-slate-500 max-w-sm">
        <p className="truncate">{resumo.resumo}</p>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs font-medium text-brand-600">Ver detalhes →</span>
      </td>
    </tr>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function GestanteResumosIA() {
  const { user } = useAuth();

  const [resumos, setResumos]     = useState<ResumoIAComData[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('todos');
  const [detalhe, setDetalhe]     = useState<ResumoIAComData | null>(null);

  function loadResumos() {
    if (!user) return;
    setLoading(true);
    getResumosIAGestante(user.id)
      .then(setResumos)
      .catch(() => setError('Não foi possível carregar os resumos. Tente novamente.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadResumos, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (filtroTipo === 'todos') return resumos;
    return resumos.filter(r => r.tipo === filtroTipo);
  }, [resumos, filtroTipo]);

  return (
    <GestanteLayout>
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-3">
        <h1 className="text-base font-semibold text-slate-900">Resumos IA</h1>
      </header>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Resumos da assistente</h2>
          <p className="text-sm text-slate-400 mt-0.5">Análises automáticas dos seus relatos para apoio médico</p>
        </div>

        {/* Disclaimer global */}
        <div className="mb-6">
          <Disclaimer />
        </div>

        {/* Filtros de tipo */}
        <div
          role="tablist"
          aria-label="Filtrar por tipo de resumo"
          className="flex gap-2 flex-wrap mb-6"
        >
          {TIPO_FILTROS.map(f => (
            <button
              key={f.value}
              role="tab"
              type="button"
              aria-selected={filtroTipo === f.value}
              onClick={() => setFiltroTipo(f.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtroTipo === f.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {f.label}
              {f.value !== 'todos' && (
                <span className="ml-1 opacity-70">
                  ({resumos.filter(r => r.tipo === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {loading ? (
          <PageSpinner label="Carregando resumos…" />
        ) : error ? (
          <div role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={loadResumos} className="text-xs font-semibold underline ml-4">
              Tentar novamente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <svg className="w-10 h-10 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <p className="text-sm text-slate-400">Nenhum resumo encontrado para o filtro selecionado.</p>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Tabela — desktop */}
            <div className="hidden sm:block">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Análise</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider sr-only">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map(r => (
                        <ResumoRow key={r.id} resumo={r} onClick={() => setDetalhe(r)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Cards — mobile */}
            <div className="sm:hidden space-y-3">
              {filtered.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDetalhe(r)}
                  className="w-full text-left"
                  aria-label={`Ver detalhes do resumo de ${formatDate(r.data)}`}
                >
                  <Card hoverable>
                    <CardHeader>
                      <span className="text-sm font-semibold text-slate-800">{formatDate(r.data)}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="info">{r.tipo === 'diario' ? 'Diário' : 'Semanal'}</Badge>
                        <SemaforoBadge status={r.semaforo} />
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <p className="text-sm text-slate-500 line-clamp-2">{r.resumo}</p>
                      {r.avisos && r.avisos.length > 0 && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                          {r.avisos.length} aviso{r.avisos.length > 1 ? 's' : ''} →
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

      {/* Modal de detalhe */}
      {detalhe && (
        <DetalheModal resumo={detalhe} onClose={() => setDetalhe(null)} />
      )}
    </GestanteLayout>
  );
}
