import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DoctorLayout } from '../../components/layout/DoctorLayout';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import {
  createDefaultDoctorProfile,
  getDoctorProfile,
  saveDoctorProfile,
  type DoctorProfessionalProfile,
} from '../../services/doctorProfileService';

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
    />
  );
}

function MultiToggle({
  options,
  values,
  onToggle,
}: {
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function splitCommaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const SERVICE_MODE_OPTIONS = ['Presencial', 'Telemonitoramento', 'Visita hospitalar', 'Ambulatório'];

export function DoctorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfessionalProfile | null>(null);
  const [languagesInput, setLanguagesInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loaded = getDoctorProfile(user);
    setProfile(loaded);
    setLanguagesInput(loaded.languages.join(', '));
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const completion = useMemo(() => {
    if (!profile) return 0;
    const fields = [
      profile.crm,
      profile.crmUf,
      profile.specialty,
      profile.institution,
      profile.professionalPhone,
      profile.city,
      profile.state,
      profile.bio,
    ];
    const filled = fields.filter((field) => field.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  if (!user || !profile) return null;
  const currentUser = user;
  const currentProfile = profile;

  const initials = currentUser.nomeCompleto
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase();

  function update<K extends keyof DoctorProfessionalProfile>(key: K, value: DoctorProfessionalProfile[K]) {
    setProfile((current) => current ? { ...current, [key]: value } : current);
  }

  function toggleServiceMode(value: string) {
    update(
      'serviceModes',
      currentProfile.serviceModes.includes(value)
        ? currentProfile.serviceModes.filter((item) => item !== value)
        : [...currentProfile.serviceModes, value],
    );
  }

  function handleSave() {
    const normalized: DoctorProfessionalProfile = {
      ...currentProfile,
      displayName: currentProfile.displayName.trim() || currentUser.nomeCompleto,
      professionalEmail: currentProfile.professionalEmail.trim() || currentUser.email,
      languages: splitCommaList(languagesInput),
    };
    const saved = saveDoctorProfile(currentUser, normalized);
    setProfile(saved);
    setLanguagesInput(saved.languages.join(', '));
    setToast('Perfil profissional salvo.');
  }

  function handleReset() {
    const fallback = createDefaultDoctorProfile(currentUser);
    setProfile(fallback);
    setLanguagesInput(fallback.languages.join(', '));
  }

  return (
    <DoctorLayout>
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-6 py-3 backdrop-blur">
        <h1 className="text-base font-semibold text-slate-900">Perfil profissional</h1>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Perfil do médico</h2>
            <p className="mt-1 text-sm text-slate-400">
              Espaço pessoal para registrar especialidade, instituição e dados profissionais da atuação.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">Completo {completion}%</Badge>
            {currentProfile.updatedAt && (
              <Badge variant="neutral">Atualizado em {formatDate(currentProfile.updatedAt, { day: '2-digit', month: '2-digit' })}</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardBody className="pt-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-slate-900">{currentProfile.displayName || currentUser.nomeCompleto}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="info">Médico</Badge>
                      {currentProfile.specialty && <Badge variant="success">{currentProfile.specialty}</Badge>}
                      {currentProfile.institution && <Badge variant="neutral">{currentProfile.institution}</Badge>}
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Use este perfil para consolidar seus dados profissionais e a instituição vinculada ao acompanhamento.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Dados profissionais</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Baseado em campos úteis de cadastro profissional e vínculo assistencial.</p>
                </div>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <Field label="Nome de exibição" hint="Como seu nome aparecerá em contextos profissionais do sistema.">
                  <Input value={currentProfile.displayName} onChange={(value) => update('displayName', value)} placeholder="Dr(a). Nome Sobrenome" />
                </Field>
                <Field label="Especialidade principal">
                  <Input value={currentProfile.specialty} onChange={(value) => update('specialty', value)} placeholder="Obstetrícia" />
                </Field>
                <Field label="CRM">
                  <Input value={currentProfile.crm} onChange={(value) => update('crm', value)} placeholder="123456" />
                </Field>
                <Field label="UF do CRM">
                  <Input value={currentProfile.crmUf} onChange={(value) => update('crmUf', value.toUpperCase())} placeholder="SP" />
                </Field>
                <Field label="Subespecialidade">
                  <Input value={currentProfile.subspecialty} onChange={(value) => update('subspecialty', value)} placeholder="Medicina fetal, pré-natal de alto risco..." />
                </Field>
                <Field label="Idiomas" hint="Separe por vírgula.">
                  <Input value={languagesInput} onChange={setLanguagesInput} placeholder="Português, Inglês" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Áreas de atuação">
                    <MultiToggle options={SERVICE_MODE_OPTIONS} values={currentProfile.serviceModes} onToggle={toggleServiceMode} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Apresentação profissional" hint="Resumo curto da experiência e foco de atendimento.">
                    <TextArea
                      value={currentProfile.bio}
                      onChange={(value) => update('bio', value)}
                      placeholder="Ex.: Médica obstetra com foco em acompanhamento pré-natal, telemonitoramento e coordenação de cuidado materno."
                      rows={5}
                    />
                  </Field>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Instituição e contato profissional</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Vínculo principal do médico dentro do projeto.</p>
                </div>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <Field label="Instituição / clínica">
                  <Input value={currentProfile.institution} onChange={(value) => update('institution', value)} placeholder="Hospital Materno Infantil" />
                </Field>
                <Field label="Setor / cargo">
                  <Input value={currentProfile.department} onChange={(value) => update('department', value)} placeholder="Pré-natal de alto risco" />
                </Field>
                <Field label="E-mail profissional">
                  <Input value={currentProfile.professionalEmail} onChange={(value) => update('professionalEmail', value)} type="email" placeholder="medico@instituicao.com" />
                </Field>
                <Field label="Telefone profissional">
                  <Input value={currentProfile.professionalPhone} onChange={(value) => update('professionalPhone', value)} placeholder="(11) 99999-9999" />
                </Field>
                <Field label="Cidade">
                  <Input value={currentProfile.city} onChange={(value) => update('city', value)} placeholder="São Paulo" />
                </Field>
                <Field label="UF">
                  <Input value={currentProfile.state} onChange={(value) => update('state', value.toUpperCase())} placeholder="SP" />
                </Field>
              </CardBody>
            </Card>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Salvar perfil
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Restaurar padrão
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-700">Prévia do perfil</h3>
              </CardHeader>
              <CardBody className="pt-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-lg font-semibold text-slate-900">{currentProfile.displayName || currentUser.nomeCompleto}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[currentProfile.specialty, currentProfile.subspecialty].filter(Boolean).join(' • ') || 'Especialidade não informada'}
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p><span className="font-medium text-slate-800">CRM:</span> {currentProfile.crm ? `${currentProfile.crm} ${currentProfile.crmUf}` : 'Não informado'}</p>
                    <p><span className="font-medium text-slate-800">Instituição:</span> {currentProfile.institution || 'Não informada'}</p>
                    <p><span className="font-medium text-slate-800">Contato:</span> {currentProfile.professionalEmail || currentUser.email}</p>
                    <p><span className="font-medium text-slate-800">Cidade/UF:</span> {[currentProfile.city, currentProfile.state].filter(Boolean).join(' / ') || 'Não informado'}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentProfile.serviceModes.map((mode) => (
                      <Badge key={mode} variant="info">{mode}</Badge>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    {currentProfile.bio || 'Adicione uma apresentação profissional para resumir sua atuação clínica e o foco do atendimento.'}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-700">Campos recomendados</h3>
              </CardHeader>
              <CardBody className="pt-2">
                <ul className="space-y-3 text-sm text-slate-600">
                  <li><span className="font-medium text-slate-800">Especialidade e CRM</span> ajudam a identificar a responsabilidade profissional.</li>
                  <li><span className="font-medium text-slate-800">Instituição e setor</span> deixam claro o vínculo assistencial do médico.</li>
                  <li><span className="font-medium text-slate-800">Contato profissional</span> organiza comunicação sem misturar dados pessoais.</li>
                  <li><span className="font-medium text-slate-800">Forma de atuação</span> mostra se o acompanhamento é presencial, ambulatório ou telemonitorado.</li>
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-700">Identidade da conta</h3>
              </CardHeader>
              <CardBody className="pt-2">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nome da conta</dt>
                    <dd className="mt-1 text-slate-900">{currentUser.nomeCompleto}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail de acesso</dt>
                    <dd className="mt-1 text-slate-900">{currentUser.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Perfil</dt>
                    <dd className="mt-1 text-slate-900">Médico</dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-modal">
          {toast}
        </div>
      )}
    </DoctorLayout>
  );
}
