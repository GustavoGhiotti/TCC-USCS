import {
  getMedicamentosGestante,
  getResumos,
  getOrientacoes,
} from './apiMock';
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
    getMedicamentosGestante(gestanteId),
    getRelatosGestanteService(gestanteId, 'todos'),
    getResumos(gestanteId) as Promise<ResumoIAComData[]>,
    getOrientacoes(gestanteId),
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
  }>('/relatos', payload);

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
export async function getMedicamentosGestanteService(gestanteId: string): Promise<Medicamento[]> {
  return getMedicamentosGestante(gestanteId);
}

// ─── Resumos IA ───────────────────────────────────────────────────────────────
// TODO backend: GET /gestantes/:id/resumos-ia
export async function getResumosIAGestante(gestanteId: string): Promise<ResumoIAComData[]> {
  return getResumos(gestanteId) as Promise<ResumoIAComData[]>;
}

// TODO backend: GET /gestantes/:id/resumos-ia/:resumoId
export async function getResumoIAGestanteById(
  gestanteId: string,
  resumoId: string,
): Promise<ResumoIAComData | null> {
  const resumos = await getResumosIAGestante(gestanteId);
  return resumos.find(r => r.id === resumoId) ?? null;
}
