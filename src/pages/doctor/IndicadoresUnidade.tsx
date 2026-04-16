import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorLayout } from '../../components/layout/DoctorLayout';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../lib/utils';
import {
  getIndicadoresUnidade,
  type IndicadoresData,
  type PeriodoDias,
  type TopGestante,
} from '../../services/indicatorsService';

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  colorCls: string;
}

function KPICard({ label, value, sub, icon, colorCls }: KPICardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className={`rounded-xl p-3 ${colorCls}`} aria-hidden="true">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="mb-1 truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function KPISkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-slate-100" />
        <div className="mt-1 flex-1 space-y-2">
          <div className="h-2.5 w-3/4 rounded bg-slate-100" />
          <div className="h-7 w-1/2 rounded bg-slate-100" />
          <div className="h-2 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function ReportsRhythmChart({ data }: { data: IndicadoresData['relatosPorDia'] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
        <h3 className="text-sm font-semibold text-slate-800">Ritmo de relatos</h3>
        <p className="mt-4 text-sm text-slate-400">Nao houve relatos no periodo selecionado.</p>
      </div>
    );
  }

  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Ritmo de relatos</h3>
          <p className="mt-0.5 text-xs text-slate-400">Volume de envios ao longo do periodo.</p>
        </div>
        <Badge variant="info">{data.reduce((sum, item) => sum + item.count, 0)} relatos</Badge>
      </div>

      <div className="flex h-44 items-end gap-2">
        {data.map((item) => (
          <div key={item.data} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[10px] font-semibold text-slate-500">{item.count}</span>
            <div
              className="w-full rounded-t-md bg-brand-500/85"
              style={{ height: `${Math.max(8, (item.count / max) * 100)}%` }}
              aria-hidden="true"
            />
            <span className="text-[10px] text-slate-400">{item.data.slice(0, 5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskDistributionCard({ data }: { data: IndicadoresData['distribuicaoRisco'] }) {
  const total = Math.max(data.reduce((sum, item) => sum + item.count, 0), 1);
  const colorMap: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-blue-500',
    none: 'bg-emerald-500',
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Distribuicao de risco da carteira</h3>
          <p className="mt-0.5 text-xs text-slate-400">Classificacao baseada nos eventos observados no periodo.</p>
        </div>
        <Badge variant="info">{total} pacientes</Badge>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full w-full">
          {data.map((item) => (
            <div
              key={item.level}
              className={colorMap[item.level]}
              style={{ width: `${(item.count / total) * 100}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.map((item) => (
          <div key={item.level} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${colorMap[item.level]}`} aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            </div>
            <p className="mt-1 text-lg font-bold text-slate-900">{item.count}</p>
            <p className="text-xs text-slate-400">{Math.round((item.count / total) * 100)}% da carteira</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoverageCard({ dados }: { dados: IndicadoresData }) {
  const coverageTone = dados.taxaCoberturaRelatos >= 80
    ? 'success'
    : dados.taxaCoberturaRelatos >= 60
      ? 'warning'
      : 'danger';

  const toneCls = {
    success: 'border-emerald-200 bg-emerald-50/70',
    warning: 'border-amber-200 bg-amber-50/70',
    danger: 'border-red-200 bg-red-50/70',
  }[coverageTone];

  return (
    <div className={`rounded-2xl border p-5 ${toneCls}`}>
      <h3 className="text-sm font-semibold text-slate-800">Cobertura de acompanhamento</h3>
      <p className="mt-1 text-sm text-slate-600">
        {dados.taxaCoberturaRelatos}% da carteira enviou pelo menos um relato no periodo selecionado.
      </p>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${dados.taxaCoberturaRelatos}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Com relato</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{dados.totalGestantes - dados.gestantesSemRelato}</p>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sem relato</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{dados.gestantesSemRelato}</p>
        </div>
      </div>
    </div>
  );
}

function GestanteRow({ gestante }: { gestante: TopGestante }) {
  const navigate = useNavigate();

  return (
    <tr className="transition-colors hover:bg-slate-50/60">
      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-800">{gestante.nome}</td>
      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
        {gestante.semanasGestacao != null ? `${gestante.semanasGestacao} sem` : '-'}
      </td>
      <td className="px-5 py-3.5">
        {gestante.totalAlertas > 0 ? <Badge variant="danger">{gestante.totalAlertas}</Badge> : <Badge variant="neutral">0</Badge>}
      </td>
      <td className="px-5 py-3.5 text-slate-500">{gestante.totalRelatos}</td>
      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
        {gestante.ultimoRegistro ? formatDate(gestante.ultimoRegistro) : '-'}
      </td>
      <td className="px-5 py-3.5">
        <button
          type="button"
          onClick={() => navigate(`/doctor/patients/${gestante.patientId}`)}
          className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          Abrir paciente
        </button>
      </td>
    </tr>
  );
}

export function IndicadoresUnidade() {
  const [periodo, setPeriodo] = useState<PeriodoDias>(30);
  const [dados, setDados] = useState<IndicadoresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const periodos: { label: string; value: PeriodoDias }[] = [
    { label: 'Ultimos 7 dias', value: 7 },
    { label: 'Ultimos 30 dias', value: 30 },
    { label: 'Ultimos 90 dias', value: 90 },
  ];

  useEffect(() => {
    setLoading(true);
    setError(null);
    getIndicadoresUnidade(periodo)
      .then(setDados)
      .catch(() => setError('Nao foi possivel carregar os indicadores.'))
      .finally(() => setLoading(false));
  }, [periodo, reloadKey]);

  const topResumo = useMemo(() => {
    if (!dados) return null;
    const first = dados.topGestantes[0];
    const second = dados.topGestantes[1];

    return { first, second };
  }, [dados]);

  return (
    <DoctorLayout>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/90 px-6 py-3 backdrop-blur">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Indicadores da carteira</h1>
          <p className="mt-0.5 text-sm text-slate-400">Panorama assistencial para apoiar organizacao da agenda medica.</p>
        </div>

        <div role="group" aria-label="Selecionar periodo" className="flex gap-1.5">
          {periodos.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={periodo === item.value}
              onClick={() => setPeriodo(item.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                periodo === item.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {error && (
          <div role="alert" className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((current) => current + 1)} className="ml-4 text-xs font-semibold underline">
              Tentar novamente
            </button>
          </div>
        )}

        <section aria-label="Indicadores principais" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <>
              <KPISkeleton />
              <KPISkeleton />
              <KPISkeleton />
              <KPISkeleton />
            </>
          ) : dados ? (
            <>
              <KPICard
                label="Gestantes acompanhadas"
                value={dados.totalGestantes}
                sub="base ativa do medico"
                colorCls="bg-brand-50 text-brand-700"
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              />
              <KPICard
                label="Alta atencao"
                value={dados.gestantesComAltaAtencao}
                sub="carteira com maior risco atual"
                colorCls="bg-red-50 text-red-700"
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zm-8.303-.624c-.866 1.5.217 3.374 1.948 3.374h12.71c1.73 0 2.813-1.874 1.948-3.374L13.95 4.378c-.866-1.5-3.032-1.5-3.898 0L3.697 16.126z" /></svg>}
              />
              <KPICard
                label="Cobertura de relatos"
                value={`${dados.taxaCoberturaRelatos}%`}
                sub="pacientes com pelo menos um envio"
                colorCls="bg-blue-50 text-blue-700"
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>}
              />
              <KPICard
                label="Media relatos por semana"
                value={dados.mediaRelatosPorSemana}
                sub="carga observada no periodo"
                colorCls="bg-purple-50 text-purple-700"
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l3-3 3 2 4-5" /></svg>}
              />
            </>
          ) : null}
        </section>

        {loading && !error && <PageSpinner label="Carregando indicadores..." />}

        {!loading && dados && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_0.9fr]">
            <div className="flex flex-col gap-6">
              <RiskDistributionCard data={dados.distribuicaoRisco} />
              <ReportsRhythmChart data={dados.relatosPorDia} />

              <div className="rounded-2xl border border-slate-100 bg-white shadow-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">Pacientes que concentram demanda</h3>
                    <p className="mt-0.5 text-xs text-slate-400">Ordenadas por alertas e volume de relatos.</p>
                  </div>
                  <Badge variant="warning">{dados.alertasPendentes} alertas no periodo</Badge>
                </div>

                {dados.topGestantes.length === 0 ? (
                  <div className="px-5 py-12 text-center text-sm text-slate-400">
                    Nenhum dado encontrado para o periodo selecionado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nome</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">IG</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Alertas</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Relatos</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Ultimo</th>
                          <th className="sr-only px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Acao</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {dados.topGestantes.slice(0, 8).map((gestante) => (
                          <GestanteRow key={gestante.id} gestante={gestante} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <CoverageCard dados={dados} />

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
                <h3 className="text-sm font-semibold text-slate-800">Leitura assistencial do periodo</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pacientes com evento de atencao</p>
                    <p className="mt-1">
                      {dados.gestantesComAlerta} paciente(s), ou {dados.percentualComAlerta}% da carteira, tiveram algum evento que merece revisao.
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Busca ativa</p>
                    <p className="mt-1">
                      {dados.gestantesSemRelato > 0
                        ? `${dados.gestantesSemRelato} paciente(s) ficaram sem relato no periodo e devem entrar na rotina de contato ativo.`
                        : 'Nao houve paciente sem relato no periodo selecionado.'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Maior concentracao de demanda</p>
                    <p className="mt-1">
                      {topResumo?.first
                        ? `${topResumo.first.nome} lidera a carteira com ${topResumo.first.totalAlertas} alerta(s) e ${topResumo.first.totalRelatos} relato(s).`
                        : 'Sem concentracao relevante de demanda no periodo.'}
                    </p>
                    {topResumo?.second && (
                      <p className="mt-2 text-xs text-slate-400">
                        Em seguida: {topResumo.second.nome} com {topResumo.second.totalAlertas} alerta(s).
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="flex items-start gap-1.5 text-xs text-slate-400">
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                Indicadores calculados com base nos relatos e alertas do periodo. Servem para organizar seguimento e priorizacao, nao para substituir avaliacao clinica individual.
              </p>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}

export default IndicadoresUnidade;
