import { useState, useEffect, useMemo } from 'react';
import { GestanteLayout } from '../../components/layout/GestanteLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import {
  getRelatosGestanteService,
  createRelatoGestante,
  type PeriodoFiltro,
  type RelatoPayload,
} from '../../services/gestanteService';
import type { RelatoDiario } from '../../types/domain';

// ─── Constantes ───────────────────────────────────────────────────────────────
const HUMORES: { value: RelatoDiario['humor']; label: string }[] = [
  { value: 'feliz',    label: 'Feliz'    },
  { value: 'normal',   label: 'Normal'   },
  { value: 'triste',   label: 'Triste'   },
  { value: 'ansioso',  label: 'Ansioso'  },
];

const HUMOR_BADGE: Record<RelatoDiario['humor'], React.ComponentProps<typeof Badge>['variant']> = {
  feliz:   'success',
  normal:  'info',
  triste:  'warning',
  ansioso: 'danger',
};

const SINTOMAS_OPCOES = [
  'Cansaço',
  'Inchaço',
  'Dor nas costas',
  'Azia',
  'Gases',
  'Contrações',
  'Tontura',
  'Dor de cabeça',
  'Náusea',
  'Insônia',
  'Pressão alta',
  'Edema',
];

const PERIODOS: { value: PeriodoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: '30d',   label: 'Últimos 30 dias' },
  { value: '7d',    label: 'Últimos 7 dias'  },
];

