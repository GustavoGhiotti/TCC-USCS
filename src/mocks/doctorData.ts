import api from '../services/api';
import type {
  Patient,
  DailyReport,
  Medication,
  MedicalRecord,
  AssistantSummary,
  TimelineEvent,
  KPIData,
} from '../types/doctor';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export let mockPatients: Patient[] = [];
export let mockReports: DailyReport[] = [];
export let mockMedications: Medication[] = [];
export let mockMedicalRecords: MedicalRecord[] = [];
export let mockSummaries: Record<string, AssistantSummary> = {};
export let mockTimeline: Record<string, TimelineEvent[]> = {};
export let mockKPI: KPIData = { newReportsToday: 0, pendingAlerts: 0, activePatients: 0 };

function asPatient(raw: any): Patient {
  return {
    id: raw.id,
    name: raw.name,
    cpf: raw.cpf,
    age: raw.age,
    gestationalWeeks: raw.gestationalWeeks,
    gestationalDays: raw.gestationalDays,
    lastReportDate: raw.lastReportDate,
    alertLevel: raw.alertLevel,
    alertFlags: raw.alertFlags ?? [],
    isActive: raw.isActive ?? true,
    dueDate: raw.dueDate,
    phone: raw.phone,
    address: raw.address,
    bloodType: raw.bloodType,
    firstAppointmentDate: raw.firstAppointmentDate,
  };
}

export async function fetchPatients(): Promise<Patient[]> {
  const { data } = await api.get('/medicos/pacientes');
  mockPatients = (data ?? []).map(asPatient);
  return [...mockPatients];
}

export async function fetchPatient(id: string): Promise<Patient | undefined> {
  if (mockPatients.length === 0) await fetchPatients();
  return mockPatients.find((p) => p.id === id);
}

export async function fetchReports(patientId: string): Promise<DailyReport[]> {
  const { data } = await api.get(`/medicos/pacientes/${patientId}/detalhe`);
  mockReports = data?.reports ?? [];
  return [...mockReports];
}

export async function fetchMedications(patientId: string): Promise<Medication[]> {
  const { data } = await api.get(`/medicos/pacientes/${patientId}/detalhe`);
  mockMedications = data?.medications ?? [];
  return [...mockMedications];
}

export async function fetchMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
  const { data } = await api.get(`/medicos/pacientes/${patientId}/detalhe`);
  mockMedicalRecords = data?.medicalRecords ?? [];
  return [...mockMedicalRecords];
}

export async function fetchSummary(patientId: string): Promise<AssistantSummary | undefined> {
  const { data } = await api.get(`/medicos/pacientes/${patientId}/detalhe`);
  if (data?.summary) {
    mockSummaries[patientId] = data.summary as AssistantSummary;
    return data.summary as AssistantSummary;
  }
  return undefined;
}

export async function fetchTimeline(patientId: string): Promise<TimelineEvent[]> {
  const { data } = await api.get(`/medicos/pacientes/${patientId}/detalhe`);
  mockTimeline[patientId] = data?.timeline ?? [];
  return [...(mockTimeline[patientId] ?? [])];
}

export async function fetchKPI(): Promise<KPIData> {
  const { data } = await api.get('/medicos/kpi');
  mockKPI = {
    newReportsToday: data?.newReportsToday ?? 0,
    pendingAlerts: data?.pendingAlerts ?? 0,
    activePatients: data?.activePatients ?? 0,
  };
  return { ...mockKPI };
}

export async function addMedication(med: Omit<Medication, 'id'>): Promise<Medication> {
  await delay(200);
  const { data } = await api.post('/medicamentos', {
    gestanteId: med.patientId,
    nome: med.name,
    dosagem: med.dose,
    frequencia: med.frequency,
    dataInicio: med.startDate,
    dataFim: med.endDate ?? null,
    ativo: med.isActive,
    observacoes: med.notes ?? '',
  });

  return {
    id: data.id,
    patientId: data.gestanteId,
    name: data.nome,
    dose: data.dosagem,
    frequency: data.frequencia,
    duration: med.duration,
    startDate: data.dataInicio ?? med.startDate,
    endDate: data.dataFim,
    notes: data.observacoes,
    isActive: data.ativo,
    prescribedBy: med.prescribedBy,
  };
}

export async function addMedicalRecord(rec: Omit<MedicalRecord, 'id'>): Promise<MedicalRecord> {
  const { data } = await api.post('/prontuarios', {
    gestanteId: rec.patientId,
    data: rec.date.split('T')[0],
    descricao: rec.summary,
    medicamentosPrescritos: [],
    acoesRealizadas: rec.actions.join(' | '),
    medicoId: rec.doctorId,
  });

  return {
    id: data.id,
    patientId: data.gestanteId,
    date: `${data.data}T00:00:00.000Z`,
    summary: data.descricao,
    actions: [data.acoesRealizadas],
    nextAppointment: rec.nextAppointment,
    doctorId: rec.doctorId,
    doctorName: rec.doctorName,
  };
}

export async function fetchAvailablePatients(): Promise<Pick<Patient, 'id' | 'name' | 'cpf' | 'age'>[]> {
  const all = await fetchPatients();
  return all.map((p) => ({ id: p.id, name: p.name, cpf: p.cpf, age: p.age }));
}
