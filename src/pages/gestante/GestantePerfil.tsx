import { GestanteLayout } from '../../components/layout/GestanteLayout';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';

// ─── Campo de informação ──────────────────────────────────────────────────────
function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm text-slate-900">{value || <span className="text-slate-400">Não informado</span>}</dd>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export function GestantePerfil() {
  const { user } = useAuth();

  if (!user) return null;

  const iniciais = user.nomeCompleto
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? 'G';

  return (
    <GestanteLayout>
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-3">
        <h1 className="text-base font-semibold text-slate-900">Meu perfil</h1>
      </header>

      <div className="px-6 py-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Perfil</h2>
          <p className="text-sm text-slate-400 mt-0.5">Suas informações cadastrais</p>
        </div>

        {/* Avatar + nome */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 font-bold text-xl flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                {iniciais}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{user.nomeCompleto}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info">Gestante</Badge>
                  {user.semanasGestacao && (
                    <Badge variant="success">{user.semanasGestacao} semanas</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Dados básicos */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-700">Dados pessoais</h3>
            <span className="text-xs text-slate-400 font-normal">Somente leitura</span>
          </CardHeader>
          <CardBody className="pt-2">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoField label="Nome completo" value={user.nomeCompleto} />
              <InfoField label="E-mail" value={user.email} />
              <InfoField
                label="Semanas de gestação"
                value={user.semanasGestacao ? `${user.semanasGestacao} semanas` : undefined}
              />
              <InfoField label="Perfil de acesso" value="Gestante" />
            </dl>
          </CardBody>
        </Card>

        {/* Preferências — placeholder */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-700">Preferências</h3>
            <Badge variant="neutral">Em breve</Badge>
          </CardHeader>
          <CardBody className="pt-2">
            <div className="space-y-3">
              {[
                { label: 'Notificações por e-mail', desc: 'Receba alertas quando o médico enviar orientações' },
                { label: 'Lembrete de relato diário', desc: 'Notificação para registrar seu relato' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <div
                    className="w-9 h-5 rounded-full bg-slate-200 flex-shrink-0 cursor-not-allowed"
                    aria-label={`${item.label} (em breve)`}
                    title="Disponível em breve"
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              As configurações de notificação estarão disponíveis em uma próxima versão.
            </p>
          </CardBody>
        </Card>
      </div>
    </GestanteLayout>
  );
}
