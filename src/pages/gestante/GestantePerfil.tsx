import { useEffect, useMemo, useState } from 'react';
import { GestanteLayout } from '../../components/layout/GestanteLayout';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import {
  fetchGestanteProfile,
  updateGestanteProfile,
  type GestanteProfile,
} from '../../services/gestanteProfileService';

function InfoField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value || <span className="text-slate-400">Nao informado</span>}</dd>
    </div>
  );
}

function ReadOnlyClinicalField({
  label,
  value,
  helper,
}: {
  label: string;
  value?: React.ReactNode;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value || 'Nao informado'}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

export function GestantePerfil() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<GestanteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    nomeCompleto: '',
    dataNascimento: '',
    telefone: '',
  });

  useEffect(() => {
    fetchGestanteProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          nomeCompleto: data.nome_completo ?? '',
          dataNascimento: data.data_nascimento ?? '',
          telefone: data.telefone ?? '',
        });
      })
      .catch(() => setError('Nao foi possivel carregar seu perfil.'))
      .finally(() => setLoading(false));
  }, []);

  const initials = useMemo(() => {
    const source = profile?.nome_completo ?? user?.nomeCompleto ?? 'Gestante';
    return source
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [profile?.nome_completo, user?.nomeCompleto]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateGestanteProfile({
        nome_completo: form.nomeCompleto.trim(),
        data_nascimento: form.dataNascimento || undefined,
        telefone: form.telefone.trim() || undefined,
      });
      setProfile(updated);
      setSuccess('Dados pessoais atualizados com sucesso.');

      if (user) {
        setUser({
          ...user,
          nomeCompleto: updated.nome_completo,
        });
      }
    } catch {
      setError('Nao foi possivel salvar seus dados. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <GestanteLayout>
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-6 py-3 backdrop-blur">
        <h1 className="text-base font-semibold text-slate-900">Meu perfil</h1>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Perfil</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Dados pessoais para contato e informacoes clinicas organizadas de forma separada.
          </p>
        </div>

        {loading ? (
          <PageSpinner label="Carregando perfil..." />
        ) : error && !profile ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : profile ? (
          <>
            <section className="mb-6 overflow-hidden rounded-[28px] border border-[#e9eef7] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(245,251,250,0.96)_45%,_rgba(248,249,255,0.98)_100%)] p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.25)] sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{profile.nome_completo}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="info">Gestante</Badge>
                      {profile.semanas_gestacao_atual && (
                        <Badge variant="success">{profile.semanas_gestacao_atual} semanas</Badge>
                      )}
                      <Badge variant="neutral">Perfil misto: pessoal + clinico</Badge>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-xl rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-sm text-slate-600 shadow-sm xl:max-w-sm">
                  Dados pessoais podem ser ajustados por voce. Informacoes clinicas e gestacionais ficam protegidas para alteracao pela equipe medica.
                </div>
              </div>
            </section>

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
              <Card className="rounded-[28px]">
                <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-800">Dados pessoais e de contato</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Mantidos pela paciente para garantir comunicacao e identificacao corretas.
                    </p>
                  </div>
                  <div className="w-full sm:w-auto">
                    <Badge variant="success">Voce pode editar</Badge>
                  </div>
                </CardHeader>
                <CardBody className="pt-2">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {success}
                      </div>
                    )}

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                          Nome completo
                        </label>
                        <input
                          id="profile-name"
                          value={form.nomeCompleto}
                          onChange={(event) => setForm((current) => ({ ...current, nomeCompleto: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                        />
                      </div>

                      <div>
                        <label htmlFor="profile-birth" className="mb-1.5 block text-sm font-medium text-slate-700">
                          Data de nascimento
                        </label>
                        <input
                          id="profile-birth"
                          type="date"
                          value={form.dataNascimento}
                          onChange={(event) => setForm((current) => ({ ...current, dataNascimento: event.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                        />
                      </div>

                      <div>
                        <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                          Telefone
                        </label>
                        <input
                          id="profile-phone"
                          value={form.telefone}
                          onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))}
                          placeholder="(00) 00000-0000"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 border-t border-slate-100 pt-5 lg:grid-cols-2">
                      <InfoField label="E-mail da conta" value={user.email} />
                      <InfoField label="Perfil de acesso" value="Gestante" />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                      >
                        {saving ? 'Salvando...' : 'Salvar dados pessoais'}
                      </button>
                    </div>
                  </form>
                </CardBody>
              </Card>

              <div className="space-y-6">
                <Card className="rounded-[28px]">
                  <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-800">Informacoes clinicas e obstetricas</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Dados clinicos devem ser mantidos pela equipe para garantir consistencia assistencial.
                      </p>
                    </div>
                    <div className="w-full sm:w-auto">
                      <Badge variant="warning">Somente medico/equipe</Badge>
                    </div>
                  </CardHeader>
                  <CardBody className="grid gap-3 pt-2">
                    <ReadOnlyClinicalField
                      label="Semanas de gestacao"
                      value={profile.semanas_gestacao_atual ? `${profile.semanas_gestacao_atual} semanas` : undefined}
                      helper="Atualizado de acordo com o acompanhamento gestacional definido pela equipe."
                    />
                    <ReadOnlyClinicalField
                      label="DUM"
                      value={profile.dum ? formatDate(profile.dum, { day: 'numeric', month: 'long', year: 'numeric' }) : undefined}
                      helper="Usada como referencia clinica para calculo gestacional."
                    />
                    <ReadOnlyClinicalField
                      label="DPP"
                      value={profile.dpp ? formatDate(profile.dpp, { day: 'numeric', month: 'long', year: 'numeric' }) : undefined}
                      helper="Estimativa clinica do parto revisada pela equipe."
                    />
                    <ReadOnlyClinicalField
                      label="Tipo sanguineo"
                      value={profile.tipo_sanguineo}
                      helper="Informacao assistencial sensivel mantida em contexto clinico."
                    />
                  </CardBody>
                </Card>

                <Card className="rounded-[28px]">
                  <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-800">Notas clinicas visiveis para voce</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Campo reservado para observacoes estruturadas do acompanhamento.
                      </p>
                    </div>
                    <div className="w-full sm:w-auto">
                      <Badge variant="neutral">Leitura protegida</Badge>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-2">
                    <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                      {profile.observacoes || 'Nenhuma observacao clinica compartilhada no momento.'}
                    </p>
                  </CardBody>
                </Card>
              </div>
            </div>

            <Card className="mt-6 rounded-[28px]">
              <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-800">Como este perfil foi organizado</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Separacao entre identificacao da paciente e dados clinicos do cuidado.
                  </p>
                </div>
              </CardHeader>
              <CardBody className="pt-2">
                <div className="grid gap-4 xl:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">Dados pessoais</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Nome, data de nascimento e telefone ficam com a paciente porque sao dados administrativos e de contato.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">Dados clinicos</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      DUM, DPP, semanas gestacionais e informacoes clinicas devem ser mantidas pela equipe por impacto assistencial.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">Base usada</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      A estrutura segue a linha do US Core Patient Profile para dados demograficos/administrativos e preserva dados obstetricos como informacao clinica.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </>
        ) : null}
      </div>
    </GestanteLayout>
  );
}
