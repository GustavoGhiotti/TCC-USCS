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
  const totalRelatos = report.kpi.totalReports;
  const mediaRelatosPorSemana = Number((totalRelatos / (periodoEmDias / 7)).toFixed(1));

  return {
    totalGestantes,
    gestantesComAlerta,
    percentualComAlerta: totalGestantes > 0 ? Math.round((gestantesComAlerta / totalGestantes) * 100) : 0,
    mediaRelatosPorSemana,
    alertasPendentes: report.kpi.totalAlerts,
    relatosPorDia: report.reportsPerDay.map((item) => ({ data: item.date, count: item.value })),
    topGestantes: report.patientSummary.map((item) => {
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
