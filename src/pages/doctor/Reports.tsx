import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorLayout } from '../../components/layout/DoctorLayout';
import { AlertBadge } from '../../components/doctor/AlertBadge';
import { HorizontalBarChart } from '../../components/charts/HorizontalBarChart';
import { LineChart } from '../../components/charts/LineChart';
import { Badge } from '../../components/ui/Badge';
import { ChartSkeleton, KPISkeleton, Skeleton } from '../../components/ui/Skeleton';
import { exportToCsv } from '../../lib/exportCsv';
import { relativeDate } from '../../lib/utils';
import { fetchReportData } from '../../services/doctorApi';
import { type ReportData, type ReportPeriod } from '../../types/alerts';

function StatCard({
  label,
  value,
  sub,
  iconBg,
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  iconBg: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className={`rounded-xl p-3 ${iconBg}`} aria-hidden="true">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-0.5 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'danger' | 'warning' | 'info';
  children: ReactNode;
}) {
  const toneMap = {
    danger: 'border-red-200 bg-red-50/70 text-red-900',
    warning: 'border-amber-200 bg-amber-50/70 text-amber-900',
    info: 'border-blue-200 bg-blue-50/70 text-blue-900',
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-modal"
    >
      <svg className="h-4 w-4 flex-shrink-0 text-brand-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
      </svg>
      {message}
    </div>
  );
}

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: '7d', label: 'Ultimos 7 dias' },
  { value: '30d', label: 'Ultimos 30 dias' },
  { value: '90d', label: 'Ultimos 90 dias' },
];

const LEVEL_MAP: Record<string, 'none' | 'low' | 'medium' | 'high'> = {
  none: 'none',
  low: 'low',
  medium: 'medium',
  high: 'high',
};