// ─── Formulário de novo relato ────────────────────────────────────────────────
interface NovoRelatoFormProps {
  onSave: (payload: RelatoPayload) => Promise<void>;
  onCancel: () => void;
}
function NovoRelatoForm({ onSave, onCancel }: NovoRelatoFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData]         = useState(today);
  const [humor, setHumor]       = useState<RelatoDiario['humor']>('normal');
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [descricao, setDescricao] = useState('');
  const [sinaisVitais, setSinaisVitais] = useState({
    pressaoSistolica: '',
    pressaoDiastolica: '',
    frequenciaCardiaca: '',
    saturacaoOxigenio: '',
    pesoKg: '',
    temperaturaC: '',
  });
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function toggleSintoma(s: string) {
    setSintomas(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await onSave({
        data,
        humor,
        sintomas,
        descricao,
        sinaisVitais: Object.values(sinaisVitais).some(Boolean)
          ? {
              pressaoSistolica: sinaisVitais.pressaoSistolica ? Number(sinaisVitais.pressaoSistolica) : undefined,
              pressaoDiastolica: sinaisVitais.pressaoDiastolica ? Number(sinaisVitais.pressaoDiastolica) : undefined,
              frequenciaCardiaca: sinaisVitais.frequenciaCardiaca ? Number(sinaisVitais.frequenciaCardiaca) : undefined,
              saturacaoOxigenio: sinaisVitais.saturacaoOxigenio ? Number(sinaisVitais.saturacaoOxigenio) : undefined,
              pesoKg: sinaisVitais.pesoKg ? Number(sinaisVitais.pesoKg) : undefined,
              temperaturaC: sinaisVitais.temperaturaC ? Number(sinaisVitais.temperaturaC) : undefined,
            }
          : undefined,
      });
    } catch {
      setFormError('Erro ao salvar relato. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {formError}
        </div>
      )}

      {/* Data */}
      <div className="mb-4">
        <label htmlFor="relato-data" className="block text-sm font-medium text-slate-700 mb-1.5">
          Data do relato
        </label>
        <input
          id="relato-data"
          type="date"
          value={data}
          max={today}
          onChange={e => setData(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-500 transition-colors"
        />
      </div>

      {/* Humor */}
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-700 mb-1.5">Como você está se sentindo?</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Humor">
          {HUMORES.map(h => (
            <button
              key={h.value}
              type="button"
              onClick={() => setHumor(h.value)}
              aria-pressed={humor === h.value}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                humor === h.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sintomas */}
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-700 mb-1.5">Sintomas apresentados</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sintomas">
          {SINTOMAS_OPCOES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSintoma(s)}
              aria-pressed={sintomas.includes(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sintomas.includes(s)
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Descrição */}
      <div className="mb-6">
        <label htmlFor="relato-descricao" className="block text-sm font-medium text-slate-700 mb-1.5">
          Descrição livre <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <textarea
          id="relato-descricao"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          rows={3}
          placeholder="Descreva como foi o seu dia…"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-500 transition-colors"
        />
      </div>

      {/* Ações */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-sm font-medium text-slate-700 mb-3">Sinais vitais <span className="text-slate-400 font-normal">(opcional)</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="relato-pa-sis" className="block text-xs font-medium text-slate-600 mb-1">PA sistólica (mmHg)</label>
            <input id="relato-pa-sis" type="number" min={50} max={250} value={sinaisVitais.pressaoSistolica} onChange={e => setSinaisVitais(prev => ({ ...prev, pressaoSistolica: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white" placeholder="ex: 120" />
          </div>
          <div>
            <label htmlFor="relato-pa-dia" className="block text-xs font-medium text-slate-600 mb-1">PA diastólica (mmHg)</label>
            <input id="relato-pa-dia" type="number" min={30} max={150} value={sinaisVitais.pressaoDiastolica} onChange={e => setSinaisVitais(prev => ({ ...prev, pressaoDiastolica: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white" placeholder="ex: 80" />
          </div>
          <div>
            <label htmlFor="relato-fc" className="block text-xs font-medium text-slate-600 mb-1">Frequência cardíaca (bpm)</label>
            <input id="relato-fc" type="number" min={30} max={220} value={sinaisVitais.frequenciaCardiaca} onChange={e => setSinaisVitais(prev => ({ ...prev, frequenciaCardiaca: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white" placeholder="ex: 80" />
          </div>
          <div>
            <label htmlFor="relato-o2" className="block text-xs font-medium text-slate-600 mb-1">Oxigenação (%)</label>
            <input id="relato-o2" type="number" min={70} max={100} value={sinaisVitais.saturacaoOxigenio} onChange={e => setSinaisVitais(prev => ({ ...prev, saturacaoOxigenio: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white" placeholder="ex: 98" />
          </div>
          <div>
            <label htmlFor="relato-peso" className="block text-xs font-medium text-slate-600 mb-1">Peso (kg)</label>
            <input id="relato-peso" type="number" min={30} max={250} step="0.1" value={sinaisVitais.pesoKg} onChange={e => setSinaisVitais(prev => ({ ...prev, pesoKg: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white" placeholder="ex: 68.5" />
          </div>
          <div>
            <label htmlFor="relato-temp" className="block text-xs font-medium text-slate-600 mb-1">Temperatura (°C)</label>
            <input id="relato-temp" type="number" min={34} max={42} step="0.1" value={sinaisVitais.temperaturaC} onChange={e => setSinaisVitais(prev => ({ ...prev, temperaturaC: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white" placeholder="ex: 36.5" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
              Salvando…
            </>
          ) : (
            'Salvar relato'
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Toast de sucesso ─────────────────────────────────────────────────────────
function SuccessToast({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-emerald-200 text-emerald-700 rounded-xl shadow-modal px-5 py-3.5 text-sm font-medium"
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Relato registrado com sucesso!
      <button type="button" onClick={onClose} aria-label="Fechar notificação" className="ml-2 text-emerald-500 hover:text-emerald-700">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function GestanteRelatos() {
  const { user } = useAuth();

  const [relatos, setRelatos]   = useState<RelatoDiario[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [periodo, setPeriodo]   = useState<PeriodoFiltro>('todos');
  const [isModalOpen, setModalOpen] = useState(false);
  const [showToast, setShowToast]   = useState(false);

  function loadRelatos() {
    if (!user) return;
    setLoading(true);
    getRelatosGestanteService(user.id, periodo)
      .then(setRelatos)
      .catch(() => setError('Não foi possível carregar os relatos. Tente novamente.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadRelatos, [user, periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(payload: RelatoPayload) {
    await createRelatoGestante(user!.id, payload);
    setModalOpen(false);
    setShowToast(true);
    loadRelatos();
  }

  const filtered = useMemo(() => relatos, [relatos]);

  return (
    <GestanteLayout>
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-3 flex items-center justify-between gap-4">
        <h1 className="text-base font-semibold text-slate-900">Meus relatos</h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 active:scale-95 transition-all shadow-sm"
          aria-label="Registrar novo relato"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo relato
        </button>
      </header>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Saudação */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Histórico de relatos</h2>
          <p className="text-sm text-slate-400 mt-0.5">Acompanhe todos os seus registros diários</p>
        </div>

        {/* Filtros de período */}
        <div
          role="tablist"
          aria-label="Filtrar por período"
          className="flex gap-2 flex-wrap mb-6"
        >
          {PERIODOS.map(p => (
            <button
              key={p.value}
              role="tab"
              type="button"
              aria-selected={periodo === p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                periodo === p.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {loading ? (
          <PageSpinner label="Carregando relatos…" />
        ) : error ? (
          <div role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={loadRelatos} className="text-xs font-semibold underline ml-4">
              Tentar novamente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <svg className="w-10 h-10 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm text-slate-400">Nenhum relato encontrado para o período selecionado.</p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Registrar meu primeiro relato →
              </button>
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
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Humor</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sintomas</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                            {formatDate(r.data)}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={HUMOR_BADGE[r.humor]}>
                              {r.humor.charAt(0).toUpperCase() + r.humor.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {r.sintomas?.slice(0, 3).map(s => (
                                <Badge key={s} variant="neutral">{s}</Badge>
                              ))}
                              {(r.sintomas?.length ?? 0) > 3 && (
                                <Badge variant="neutral">+{(r.sintomas?.length ?? 0) - 3}</Badge>
                              )}
                              {(!r.sintomas || r.sintomas.length === 0) && (
                                <span className="text-slate-400 text-xs">Nenhum</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 max-w-xs">
                            <p className="truncate">{r.descricao || '—'}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Cards — mobile */}
            <div className="sm:hidden space-y-3">
              {filtered.map(r => (
                <Card key={r.id} hoverable>
                  <CardBody>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-800">{formatDate(r.data)}</span>
                      <Badge variant={HUMOR_BADGE[r.humor]}>
                        {r.humor.charAt(0).toUpperCase() + r.humor.slice(1)}
                      </Badge>
                    </div>
                    {r.descricao && (
                      <p className="text-sm text-slate-500 mb-2 line-clamp-2">{r.descricao}</p>
                    )}
                    {r.sintomas && r.sintomas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {r.sintomas.slice(0, 4).map(s => (
                          <Badge key={s} variant="neutral">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal — novo relato */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo relato diário"
        maxWidth="max-w-xl"
      >
        <NovoRelatoForm
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Toast de sucesso */}
      {showToast && <SuccessToast onClose={() => setShowToast(false)} />}
    </GestanteLayout>
  );
}
