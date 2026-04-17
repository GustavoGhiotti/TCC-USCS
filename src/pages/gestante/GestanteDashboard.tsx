import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GestanteLayout } from '../../components/layout/GestanteLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import {
  getDashboardGestante,
  type DashboardData,
} from '../../services/gestanteService';

interface SemaforoProps {
  status: 'verde' | 'amarelo' | 'vermelho';
}

function SemaforoIndicador({ status }: SemaforoProps) {
  const config = {
    verde: {
      label: 'Estavel',
      subtitle: 'Indicacao liberada para paciente apos revisao do medico.',
      dot: 'bg-emerald-500',
      badge: 'border-emerald-200 bg-white/90 text-emerald-700',
      panel: 'from-emerald-100 via-white to-teal-50',
      ring: 'shadow-[0_12px_30px_-18px_rgba(16,185,129,0.55)]',
      icon: (
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    amarelo: {
      label: 'Atencao',
      subtitle: 'Sinalizacao compartilhada pelo medico para orientar seu acompanhamento.',
      dot: 'bg-amber-500',
      badge: 'border-amber-200 bg-white/90 text-amber-700',
      panel: 'from-amber-100 via-white to-orange-50',
      ring: 'shadow-[0_12px_30px_-18px_rgba(245,158,11,0.45)]',
      icon: (
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    },
    vermelho: {
      label: 'Alerta',
      subtitle: 'Alerta exibido somente quando ha revisao clinica do medico.',
      dot: 'bg-rose-500',
      badge: 'border-rose-200 bg-white/90 text-rose-700',
      panel: 'from-rose-100 via-white to-orange-50',
      ring: 'shadow-[0_12px_30px_-18px_rgba(244,63,94,0.45)]',
      icon: (
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
    },
  };

  const current = config[status];

  return (
    <div className={`rounded-[28px] border border-white/70 bg-gradient-to-br ${current.panel} p-5 ${current.ring}`}>
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${current.badge}`}
        role="status"
        aria-label={`Nivel de atencao: ${current.label}`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${current.dot}`} aria-hidden="true" />
        {current.icon}
        Nivel atual: {current.label}
      </div>
      <p className="mt-3 text-sm text-slate-600">{current.subtitle}</p>
      <p className="mt-4 text-xs text-slate-500">
        Este nivel so deve aparecer para a paciente apos validacao do medico responsavel. A IA pode apoiar analises internas, mas nao substitui decisao clinica.
      </p>
    </div>
  );
}

interface SummaryTileProps {
  label: string;
  value: string | number;
  description: string;
  tone?: 'brand' | 'warm' | 'alert';
  icon: React.ReactNode;
}

function SummaryTile({ label, value, description, tone = 'brand', icon }: SummaryTileProps) {
  const tones = {
    brand: {
      icon: 'bg-brand-100 text-brand-700',
      value: 'text-slate-900',
    },
    warm: {
      icon: 'bg-amber-100 text-amber-700',
      value: 'text-slate-900',
    },
    alert: {
      icon: 'bg-rose-100 text-rose-700',
      value: 'text-rose-700',
    },
  };

  const current = tones[tone];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className={`rounded-2xl p-3 ${current.icon}`} aria-hidden="true">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${current.value}`}>{value}</p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  title: string;
  subtitle: string;
  onClick: () => void;
  primary?: boolean;
  icon: React.ReactNode;
}

function QuickAction({ title, subtitle, onClick, primary = false, icon }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-all ${
        primary
          ? 'border-brand-600 bg-brand-600 text-white shadow-[0_16px_35px_-20px_rgba(13,148,136,0.8)] hover:bg-brand-700'
          : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50/60'
      }`}
    >
      <div className={`rounded-2xl p-3 ${primary ? 'bg-white/15 text-white' : 'bg-brand-50 text-brand-700'}`} aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${primary ? 'text-white' : 'text-slate-900'}`}>{title}</p>
        <p className={`mt-1 text-xs ${primary ? 'text-white/80' : 'text-slate-500'}`}>{subtitle}</p>
      </div>
    </button>
  );
}

export function GestanteDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getDashboardGestante(user.id)
      .then(setData)
      .catch(() => setError('Nao foi possivel carregar os dados. Tente novamente.'))
      .finally(() => setLoading(false));
  }, [user]);

  const firstName = user?.nomeCompleto?.split(' ')[0] ?? 'Gestante';
  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const gestationalLabel = user?.semanasGestacao ? `${user.semanasGestacao} semanas de gestacao` : 'Acompanhamento ativo';

  return (
    <GestanteLayout>
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-brand-600 px-3 py-1.5 text-xs text-white focus:not-sr-only focus:absolute focus:left-3 focus:top-3">
        Pular para conteudo
      </a>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <section className="relative overflow-hidden rounded-[32px] border border-[#f3dfd9] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(255,248,245,0.92)_45%,_rgba(242,251,249,0.96)_100%)] p-5 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.25)] sm:p-6 lg:p-8">
          <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#f8dfd4]/55 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 right-10 h-28 w-28 rounded-full bg-brand-100/60 blur-3xl" aria-hidden="true" />

          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px] xl:items-start">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Seu cuidado hoje
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
                {greeting}, {firstName}
              </h1>
              <p className="mt-2 text-sm capitalize text-slate-500">{todayLabel}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/85 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
                  {gestationalLabel}
                </span>
                <span className="rounded-full bg-white/85 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
                  {data?.relatoMaisRecente ? `Ultimo relato em ${formatDate(data.relatoMaisRecente, { day: 'numeric', month: 'short' })}` : 'Nenhum relato enviado ainda'}
                </span>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
                Organize seu dia com mais clareza: registre sintomas, acompanhe medicamentos e veja rapido se existe alguma orientacao nova da sua equipe.
              </p>
            </div>

            <div className="max-w-[430px] xl:justify-self-end xl:w-full">
              <SemaforoIndicador status={data?.semaforoStatus ?? 'verde'} />
            </div>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickAction
              title="Novo relato"
              subtitle="Registre como voce esta hoje"
              primary
              onClick={() => navigate('/gestante/relatos')}
              icon={(
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            />
            <QuickAction
              title="Exames"
              subtitle="Envie PDFs para revisao"
              onClick={() => navigate('/gestante/exames')}
              icon={(
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v4.125c0 .621-.504 1.125-1.125 1.125H5.625A1.125 1.125 0 014.5 18.375V14.25m3.75-3 3.75-3.75m0 0 3.75 3.75M12 7.5v8.25" />
                </svg>
              )}
            />
            <QuickAction
              title="Medicamentos"
              subtitle="Veja lembretes e controle"
              onClick={() => navigate('/gestante/medicamentos')}
              icon={(
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              )}
            />
            <QuickAction
              title="Assistente IA"
              subtitle="Tire duvidas com fontes oficiais"
              onClick={() => navigate('/gestante/chat-ia')}
              icon={(
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25-4.03 8.25-9 8.25a10.523 10.523 0 01-4.18-.86l-3.82 1.11 1.238-3.303A7.724 7.724 0 012.25 12z" />
                </svg>
              )}
            />
          </div>
        </section>

        {loading ? (
          <div className="mt-8">
            <PageSpinner label="Carregando dashboard..." />
          </div>
        ) : error ? (
          <div role="alert" className="mt-8 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setLoading(true);
                getDashboardGestante(user!.id)
                  .then(setData)
                  .catch(() => setError('Nao foi possivel carregar os dados.'))
                  .finally(() => setLoading(false));
              }}
              className="ml-4 text-xs font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : data && (
          <>
            <section aria-label="Resumo rapido" className="mt-8">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SummaryTile
                  label="Medicamentos ativos"
                  value={data.medicamentosAtivos}
                  description="Prescricoes em uso no seu acompanhamento."
                  tone="brand"
                  icon={(
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  )}
                />
                <SummaryTile
                  label="Relato mais recente"
                  value={data.relatoMaisRecente ? formatDate(data.relatoMaisRecente, { day: 'numeric', month: 'short' }) : '—'}
                  description={data.relatoMaisRecente ? 'Ultimo registro enviado.' : 'Ainda sem relato registrado.'}
                  tone="warm"
                  icon={(
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  )}
                />
                <SummaryTile
                  label="Pendencias do medico"
                  value={data.alertasMedico}
                  description="Resumos com avisos que merecem sua atencao."
                  tone={data.alertasMedico > 0 ? 'alert' : 'brand'}
                  icon={(
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  )}
                />
              </div>
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
              {data.orientacaoMaisRecente ? (
                <Card className="overflow-hidden rounded-[28px] border-[#ede8ff] bg-[linear-gradient(135deg,_rgba(255,255,255,1)_0%,_rgba(250,247,255,1)_100%)]">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-5 pb-4 pt-5">
                    <div className="rounded-2xl bg-[#f2ebff] p-3 text-[#7c3aed]" aria-hidden="true">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800">Orientacao mais recente</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Mensagem importante da sua equipe de cuidado.</p>
                    </div>
                  </div>
                  <CardBody className="pt-5">
                    <p className="text-base leading-7 text-slate-700">{data.orientacaoMaisRecente}</p>
                  </CardBody>
                </Card>
              ) : (
                <Card className="rounded-[28px] border-dashed border-slate-200 bg-white/70">
                  <CardBody className="pt-5">
                    <h2 className="text-sm font-semibold text-slate-800">Sem orientacao nova no momento</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Quando sua equipe adicionar uma nova recomendacao, ela aparecera aqui com destaque.
                    </p>
                  </CardBody>
                </Card>
              )}

              <Card className="rounded-[28px] border-slate-100 bg-white">
                <div className="border-b border-slate-100 px-5 pb-4 pt-5">
                  <h2 className="text-sm font-semibold text-slate-800">Resumo do dia</h2>
                  <p className="mt-1 text-xs text-slate-500">Um painel rapido para orientar suas proximas acoes.</p>
                </div>
                <CardBody className="pt-5">
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prioridade</p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {data.relatoMaisRecente ? 'Manter registros e observar como voce se sente ao longo do dia.' : 'Registrar seu primeiro relato para iniciar o acompanhamento.'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hoje vale lembrar</p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {data.medicamentosAtivos > 0
                          ? `Voce tem ${data.medicamentosAtivos} medicamento(s) ativo(s) para acompanhar.`
                          : 'Sem medicamentos ativos cadastrados no momento.'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Acompanhamento</p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {data.alertasMedico > 0
                          ? `Existem ${data.alertasMedico} aviso(s) em resumos recentes. Vale revisar com calma.`
                          : 'Nenhuma pendencia relevante nos resumos atuais.'}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </section>
          </>
        )}
      </div>
    </GestanteLayout>
  );
}
