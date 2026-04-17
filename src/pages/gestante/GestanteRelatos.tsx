import { useEffect, useMemo, useState } from 'react';
import { GestanteLayout } from '../../components/layout/GestanteLayout';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import {
  createRelatoGestante,
  getRelatosGestanteService,
  type PeriodoFiltro,
  type RelatoPayload,
} from '../../services/gestanteService';
import type { RelatoDiario } from '../../types/domain';

const HUMORES: { value: RelatoDiario['humor']; label: string }[] = [
  { value: 'feliz', label: 'Feliz' },
  { value: 'normal', label: 'Normal' },
  { value: 'triste', label: 'Triste' },
  { value: 'ansioso', label: 'Ansioso' },
];

const HUMOR_BADGE: Record<RelatoDiario['humor'], React.ComponentProps<typeof Badge>['variant']> = {
  feliz: 'success',
  normal: 'info',
  triste: 'warning',
  ansioso: 'danger',
};

const SINTOMAS_OPCOES = [
  'Cansaco',
  'Inchaco',
  'Dor nas costas',
  'Azia',
  'Gases',
  'Contracoes',
  'Tontura',
  'Dor de cabeca',
  'Nausea',
  'Insonia',
  'Pressao alta',
  'Edema',
];

const PERIODOS: { value: PeriodoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: '30d', label: 'Ultimos 30 dias' },
  { value: '7d', label: 'Ultimos 7 dias' },
];

interface RelatoFormProps {
  initialValues?: RelatoPayload;
  initialExtraNote?: string;
  saveLabel?: string;
  isEditing?: boolean;
  onSave: (payload: RelatoPayload, extraNote: string) => Promise<void>;
  onCancel: () => void;
}

