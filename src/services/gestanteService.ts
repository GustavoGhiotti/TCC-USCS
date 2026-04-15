import api from './api';
import type { RelatoDiario, Medicamento, ResumoIA, SemaforoStatus } from '../types/domain';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DashboardData {
  medicamentosAtivos: number;
  relatoMaisRecente: string | null;
  alertasMedico: number;
  semaforoStatus: SemaforoStatus;
  orientacaoMaisRecente: string | null;
}

export type ResumoIAComData = ResumoIA & { gestanteId: string; data: string };

export type PeriodoFiltro = '7d' | '30d' | 'todos';

export interface RelatoPayload {
  data: string;
  humor: RelatoDiario['humor'];
  sintomas: string[];
  descricao: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
// TODO backend: GET /gestantes/:id/dashboard
export async function getDashboardGestante(gestanteId: string): Promise<DashboardData> {
  const [medicamentos, relatos, resumos, orientacoes] = await Promise.all([
    getMedicamentosGestanteService(gestanteId),
    getRelatosGestanteService(gestanteId, 'todos'),
    getResumosIAGestante(gestanteId),
    getOrientacoesGestanteService(),
  ]);

  return {
    medicamentosAtivos: medicamentos.filter(m => m.ativo).length,
    relatoMaisRecente: relatos.length > 0 ? relatos[0].data : null,
    alertasMedico: resumos.filter(r => r.avisos && r.avisos.length > 0).length,
    semaforoStatus: resumos[0]?.semaforo ?? 'verde',
    orientacaoMaisRecente: orientacoes.length > 0 ? orientacoes[0].texto : null,
  };
}

// ─── Relatos ──────────────────────────────────────────────────────────────────
// TODO backend: GET /gestantes/:id/relatos?periodo=7d|30d|todos
export async function getRelatosGestanteService(
  _gestanteId: string,
  periodo: PeriodoFiltro = 'todos',
): Promise<RelatoDiario[]> {
  const { data } = await api.get<Array<{
    id: string;
    gestante_id: string;
    data: string;
    humor: RelatoDiario['humor'];
    sintomas: string[];
    descricao: string | null;
  }>>('/relatos/me', {
    params: { periodo },
  });

  return data.map((r) => ({
    id: r.id,
    gestanteId: r.gestante_id,
    data: r.data,
    humor: r.humor,
    sintomas: r.sintomas ?? [],
    descricao: r.descricao ?? '',
  }));
}

// TODO backend: POST /gestantes/:id/relatos
// Payload esperado: { data, humor, sintomas[], descricao }
export async function createRelatoGestante(
  _gestanteId: string,
  payload: RelatoPayload,
): Promise<RelatoDiario> {
  const { data } = await api.post<{
    id: string;
    gestante_id: string;
    data: string;
    humor: RelatoDiario['humor'];
    sintomas: string[];
    descricao: string | null;
  }>('/relatos', {
    data: payload.data,
    humor: payload.humor,
    sintomas: payload.sintomas,
    descricao: payload.descricao,
  });

  return {
    id: data.id,
    gestanteId: data.gestante_id,
    data: data.data,
    humor: data.humor,
    sintomas: data.sintomas ?? [],
    descricao: data.descricao ?? '',
  };
}

// ─── Medicamentos ─────────────────────────────────────────────────────────────
// TODO backend: GET /gestantes/:id/medicamentos
export async function getMedicamentosGestanteService(_gestanteId: string): Promise<Medicamento[]> {
  const { data } = await api.get<Array<{
    id: string;
    gestanteId: string;
    nome: string;
    dosagem: string;
    frequencia: string;
    dataInicio?: string | null;
    dataPrescricao?: string | null;
    dataFim?: string | null;
    ativo: boolean;
  }>>('/medicamentos/me');

  return data.map((item) => ({
    id: item.id,
    gestanteId: item.gestanteId,
    nome: item.nome,
    dosagem: item.dosagem,
    frequencia: item.frequencia,
    dataInicio: item.dataInicio ?? undefined,
    dataPrescricao: item.dataPrescricao ?? undefined,
    dataFim: item.dataFim ?? null,
    ativo: item.ativo,
  }));
}

// ─── Resumos IA ───────────────────────────────────────────────────────────────
// TODO backend: GET /gestantes/:id/resumos-ia
export async function getResumosIAGestante(_gestanteId: string): Promise<ResumoIAComData[]> {
  const { data } = await api.get<Array<{
    id: string;
    gestanteId: string;
    relatoId: string;
    data: string;
    tipo: 'diario' | 'semanal';
    resumo: string;
    sintomasIdentificados: string[];
    avisos: string[];
    recomendacoes: string;
    semaforo: SemaforoStatus;
    status?: 'pending' | 'approved';
    aprovadoEm?: string | null;
  }>>('/resumos-ia/me');

  return data.map((item) => ({
    ...item,
    sintomasIdentificados: item.sintomasIdentificados ?? [],
    avisos: item.avisos ?? [],
    aprovadoEm: item.aprovadoEm ?? undefined,
  }));
}

// TODO backend: GET /gestantes/:id/resumos-ia/:resumoId
export async function getResumoIAGestanteById(
  gestanteId: string,
  resumoId: string,
): Promise<ResumoIAComData | null> {
  const resumos = await getResumosIAGestante(gestanteId);
  return resumos.find(r => r.id === resumoId) ?? null;
}

interface OrientacaoResumo {
  id: string;
  texto: string;
  data: string;
}

async function getOrientacoesGestanteService(): Promise<OrientacaoResumo[]> {
  const { data } = await api.get<Array<{
    id: string;
    texto: string;
    data: string;
  }>>('/orientacoes/me');

  return data;
}
