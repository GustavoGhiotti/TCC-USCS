import {
  getRelatosGestante,
  createRelato,
  getMedicamentosGestante,
  getResumos,
  getOrientacoes,
} from './apiMock';
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
    getRelatosGestante(gestanteId),
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
  gestanteId: string,
  periodo: PeriodoFiltro = 'todos',
): Promise<RelatoDiario[]> {
  const relatos = await getRelatosGestante(gestanteId);
  if (periodo === 'todos') return relatos;
  const days = periodo === '7d' ? 7 : 30;
  const cutoff = new Date(Date.now() - days * 86_400_000);
  return relatos.filter(r => new Date(r.data) >= cutoff);
}

// TODO backend: POST /gestantes/:id/relatos
// Payload esperado: { data, humor, sintomas[], descricao }
export async function createRelatoGestante(
  gestanteId: string,
  payload: RelatoPayload,
): Promise<RelatoDiario> {
  const relato: RelatoDiario = {
    id: '',
    gestanteId,
    data: payload.data,
    humor: payload.humor,
    sintomas: payload.sintomas,
    descricao: payload.descricao,
  };
  return createRelato(relato);
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