export function DoctorReports() {
  const navigate = useNavigate();

  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchReportData(period)
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  const derived = useMemo(() => {
    if (!data) return null;

    const patientsWithAlerts = data.patientSummary.filter((patient) => patient.alertCount > 0);
    const patientsWithoutReports = data.patientSummary.filter((patient) => patient.reportCount === 0);
    const avgReportsPerPatient = data.kpi.activePatients > 0
      ? Number((data.kpi.totalReports / data.kpi.activePatients).toFixed(1))
      : 0;
    const attentionLoad = data.kpi.activePatients > 0
      ? Math.round((patientsWithAlerts.length / data.kpi.activePatients) * 100)
      : 0;
    const highPriorityPatients = [...data.patientSummary]
      .sort((a, b) => {
        const levelOrder = { high: 3, medium: 2, low: 1, none: 0 };
        const levelDiff = levelOrder[b.alertLevel] - levelOrder[a.alertLevel];
        if (levelDiff !== 0) return levelDiff;
        if (b.alertCount !== a.alertCount) return b.alertCount - a.alertCount;
        if (b.reportCount !== a.reportCount) return b.reportCount - a.reportCount;
        return a.name.localeCompare(b.name);
      });

    return {
      patientsWithAlerts,
      patientsWithoutReports,
      avgReportsPerPatient,
      attentionLoad,
      highPriorityPatients,
      topPatients: highPriorityPatients.slice(0, 5),
      alertTypeChart: data.alertTypeDist.map((item) => ({
        label: item.type,
        value: item.count,
        color: item.count >= 3 ? '#dc2626' : '#d97706',
      })),
    };
  }, [data]);

  function handleExportCSV() {
    if (!data) return;
    const rows = data.patientSummary.map((patient) => ({
      Paciente: patient.name,
      IG: patient.ig ?? '-',
      Relatos: patient.reportCount,
      Alertas: patient.alertCount,
      Nivel_atencao: patient.alertLevel,
      Ultimo_registro: patient.lastRecord ? relativeDate(patient.lastRecord) : '-',
    }));
    exportToCsv(`relatorio-operacional-${period}`, rows);
    setToast('CSV exportado com sucesso.');
  }

  function buildSummaryText(): string {
    if (!data || !derived) return '';
    const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? period;
    return [
      `Periodo: ${periodLabel}`,
      `Pacientes ativos: ${data.kpi.activePatients}`,
      `Pacientes com alerta: ${derived.patientsWithAlerts.length}`,
      `Sem relato no periodo: ${derived.patientsWithoutReports.length}`,
      `Media de relatos por paciente: ${derived.avgReportsPerPatient}`,
      `Alertas revisados: ${data.kpi.reviewedPct}%`,
    ].join(' | ');
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      setCopied(true);
      setToast('Resumo copiado.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast('Nao foi possivel copiar o resumo.');
    }
  }

  const chartLabels = data?.reportsPerDay.map((item) => item.date) ?? [];
  const reportValues = data?.reportsPerDay.map((item) => item.value) ?? [];
  const highValues = data?.alertsHighPerDay.map((item) => item.value) ?? [];
  const mediumValues = data?.alertsMediumPerDay.map((item) => item.value) ?? [];
  const lowValues = data?.alertsLowPerDay.map((item) => item.value) ?? [];

  return (
    <DoctorLayout>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/90 px-6 py-4 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Relatorios operacionais</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Prioridades por paciente, adesao de relatos e exportacao da carteira.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div role="group" aria-label="Periodo do relatorio" className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={period === item.value}
                onClick={() => setPeriod(item.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === item.value ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={loading || !data}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-6">
        <section aria-label="Indicadores operacionais">
          {loading ? (
            <KPISkeleton count={4} />
          ) : data && derived ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Pacientes que pedem revisao"
                value={derived.patientsWithAlerts.length}
                sub={`${derived.attentionLoad}% da carteira no periodo`}
                iconBg="bg-red-50 text-red-600"
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zm-8.303-.624c-.866 1.5.217 3.374 1.948 3.374h12.71c1.73 0 2.813-1.874 1.948-3.374L13.95 4.378c-.866-1.5-3.032-1.5-3.898 0L3.697 16.126z" /></svg>}
              />
              <StatCard
                label="Sem relato no periodo"
                value={derived.patientsWithoutReports.length}
                sub="pacientes sem retorno recente"
                iconBg="bg-amber-50 text-amber-600"
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatCard
                label="Media de relatos"
                value={derived.avgReportsPerPatient}
                sub="por paciente ativa"
                iconBg="bg-blue-50 text-blue-600"
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>}
              />
              <StatCard
                label="Taxa de revisao"
                value={`${data.kpi.reviewedPct}%`}
                sub="alertas ja avaliados"
                iconBg="bg-emerald-50 text-emerald-600"
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </div>
          ) : null}
        </section>

        <section aria-label="Leituras prioritarias">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ChartSkeleton height={140} />
              <ChartSkeleton height={140} />
              <ChartSkeleton height={140} />
            </div>
          ) : data && derived ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <InsightCard title="Foco clinico imediato" tone="danger">
                {derived.topPatients[0]
                  ? <>
                      <p className="font-semibold">{derived.topPatients[0].name}</p>
                      <p className="mt-1">
                        {derived.topPatients[0].alertCount} alerta(s), {derived.topPatients[0].reportCount} relato(s)
                        {derived.topPatients[0].lastRecord ? ` e ultimo registro ${relativeDate(derived.topPatients[0].lastRecord)}.` : '.'}
                      </p>
                    </>
                  : 'Nenhuma paciente com demanda critica no periodo.'}
              </InsightCard>

              <InsightCard title="Busca ativa recomendada" tone="warning">
                {derived.patientsWithoutReports.length > 0
                  ? `${derived.patientsWithoutReports.length} paciente(s) ficaram sem relato no periodo. Essa lista deve orientar contato ativo e revisao de adesao.`
                  : 'Todas as pacientes tiveram pelo menos um relato no periodo.'}
              </InsightCard>

              <InsightCard title="Uso pratico da tela" tone="info">
                Use esta pagina para decidir quem abrir primeiro, acompanhar volume de alertas e exportar a carteira para discussao de equipe ou passagem de caso.
              </InsightCard>
            </div>
          ) : null}
        </section>

        <section aria-label="Tendencias do periodo">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {loading ? (
              <ChartSkeleton height={220} />
            ) : data ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
                <LineChart
                  title="Volume diario de relatos"
                  labels={chartLabels}
                  datasets={[{ label: 'Relatos', color: '#0d9488', values: reportValues }]}
                  ariaLabel={`Volume diario de relatos no periodo ${period}.`}
                />
              </div>
            ) : null}

            {loading ? (
              <ChartSkeleton height={220} />
            ) : data ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
                <LineChart
                  title="Evolucao dos alertas por severidade"
                  labels={chartLabels}
                  datasets={[
                    { label: 'Alta atencao', color: '#dc2626', values: highValues },
                    { label: 'Atencao moderada', color: '#d97706', values: mediumValues },
                    { label: 'Baixa atencao', color: '#2563eb', values: lowValues },
                  ]}
                  ariaLabel="Tendencia dos alertas por severidade."
                />
              </div>
            ) : null}
          </div>
        </section>

        <section aria-label="Fila de pacientes">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Pacientes para priorizar</h2>
              <p className="mt-0.5 text-sm text-slate-400">
                Lista ordenada por nivel de atencao, quantidade de alertas e volume de relatos.
              </p>
            </div>
            {!loading && derived && (
              <Badge variant="warning">{derived.patientsWithAlerts.length} com alerta</Badge>
            )}
          </div>

          {loading ? (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <Skeleton className="h-3 w-full max-w-lg" />
              </div>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex gap-4 border-b border-slate-50 px-4 py-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : data && derived ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Paciente', 'IG', 'Relatos', 'Alertas', 'Ultimo registro', 'Status', 'Acao'].map((header) => (
                      <th key={header} scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {derived.highPriorityPatients.map((patient) => (
                    <tr key={patient.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{patient.name}</p>
                            {patient.reportCount === 0 && <p className="text-xs text-amber-600">Sem relato no periodo</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{patient.ig ?? '-'}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-700">{patient.reportCount}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-700">{patient.alertCount}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{patient.lastRecord ? relativeDate(patient.lastRecord) : '-'}</td>
                      <td className="px-4 py-3">
                        <AlertBadge level={LEVEL_MAP[patient.alertLevel] ?? 'none'} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                          className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
                        >
                          Abrir paciente
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section aria-label="Padroes de alerta e compartilhamento">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            {loading ? (
              <ChartSkeleton height={250} />
            ) : derived ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
                <HorizontalBarChart
                  title="Tipos de alerta mais frequentes"
                  data={derived.alertTypeChart}
                  ariaLabel="Distribuicao dos tipos de alerta mais frequentes no periodo."
                />
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
              <h2 className="text-base font-semibold text-slate-800">Resumo para equipe</h2>
              {loading ? (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : data && derived ? (
                <>
                  <p className="mt-1 text-sm text-slate-400">
                    Texto curto para passagem de plantao, reuniao de equipe ou registro administrativo.
                  </p>
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm leading-relaxed text-slate-700">
                    {buildSummaryText()}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      {copied ? 'Copiado!' : 'Copiar resumo'}
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                    >
                      Baixar CSV
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </DoctorLayout>
  );
}
