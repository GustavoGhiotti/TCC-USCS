import { useState, useEffect } from 'react';
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

// ─── Semáforo de status ───────────────────────────────────────────────────────
interface SemaforoProps {
  status: 'verde' | 'amarelo' | 'vermelho';
}
function SemaforoIndicador({ status }: SemaforoProps) {
  const config = {
    verde: {
      label: 'Status: Estável',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    amarelo: {
      label: 'Status: Atenção',
      dot: 'bg-amber-500',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-700',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    },
    vermelho: {
      label: 'Status: Alerta',
      dot: 'bg-red-500',
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-700',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
    },
  };
  const c = config[status];
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${c.bg} ${c.text}`}
      role="status"
      aria-label={c.label}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} aria-hidden="true" />
      {c.icon}
      {c.label}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: number | string;
  description?: string;
  variant?: 'default' | 'warning' | 'brand';
  icon: React.ReactNode;
}
function KPICard({ label, value, description, variant = 'default', icon }: KPICardProps) {
  const variantMap = {
    default: { bg: 'bg-white', icon: 'bg-slate-100 text-slate-600', val: 'text-slate-900' },
    warning: { bg: 'bg-white', icon: 'bg-red-50   text-red-600',    val: 'text-red-700'   },
    brand:   { bg: 'bg-white', icon: 'bg-brand-50 text-brand-700',  val: 'text-brand-700' },
  };
  const c = variantMap[variant];
  return (
    <div className={`${c.bg} rounded-xl border border-slate-100 shadow-card p-5 flex items-start gap-4`}>
      <div className={`${c.icon} rounded-xl p-3 flex-shrink-0`} aria-hidden="true">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 tabular-nums ${c.val}`}>{value}</p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function GestanteDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getDashboardGestante(user.id)
      .then(setData)
      .catch(() => setError('Não foi possível carregar os dados. Tente novamente.'))
      .finally(() => setLoading(false));
  }, [user]);

  const firstName = user?.nomeCompleto?.split(' ')[0] ?? 'Gestante';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <GestanteLayout>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 bg-brand-600 text-white text-xs px-3 py-1.5 rounded-lg z-50">
        Pular para conteúdo
      </a>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Saudação */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">{todayLabel}</p>
        </div>

        {loading ? (
          <PageSpinner label="Carregando dashboard…" />
        ) : error ? (
          <div role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => { setError(null); setLoading(true); getDashboardGestante(user!.id).then(setData).catch(() => setError('Não foi possível carregar os dados.')).finally(() => setLoading(false)); }}
              className="text-xs font-semibold underline ml-4"
            >
              Tentar novamente
            </button>
          </div>
        ) : data && (
          <>
            {/* KPIs */}
            <section aria-label="Resumo de saúde" className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard
                  label="Medicamentos ativos"
                  value={data.medicamentosAtivos}
                  description="Prescrições em uso"
                  variant="brand"
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  }
                />
                <KPICard
                  label="Relato mais recente"
                  value={data.relatoMaisRecente ? formatDate(data.relatoMaisRecente, { day: 'numeric', month: 'short' }) : '—'}
                  description={data.relatoMaisRecente ? 'Último registro enviado' : 'Nenhum relato ainda'}
                  variant="default"
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  }
                />
                <KPICard
                  label="Pendências do médico"
                  value={data.alertasMedico}
                  description="Resumos com avisos ativos"
                  variant={data.alertasMedico > 0 ? 'warning' : 'default'}
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  }
                />
              </div>
            </section>

            {/* Status + Meu dia */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Status geral */}
              <Card>
                <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-700">Nível de atenção atual</h2>
                </div>
                <CardBody className="pt-4">
                  <SemaforoIndicador status={data.semaforoStatus} />
                  <p className="mt-3 text-xs text-slate-400">
                    Calculado com base no seu último resumo de IA. Revisado pelo médico responsável.
                  </p>
                </CardBody>
              </Card>

              {/* Meu dia — CTAs */}
              <Card>
                <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-700">Meu dia</h2>
                </div>
                <CardBody className="pt-4 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/gestante/relatos')}
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 active:scale-95 transition-all shadow-sm"
                    aria-label="Registrar novo relato diário"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Novo relato
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/gestante/medicamentos')}
                      className="px-3 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-brand-300 hover:text-brand-700 transition-colors"
                    >
                      Medicamentos
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/gestante/resumos-ia')}
                      className="px-3 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-brand-300 hover:text-brand-700 transition-colors"
                    >
                      Resumos IA
                    </button>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Orientação do médico */}
            {data.orientacaoMaisRecente && (
              <section aria-label="Orientação do médico">
                <Card>
                  <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    <h2 className="text-sm font-semibold text-slate-700">Orientação do médico</h2>
                  </div>
                  <CardBody className="pt-4">
                    <p className="text-sm text-slate-700 leading-relaxed">{data.orientacaoMaisRecente}</p>
                  </CardBody>
                </Card>
              </section>
            )}
          </>
        )}
      </div>
    </GestanteLayout>
  );
}
