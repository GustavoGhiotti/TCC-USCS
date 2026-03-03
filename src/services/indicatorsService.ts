/**
 * indicatorsService.ts — Indicadores agregados da unidade
 *
 * Calcula métricas quantitativas a partir dos dados mock (relatos + gestantes).
 * Funções puras facilitam testes unitários (Vitest).
 *
 * TODO backend: GET /indicadores?periodo=30  → retorna IndicadoresData
 */

import { getAllGestantes, getRelatos } from './apiMock';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type PeriodoDias = 7 | 30 | 90;

export interface TopGestante {
  id: string;
  patientId: string; // mapeado para IDs do doctorData (p1, p2…)
  nome: string;
  semanasGestacao?: number;
  totalAlertas: number;
  totalRelatos: number;
  ultimoRegistro: string | null;
}

export interface IndicadoresData {
  totalGestantes: number;
  gestantesComAlerta: number;
  percentualComAlerta: number;
  mediaRelatosPorSemana: number;
  alertasPendentes: number;
  relatosPorDia: { data: string; count: number }[];
  topGestantes: TopGestante[];
}

// ─── Mapeamento ID gestante → ID patient (doctorData) ─────────────────────────
const GESTANTE_TO_PATIENT: Record<string, string> = {
  '1': 'p1',
  '2': 'p2',
  '3': 'p3',
  '4': 'p4',
};

// ─── Sintomas que indicam necessidade de atenção (sem diagnóstico) ─────────────
const SINTOMAS_ATENCAO = new Set([
  'pressão alta',
  'contrações',
  'edema severo',
  'tontura',
  'sangramento',
  'cefaleia intensa',
  'visão turva',
  'convulsão',
]);

// ─── Funções puras (testáveis) ────────────────────────────────────────────────
export function isRelatoDeAtencao(relato: { sintomas?: string[]; ocorrencias?: string }): boolean {
  const temSintoma = (relato.sintomas ?? []).some(s =>
    SINTOMAS_ATENCAO.has(s.toLowerCase()),
  );
  const temOcorrencia =
    relato.ocorrencias != null &&
    relato.ocorrencias.length > 5 &&
    !relato.ocorrencias.toLowerCase().includes('nenhuma');
  return temSintoma || temOcorrencia;
}

export function calcMediaRelatosPorSemana(
  totalRelatos: number,
  periodoEmDias: number,
): number {
  const semanas = periodoEmDias / 7;
  if (semanas <= 0) return 0;
  return Math.round((totalRelatos / semanas) * 10) / 10;
}

export function dataLimitePeriodo(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().split('T')[0];
}

export function agruparRelatosPorDia(
  relatos: { data: string }[],
  dataInicio: string,
): { data: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of relatos) {
    if (r.data >= dataInicio) {
      counts[r.data] = (counts[r.data] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([data, count]) => ({ data, count }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

// ─── Função principal ─────────────────────────────────────────────────────────
export async function getIndicadoresUnidade(
  periodoEmDias: PeriodoDias,
): Promise<IndicadoresData> {
  // Simula latência de rede
  await new Promise<void>(r => setTimeout(r, 400));

  const dataInicio = dataLimitePeriodo(periodoEmDias);
  const gestantes = await getAllGestantes();

  // Carrega relatos de cada gestante em paralelo
  const relatosPorGestante = await Promise.all(
    gestantes.map(async g => {
      const todos = await getRelatos(g.id);
      const noPeriodo = todos.filter(r => r.data >= dataInicio);
      return { gestante: g, relatos: noPeriodo };
    }),
  );

  // ── Métricas globais ──────────────────────────────────────────────────────
  const totalGestantes = gestantes.length;

  const gestantesComAlerta = relatosPorGestante.filter(({ relatos }) =>
    relatos.some(isRelatoDeAtencao),
  ).length;

  const percentualComAlerta =
    totalGestantes > 0
      ? Math.round((gestantesComAlerta / totalGestantes) * 100)
      : 0;

  const totalRelatos = relatosPorGestante.reduce(
    (sum, { relatos }) => sum + relatos.length,
    0,
  );

  const mediaRelatosPorSemana = calcMediaRelatosPorSemana(
    totalRelatos,
    periodoEmDias,
  );

  const alertasPendentes = relatosPorGestante.reduce(
    (sum, { relatos }) => sum + relatos.filter(isRelatoDeAtencao).length,
    0,
  );

  // ── Relatos por dia (para gráfico) ────────────────────────────────────────
  const todosRelatos = relatosPorGestante.flatMap(({ relatos }) => relatos);
  const relatosPorDia = agruparRelatosPorDia(todosRelatos, dataInicio);

  // ── Top gestantes com mais eventos de atenção ─────────────────────────────
  const topGestantes: TopGestante[] = relatosPorGestante
    .map(({ gestante, relatos }) => {
      const ultimoRegistro =
        relatos.length > 0
          ? relatos.reduce(
              (latest, r) => (r.data > latest ? r.data : latest),
              relatos[0].data,
            )
          : null;
      return {
        id: gestante.id,
        patientId: GESTANTE_TO_PATIENT[gestante.id] ?? gestante.id,
        nome: gestante.nomeCompleto,
        semanasGestacao: gestante.semanasGestacao,
        totalAlertas: relatos.filter(isRelatoDeAtencao).length,
        totalRelatos: relatos.length,
        ultimoRegistro,
      };
    })
    .sort(
      (a, b) => b.totalAlertas - a.totalAlertas || b.totalRelatos - a.totalRelatos,
    );

  return {
    totalGestantes,
    gestantesComAlerta,
    percentualComAlerta,
    mediaRelatosPorSemana,
    alertasPendentes,
    relatosPorDia,
    topGestantes,
  };
}
