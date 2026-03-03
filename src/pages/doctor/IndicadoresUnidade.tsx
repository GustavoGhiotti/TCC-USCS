import { useState, useEffect, type ReactNode } from 'react';
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

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  colorCls: string;
}
function KPICard({ label, value, sub, icon, colorCls }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
      <div className="flex items-start gap-4">
        <div className={`rounded-xl p-3 flex-shrink-0 ${colorCls}`} aria-hidden="true">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 truncate">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Gráfico de barras SVG ────────────────────────────────────────────────────
interface BarChartProps {
  data: { data: string; count: number }[];
  ariaLabel: string;
}
function BarChart({ data, ariaLabel }: BarChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-10">
        Nenhum relato registrado no período selecionado.
      </p>
    );
  }

  const BAR_W = 28;
  const GAP = 8;
  const CHART_H = 80;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalW = data.length * (BAR_W + GAP);

  return (
    <div className="overflow-x-auto" role="img" aria-label={ariaLabel}>
      <svg
        width={totalW}
        height={CHART_H + 38}
        style={{ minWidth: '100%' }}
        aria-hidden="true"
      >
        {data.map((d, i) => {
          const barH = Math.max((d.count / maxCount) * CHART_H, 4);
          const x = i * (BAR_W + GAP);
          const y = CHART_H - barH;
          return (
            <g key={d.data}>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={5}
                fill="#0d9488"
                opacity={0.85}
              />
              {d.count > 0 && (
                <text
                  x={x + BAR_W / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#475569"
                  fontWeight="600"
                >
                  {d.count}
                </text>
              )}
              {/* data label */}
              <text
                x={x + BAR_W / 2}
                y={CHART_H + 16}
                textAnchor="middle"
                fontSize={9}
                fill="#94a3b8"
              >
                {d.data.slice(5)} {/* MM-DD */}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Linha da tabela de gestantes ─────────────────────────────────────────────
function GestanteRow({ g }: { g: TopGestante }) {
  const navigate = useNavigate();
  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
        {g.nome}
      </td>
      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
        {g.semanasGestacao != null ? `${g.semanasGestacao} sem` : '—'}
      </td>
      <td className="px-5 py-3.5">
        {g.totalAlertas > 0 ? (
          <Badge variant="danger">{g.totalAlertas}</Badge>
        ) : (
          <Badge variant="neutral">0</Badge>
        )}
      </td>
      <td className="px-5 py-3.5 text-slate-500">{g.totalRelatos}</td>
      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
        {g.ultimoRegistro ? formatDate(g.ultimoRegistro) : '—'}
      </td>
      <td className="px-5 py-3.5">
        <button
          type="button"
          onClick={() => navigate(`/doctor/patients/${g.patientId}`)}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          Abrir →
        </button>
      </td>
    </tr>
  );
}

// ─── Skeleton de KPI ─────────────────────────────────────────────────────────
function KPISkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 mt-1">
          <div className="h-2.5 bg-slate-100 rounded w-3/4" />
          <div className="h-7 bg-slate-100 rounded w-1/2" />
          <div className="h-2 bg-slate-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function IndicadoresUnidade() {
  const [periodo, setPeriodo] = useState<PeriodoDias>(30);
  const [dados, setDados] = useState<IndicadoresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadDados(p: PeriodoDias) {
    setLoading(true);
    setError(null);
    getIndicadoresUnidade(p)
      .then(setDados)
      .catch(() => setError('Não foi possível carregar os indicadores. Tente novamente.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDados(periodo);
  }, [periodo]);

  const PERIODOS: { label: string; value: PeriodoDias }[] = [
    { label: 'Últimos 7 dias', value: 7 },
    { label: 'Últimos 30 dias', value: 30 },
    { label: 'Últimos 90 dias', value: 90 },
  ];

  return (
    <DoctorLayout>
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-3 flex items-center justify-between gap-4">
        <h1 className="text-base font-semibold text-slate-900">
          Indicadores da Unidade
        </h1>
        {/* Seletor de período */}
        <div
          role="group"
          aria-label="Selecionar período"
          className="flex gap-1.5"
        >
          {PERIODOS.map(p => (
            <button
              key={p.value}
              type="button"
              aria-pressed={periodo === p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                periodo === p.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Indicadores da Unidade
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Visão agregada das gestantes acompanhadas
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 flex items-center justify-between mb-6"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadDados(periodo)}
              className="text-xs font-semibold underline ml-4"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <section aria-label="Indicadores principais" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
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
                sub="cadastradas no sistema"
                colorCls="bg-brand-50 text-brand-700"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                }
              />
              <KPICard
                label="Com evento de atenção"
                value={`${dados.percentualComAlerta}%`}
                sub={`${dados.gestantesComAlerta} de ${dados.totalGestantes} no período`}
                colorCls={dados.percentualComAlerta > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                }
              />
              <KPICard
                label="Média relatos/semana"
                value={dados.mediaRelatosPorSemana}
                sub="por semana no período"
                colorCls="bg-purple-50 text-purple-700"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                }
              />
              <KPICard
                label="Eventos de atenção"
                value={dados.alertasPendentes}
                sub="no período selecionado"
                colorCls={dados.alertasPendentes > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                }
              />
            </>
          ) : null}
        </section>

        {/* ── Gráfico: Relatos por dia ──────────────────────────────────────── */}
        {!loading && dados && (
          <section aria-label="Relatos por dia" className="mb-8">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Relatos por data — últimos {periodo} dias
              </h3>
              <BarChart
                data={dados.relatosPorDia}
                ariaLabel={`Gráfico de barras mostrando relatos registrados por dia nos últimos ${periodo} dias`}
              />
            </div>
          </section>
        )}

        {/* ── Tabela: Top gestantes com eventos de atenção ──────────────────── */}
        {!loading && dados && (
          <section aria-label="Gestantes com mais eventos de atenção">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  Gestantes — eventos de atenção no período
                </h3>
                <span className="text-xs text-slate-400">
                  Ordenado por eventos de atenção
                </span>
              </div>

              {dados.topGestantes.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-slate-400">
                  Nenhum dado encontrado para o período selecionado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          IG
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Eventos
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Relatos
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Último registro
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider sr-only">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dados.topGestantes.map(g => (
                        <GestanteRow key={g.id} g={g} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <p className="mt-3 text-xs text-slate-400 flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Indicadores calculados a partir dos relatos registrados no período. &ldquo;Eventos de atenção&rdquo; refere-se a relatos contendo sintomas que requerem revisão clínica, sem implicar diagnóstico.
            </p>
          </section>
        )}

        {loading && !error && (
          <PageSpinner label="Carregando indicadores…" />
        )}
      </div>
    </DoctorLayout>
  );
}

export default IndicadoresUnidade;
