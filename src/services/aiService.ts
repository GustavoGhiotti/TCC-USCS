/**
 * aiService.ts — Serviço de IA "seguro" (mock para demo)
 *
 * REGRAS obrigatórias:
 *  - Nenhum diagnóstico, prescrição ou orientação clínica.
 *  - Apenas agrupa, conta e resume o que foi informado/registrado.
 *  - Disclaimer sempre presente na resposta.
 *
 * TODO backend: POST /ia/resumo  { gestanteId, range, relatos }
 */

import { fetchPatientDetailsBundle } from './doctorApi';

// ─── Disclaimer obrigatório ───────────────────────────────────────────────────
export const DISCLAIMER_IA =
  'Resumo automático para apoiar a revisão do profissional de saúde. ' +
  'Não substitui avaliação clínica nem emite diagnóstico.';

// ─── Interface genérica de entrada ───────────────────────────────────────────
// Compatível com RelatoDiario (domain.ts) e DailyReport (types/doctor.ts)
export interface RelatoInput {
  data: string;
  sintomas?: string[];
  symptoms?: string[];
  humor?: string;
  mood?: string;
  descricao?: string;
  description?: string;
  ocorrencias?: string;
}

// ─── Resultado do resumo ─────────────────────────────────────────────────────
export interface ResumoIAGerado {
  periodoInicio: string;
  periodoFim: string;
  totalRelatos: number;
  sintomasMaisFrequentes: { sintoma: string; count: number }[];
  variacaoHumor: string;
  eventosRelevantes: string[];
  resumoTexto: string;
  disclaimer: string;
  geradoEm: string;
}

// ─── Sintomas que requerem atenção (apenas para agrupamento, sem diagnóstico) ─
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getSintomas(r: RelatoInput): string[] {
  return r.sintomas ?? r.symptoms ?? [];
}

function getHumor(r: RelatoInput): string | undefined {
  return r.humor ?? r.mood;
}

function computeSintomasFrequentes(
  relatos: RelatoInput[],
): { sintoma: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of relatos) {
    for (const s of getSintomas(r)) {
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([sintoma, count]) => ({ sintoma, count }))
    .sort((a, b) => b.count - a.count);
}

function computeVariacaoHumor(relatos: RelatoInput[]): string {
  const counts: Record<string, number> = {};
  for (const r of relatos) {
    const h = getHumor(r);
    if (h) counts[h] = (counts[h] ?? 0) + 1;
  }
  if (Object.keys(counts).length === 0) return 'Sem dados de humor no período';
  const dominante = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const labels: Record<string, string> = {
    feliz: 'Predominantemente positivo',
    normal: 'Estável ao longo do período',
    triste: 'Com episódios de tristeza',
    ansioso: 'Com episódios de ansiedade',
  };
  return labels[dominante] ?? dominante;
}

function computeEventos(relatos: RelatoInput[]): string[] {
  const eventos: string[] = [];
  for (const r of relatos) {
    const sintomas = getSintomas(r);
    const deAtencao = sintomas.filter(s =>
      SINTOMAS_ATENCAO.has(s.toLowerCase()),
    );
    if (deAtencao.length > 0) {
      eventos.push(`${r.data}: ${deAtencao.join(', ')} registrado(s)`);
    }
    const ocorrencia = r.ocorrencias ?? '';
    if (
      ocorrencia.length > 5 &&
      !ocorrencia.toLowerCase().includes('nenhuma')
    ) {
      const trecho = ocorrencia.length > 80
        ? ocorrencia.slice(0, 80) + '…'
        : ocorrencia;
      if (!eventos.some(e => e.startsWith(r.data))) {
        eventos.push(`${r.data}: ${trecho}`);
      }
    }
  }
  return eventos.slice(0, 5);
}

function buildTextoResumo(
  relatos: RelatoInput[],
  topSintomas: { sintoma: string; count: number }[],
  humor: string,
  eventos: string[],
): string {
  if (relatos.length === 0) {
    return 'Nenhum relato encontrado no período selecionado.';
  }

  const partes: string[] = [
    `Foram registrados ${relatos.length} relato${relatos.length > 1 ? 's' : ''} no período analisado.`,
  ];

  const top3 = topSintomas.slice(0, 3);
  if (top3.length > 0) {
    const lista = top3.map(s => `${s.sintoma} (${s.count}×)`).join(', ');
    partes.push(`Sintomas mais frequentes: ${lista}.`);
  } else {
    partes.push('Nenhum sintoma registrado no período.');
  }

  partes.push(`Padrão de humor observado: ${humor}.`);

  if (eventos.length > 0) {
    partes.push(
      `${eventos.length} evento${eventos.length > 1 ? 's' : ''} relevante${eventos.length > 1 ? 's' : ''} ` +
      `identificado${eventos.length > 1 ? 's' : ''} para revisão pelo profissional.`,
    );
  } else {
    partes.push('Nenhum sintoma de atenção identificado nos relatos do período.');
  }

  return partes.join(' ');
}

// ─── Função principal ─────────────────────────────────────────────────────────
export async function generateResumoIA(params: {
  gestanteId: string;
  range: { start: string; end: string };
  relatos: RelatoInput[];
}): Promise<ResumoIAGerado> {
  // Simula processamento assíncrono (substituir por chamada real ao backend)
  await new Promise<void>(r => setTimeout(r, 1200 + Math.random() * 600));

  const { gestanteId, range, relatos } = params;

  // Filtra pelo range
  const filtradosDoParam = relatos.filter(
    r => r.data >= range.start && r.data <= range.end,
  );

  // Fallback: carrega do mock se nenhum relato foi passado no range
  let relatosUsados: RelatoInput[] = filtradosDoParam;
  if (relatosUsados.length === 0) {
    try {
      const detail = await fetchPatientDetailsBundle(gestanteId);
      relatosUsados = detail.reports
        .filter(r => r.date >= range.start && r.date <= range.end)
        .map(r => ({
          data: r.date,
          sintomas: r.symptoms,
          humor: r.mood,
          descricao: r.description,
        }));
    } catch {
      // ignora — resultado com 0 relatos é válido
    }
  }

  const topSintomas = computeSintomasFrequentes(relatosUsados);
  const humor = computeVariacaoHumor(relatosUsados);
  const eventos = computeEventos(relatosUsados);
  const resumoTexto = buildTextoResumo(relatosUsados, topSintomas, humor, eventos);

  return {
    periodoInicio: range.start,
    periodoFim: range.end,
    totalRelatos: relatosUsados.length,
    sintomasMaisFrequentes: topSintomas.slice(0, 5),
    variacaoHumor: humor,
    eventosRelevantes: eventos,
    resumoTexto,
    disclaimer: DISCLAIMER_IA,
    geradoEm: new Date().toISOString(),
  };
}
