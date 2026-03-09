import api from '../services/api';
import type { Alert, AlertNote, AlertsKPI, ReportData, ReportPeriod } from '../types/alerts';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export const mockAlerts: Alert[] = [];
export const mockAlertsKPI: AlertsKPI = {
  pendingToday: 0,
  pendingTotal: 0,
  criticalTotal: 0,
  avgHoursSinceAlert: 0,
};

export async function fetchAlerts(): Promise<Alert[]> {
  const { data } = await api.get('/medicos/alerts');
  mockAlerts.splice(0, mockAlerts.length, ...(data ?? []));
  return [...mockAlerts];
}

export async function fetchAlertsKPI(): Promise<AlertsKPI> {
  const { data } = await api.get('/medicos/alerts/kpi');
  mockAlertsKPI.pendingToday = data?.pendingToday ?? 0;
  mockAlertsKPI.pendingTotal = data?.pendingTotal ?? 0;
  mockAlertsKPI.criticalTotal = data?.criticalTotal ?? 0;
  mockAlertsKPI.avgHoursSinceAlert = data?.avgHoursSinceAlert ?? 0;
  return { ...mockAlertsKPI };
}

export async function fetchReportData(period: ReportPeriod): Promise<ReportData> {
  const { data } = await api.get('/medicos/reports', { params: { period } });
  return data;
}

export async function markAlertReviewed(id: string): Promise<void> {
  await delay(100);
  await api.patch(`/medicos/alerts/${id}/revisar`);
}

export async function addAlertNote(alertId: string, text: string, authorName: string): Promise<AlertNote> {
  const { data } = await api.post(`/medicos/alerts/${alertId}/notes`, { text, authorName });
  return {
    id: data.id,
    text: data.text,
    createdAt: data.createdAt,
    authorName: data.authorName,
  };
}

export type { AlertNote } from '../types/alerts';