function RelatoForm({
  initialValues,
  initialExtraNote = '',
  saveLabel = 'Salvar relato',
  isEditing = false,
  onSave,
  onCancel,
}: RelatoFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(initialValues?.data ?? today);
  const [humor, setHumor] = useState<RelatoDiario['humor']>(initialValues?.humor ?? 'normal');
  const [sintomas, setSintomas] = useState<string[]>(initialValues?.sintomas ?? []);
  const [descricao, setDescricao] = useState(initialValues?.descricao ?? '');
  const [extraNote, setExtraNote] = useState(initialExtraNote);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function toggleSintoma(sintoma: string) {
    setSintomas((current) =>
      current.includes(sintoma)
        ? current.filter((item) => item !== sintoma)
        : [...current, sintoma],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      await onSave(
        {
          data,
          humor,
          sintomas,
          descricao,
          notaComplementar: extraNote,
        },
        extraNote,
      );
    } catch {
      setFormError('Erro ao salvar relato. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="relato-data" className="mb-1.5 block text-sm font-medium text-slate-700">
          Data do relato
        </label>
        <input
          id="relato-data"
          type="date"
          value={data}
          max={today}
          onChange={(event) => setData(event.target.value)}
          required
          disabled={isEditing}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30 disabled:bg-slate-50 disabled:text-slate-500"
        />
        {isEditing && (
          <p className="mt-1.5 text-xs text-slate-400">
            A data fica fixa para atualizar o relato do dia sem criar outro registro.
          </p>
        )}
      </div>

      <div className="mb-4">
        <p className="mb-1.5 text-sm font-medium text-slate-700">Como voce esta se sentindo?</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Humor">
          {HUMORES.map((humorOption) => (
            <button
              key={humorOption.value}
              type="button"
              onClick={() => setHumor(humorOption.value)}
              aria-pressed={humor === humorOption.value}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                humor === humorOption.value
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {humorOption.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-1.5 text-sm font-medium text-slate-700">Sintomas apresentados</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sintomas">
          {SINTOMAS_OPCOES.map((sintoma) => (
            <button
              key={sintoma}
              type="button"
              onClick={() => toggleSintoma(sintoma)}
              aria-pressed={sintomas.includes(sintoma)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sintomas.includes(sintoma)
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {sintoma}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="relato-descricao" className="mb-1.5 block text-sm font-medium text-slate-700">
          Descricao livre <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <textarea
          id="relato-descricao"
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          rows={3}
          placeholder="Descreva como foi o seu dia..."
          className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
        />
      </div>

      <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Nota complementar</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Registre algo que voce esqueceu ou que aconteceu depois do envio inicial.
            </p>
          </div>
          {extraNote.trim() && <Badge variant="info">Com nota</Badge>}
        </div>
        <textarea
          value={extraNote}
          onChange={(event) => setExtraNote(event.target.value)}
          rows={3}
          placeholder="Ex.: Depois do relato senti tontura leve no fim da tarde."
          className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
              Salvando...
            </>
          ) : (
            saveLabel
          )}
        </button>
      </div>
    </form>
  );
}

function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 text-sm font-medium text-emerald-700 shadow-modal"
    >
      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
      <button type="button" onClick={onClose} aria-label="Fechar notificacao" className="ml-2 text-emerald-500 hover:text-emerald-700">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

export function GestanteRelatos() {
  const { user } = useAuth();
  const [relatos, setRelatos] = useState<RelatoDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('todos');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRelato, setSelectedRelato] = useState<RelatoDiario | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function loadRelatos() {
    if (!user) return;

    setLoading(true);
    setError(null);

    getRelatosGestanteService(user.id, periodo)
      .then(setRelatos)
      .catch(() => setError('Nao foi possivel carregar os relatos. Tente novamente.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadRelatos, [user, periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(payload: RelatoPayload, extraNote: string) {
    if (!user) return;

    await createRelatoGestante(user.id, { ...payload, notaComplementar: extraNote });

    setCreateModalOpen(false);
    setToastMessage('Relato registrado com sucesso!');
    loadRelatos();
  }

  async function handleUpdate(payload: RelatoPayload, extraNote: string) {
    if (!user || !selectedRelato) return;

    await createRelatoGestante(user.id, { ...payload, notaComplementar: extraNote });
    setSelectedRelato(null);
    setToastMessage('Relato atualizado com sucesso!');
    loadRelatos();
  }

  function openRelato(relato: RelatoDiario) {
    setSelectedRelato(relato);
  }

  const filtered = useMemo(() => relatos, [relatos]);

  return (
    <GestanteLayout>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/90 px-6 py-3 backdrop-blur">
        <h1 className="text-base font-semibold text-slate-900">Meus relatos</h1>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95"
          aria-label="Registrar novo relato"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo relato
        </button>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Historico de relatos</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Clique em um relato para abrir os detalhes, corrigir informacoes ou adicionar uma nota complementar.
          </p>
        </div>

        <div role="tablist" aria-label="Filtrar por periodo" className="mb-6 flex flex-wrap gap-2">
          {PERIODOS.map((periodOption) => (
            <button
              key={periodOption.value}
              role="tab"
              type="button"
              aria-selected={periodo === periodOption.value}
              onClick={() => setPeriodo(periodOption.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                periodo === periodOption.value
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {periodOption.label}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSpinner label="Carregando relatos..." />
        ) : error ? (
          <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={loadRelatos} className="ml-4 text-xs font-semibold underline">
              Tentar novamente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <svg className="mx-auto mb-3 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm text-slate-400">Nenhum relato encontrado para o periodo selecionado.</p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Registrar meu primeiro relato →
              </button>
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
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Humor</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Sintomas</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Descricao</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Acao</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((relato) => {
                        const extraNote = relato.notaComplementar ?? '';

                        return (
                          <tr
                            key={relato.id}
                            tabIndex={0}
                            role="button"
                            onClick={() => openRelato(relato)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                openRelato(relato);
                              }
                            }}
                            className="cursor-pointer transition-colors hover:bg-slate-50/70 focus:bg-brand-50/60 focus:outline-none"
                          >
                            <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-800">
                              {formatDate(relato.data)}
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge variant={HUMOR_BADGE[relato.humor]}>
                                {relato.humor.charAt(0).toUpperCase() + relato.humor.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-wrap gap-1">
                                {relato.sintomas?.slice(0, 3).map((sintoma) => (
                                  <Badge key={sintoma} variant="neutral">
                                    {sintoma}
                                  </Badge>
                                ))}
                                {(relato.sintomas?.length ?? 0) > 3 && (
                                  <Badge variant="neutral">+{(relato.sintomas?.length ?? 0) - 3}</Badge>
                                )}
                                {(!relato.sintomas || relato.sintomas.length === 0) && (
                                  <span className="text-xs text-slate-400">Nenhum</span>
                                )}
                              </div>
                            </td>
                            <td className="max-w-xs px-5 py-3.5 text-slate-500">
                              <div className="max-w-xs">
                                <p className="truncate">{relato.descricao || '—'}</p>
                                {extraNote && (
                                  <p className="mt-1 truncate text-xs text-brand-700">Nota complementar adicionada</p>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                                Abrir
                                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M7.22 4.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L11.94 10 7.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                                </svg>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="space-y-3 sm:hidden">
              {filtered.map((relato) => {
                const extraNote = relato.notaComplementar ?? '';

                return (
                  <button
                    key={relato.id}
                    type="button"
                    onClick={() => openRelato(relato)}
                    className="block w-full text-left"
                  >
                    <Card hoverable>
                      <CardBody>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800">{formatDate(relato.data)}</span>
                          <Badge variant={HUMOR_BADGE[relato.humor]}>
                            {relato.humor.charAt(0).toUpperCase() + relato.humor.slice(1)}
                          </Badge>
                        </div>

                        {relato.descricao && (
                          <p className="mb-2 line-clamp-2 text-sm text-slate-500">{relato.descricao}</p>
                        )}

                        {relato.sintomas && relato.sintomas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {relato.sintomas.slice(0, 4).map((sintoma) => (
                              <Badge key={sintoma} variant="neutral">
                                {sintoma}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-brand-700">Toque para abrir</span>
                          {extraNote && <Badge variant="info">Com nota</Badge>}
                        </div>
                      </CardBody>
                    </Card>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Novo relato diario"
        maxWidth="max-w-xl"
      >
        <RelatoForm onSave={handleCreate} onCancel={() => setCreateModalOpen(false)} />
      </Modal>

      <Modal
        isOpen={selectedRelato !== null}
        onClose={() => setSelectedRelato(null)}
        title="Detalhes do relato"
        maxWidth="max-w-2xl"
      >
        {selectedRelato && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(selectedRelato.data)}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Ajuste o relato do dia e adicione uma nota com o que aconteceu depois.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={HUMOR_BADGE[selectedRelato.humor]}>
                    {selectedRelato.humor.charAt(0).toUpperCase() + selectedRelato.humor.slice(1)}
                  </Badge>
                  {selectedRelato.notaComplementar && <Badge variant="info">Nota complementar salva</Badge>}
                </div>
              </div>
            </section>

            <RelatoForm
              initialValues={{
                data: selectedRelato.data,
                humor: selectedRelato.humor,
                sintomas: selectedRelato.sintomas,
                descricao: selectedRelato.descricao,
              }}
              initialExtraNote={selectedRelato.notaComplementar ?? ''}
              saveLabel="Salvar alteracoes"
              isEditing
              onSave={handleUpdate}
              onCancel={() => setSelectedRelato(null)}
            />
          </div>
        )}
      </Modal>

      {toastMessage && <SuccessToast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </GestanteLayout>
  );
}
