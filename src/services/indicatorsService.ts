import { fetchPatients, fetchReportData } from './doctorApi';

export type PeriodoDias = 7 | 30 | 90;

export interface TopGestante {
  id: string;
  patientId: string;
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
  gestantesSemRelato: number;
  gestantesComAltaAtencao: number;
  taxaCoberturaRelatos: number;
  distribuicaoRisco: Array<{ level: 'high' | 'medium' | 'low' | 'none'; label: string; count: number }>;
  relatosPorDia: { data: string; count: number }[];
  topGestantes: TopGestante[];
}

function diasParaPeriodo(periodoEmDias: PeriodoDias): '7d' | '30d' | '90d' {
  if (periodoEmDias === 7) return '7d';
  if (periodoEmDias === 90) return '90d';
  return '30d';
}

export async function getIndicadoresUnidade(periodoEmDias: PeriodoDias): Promise<IndicadoresData> {
  const [patients, report] = await Promise.all([
    fetchPatients(),
    fetchReportData(diasParaPeriodo(periodoEmDias)),
  ]);

  const totalGestantes = patients.length;
  const gestantesComAlerta = report.patientSummary.filter((p) => p.alertCount > 0).length;
  const gestantesSemRelato = report.patientSummary.filter((p) => p.reportCount === 0).length;
  const gestantesComAltaAtencao = report.patientSummary.filter((p) => p.alertLevel === 'high').length;
  const totalRelatos = report.kpi.totalReports;
  const mediaRelatosPorSemana = Number((totalRelatos / (periodoEmDias / 7)).toFixed(1));
  const taxaCoberturaRelatos = totalGestantes > 0
    ? Math.round(((totalGestantes - gestantesSemRelato) / totalGestantes) * 100)
    : 0;

  const distribuicaoRisco = [
    { level: 'high' as const, label: 'Alta atencao', count: report.patientSummary.filter((p) => p.alertLevel === 'high').length },
    { level: 'medium' as const, label: 'Atencao moderada', count: report.patientSummary.filter((p) => p.alertLevel === 'medium').length },
    { level: 'low' as const, label: 'Baixa atencao', count: report.patientSummary.filter((p) => p.alertLevel === 'low').length },
    { level: 'none' as const, label: 'Sem alerta', count: report.patientSummary.filter((p) => p.alertLevel === 'none').length },
  ];

  return {
    totalGestantes,
    gestantesComAlerta,
    percentualComAlerta: totalGestantes > 0 ? Math.round((gestantesComAlerta / totalGestantes) * 100) : 0,
    mediaRelatosPorSemana,
    alertasPendentes: report.kpi.totalAlerts,
    gestantesSemRelato,
    gestantesComAltaAtencao,
    taxaCoberturaRelatos,
    distribuicaoRisco,
    relatosPorDia: report.reportsPerDay.map((item) => ({ data: item.date, count: item.value })),
    topGestantes: [...report.patientSummary]
      .sort((a, b) => {
        if (b.alertCount !== a.alertCount) return b.alertCount - a.alertCount;
        if (b.reportCount !== a.reportCount) return b.reportCount - a.reportCount;
        return a.name.localeCompare(b.name);
      })
      .map((item) => {
        const patient = patients.find((p) => p.id === item.id);
        return {
          id: item.id,
          patientId: item.id,
          nome: item.name,
          semanasGestacao: patient?.gestationalWeeks,
          totalAlertas: item.alertCount,
          totalRelatos: item.reportCount,
          ultimoRegistro: item.lastRecord ?? null,
        };
      }),
  };
}
