import api from './api';
import type { Alert, AlertsKPI, ReportData, ReportPeriod } from '../types/alerts';
import type {
  AssistantSummary,
  DailyReport,
  KPIData,
  MedicalRecord,
  Medication,
  Patient,
  TimelineEvent,
  VitalSign,
} from '../types/doctor';

type PatientApi = {
  id: string;
  name: string;
  cpf: string;
  age: number;
  gestationalWeeks?: number;
  gestationalDays?: number;
  lastReportDate?: string | null;
  alertLevel: Patient['alertLevel'];
  alertFlags: string[];
  isActive: boolean;
  dueDate?: string | null;
};

type PatientDetailApi = {
  patient: {
    id: string;
    name: string;
    cpf: string;
    age: number;
    gestationalWeeks?: number;
    gestationalDays?: number;
    lastReportDate?: string | null;
    alertLevel: Patient['alertLevel'];
    alertFlags: string[];
    isActive: boolean;
    dueDate?: string | null;
    phone?: string;
    address?: string;
    bloodType?: string;
    firstAppointmentDate?: string | null;
    lastVitals?: {
      id: string;
      patientId: string;
      date: string;
      bloodPressureSystolic: number;
      bloodPressureDiastolic: number;
      heartRate: number;
      oxygenSaturation: number;
      weight?: number;
    } | null;
    vitalsHistory: Patient['vitalsHistory'];
  };
  reports: Array<{
    id: string;
    patientId: string;
    date: string;
    description: string;
    mood: DailyReport['mood'];
    symptoms: string[];
    vitalSigns?: DailyReport['vitalSigns'];
  }>;
  medications: Array<{
    id: string;
    patientId: string;
    name: string;
    dose: string;
    frequency: string;
    duration: string;
    startDate: string;
    endDate?: string | null;
    notes?: string;
    isActive: boolean;
    prescribedBy: string;
  }>;
  medicalRecords: Array<{
    id: string;
    patientId: string;
    date: string;
    summary: string;
    actions: string[];
    nextAppointment?: string | null;
    doctorId: string;
    doctorName: string;
  }>;
  summary: AssistantSummary;
  timeline: TimelineEvent[];
};

type MedicamentoOut = {
  id: string;
  gestanteId: string;
  nome: string;
  dosagem: string;
  frequencia: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  observacoes?: string | null;
  ativo: boolean;
};

type ProntuarioOut = {
  id: string;
  gestanteId: string;
  data: string;
  descricao: string;
  medicamentosPrescritos: string[];
  acoesRealizadas: string;
  medicoId?: string | null;
};

type SinalVitalOut = {
  id: string;
  gestanteId: string;
  data_registro: string;
  pressao_sistolica?: number | null;
  pressao_diastolica?: number | null;
  frequencia_cardiaca?: number | null;
  saturacao_oxigenio?: number | null;
  peso_kg?: number | null;
  temperatura_c?: number | null;
};

type ResumoOut = {
  id: string;
  gestanteId: string;
  relatoId: string;
  data: string;
  tipo: 'diario' | 'semanal';
  semaforo: 'verde' | 'amarelo' | 'vermelho';
  resumo: string;
  sintomasIdentificados: string[];
  avisos: string[];
  recomendacoes: string;
  status: 'pending' | 'approved';
  aprovadoEm?: string | null;
};

export interface PatientDetailsBundle {
  patient: Patient;
  reports: DailyReport[];
  medications: Medication[];
  medicalRecords: MedicalRecord[];
  summary: AssistantSummary;
  timeline: TimelineEvent[];
}

export interface VitalSignInput {
  patientId: string;
  date: string;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  oxygenSaturation: number;
  weight?: number;
  temperature?: number;
}

export interface AddMedicalRecordInput {
  patientId: string;
  date: string;
  summary: string;
  actions: string[];
  nextAppointment?: string;
  doctorId?: string;
  doctorName?: string;
}

export interface AddMedicationInput {
  patientId: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
  prescribedBy?: string;
}

export interface CreatePatientAccountInput {
  nomeCompleto: string;
  email: string;
  senha: string;
  telefone?: string;
  semanasGestacao?: number;
}

export interface ReviewedSummary {
  id: string;
  patientId: string;
  date: string;
  type: 'diario' | 'semanal';
  status: 'pending' | 'approved';
  semaphore: 'verde' | 'amarelo' | 'vermelho';
  summary: string;
  symptoms: string[];
  alerts: string[];
  recommendations: string;
  approvedAt?: string;
}

function normalizePatient(patient: PatientApi): Patient {
  return {
    ...patient,
    dueDate: patient.dueDate ?? undefined,
    lastReportDate: patient.lastReportDate ?? undefined,
    vitalsHistory: {
      dates: [],
      systolic: [],
      diastolic: [],
      heartRate: [],
      oxygenSaturation: [],
      weight: [],
    },
  };
}

function normalizeMedication(med: PatientDetailApi['medications'][number] | MedicamentoOut): Medication {
  if ('name' in med) {
    return {
      id: med.id,
      patientId: med.patientId,
      name: med.name,
      dose: med.dose,
      frequency: med.frequency,
      duration: med.duration,
      startDate: med.startDate,
      endDate: med.endDate ?? undefined,
      notes: med.notes,
      isActive: med.isActive,
      prescribedBy: med.prescribedBy,
    };
  }

  const startDate = med.dataInicio ?? new Date().toISOString().slice(0, 10);
  const endDate = med.dataFim ?? undefined;
  const duration = endDate ? `${startDate} a ${endDate}` : 'em uso';
  return {
    id: med.id,
    patientId: med.gestanteId,
    name: med.nome,
    dose: med.dosagem,
    frequency: med.frequencia,
    duration,
    startDate,
    endDate,
    notes: med.observacoes ?? undefined,
    isActive: med.ativo,
    prescribedBy: 'Dr. Responsavel',
  };
}

function normalizeMedicalRecord(record: PatientDetailApi['medicalRecords'][number] | ProntuarioOut): MedicalRecord {
  if ('summary' in record) {
    return {
      ...record,
      nextAppointment: record.nextAppointment ?? undefined,
    };
  }

  return {
    id: record.id,
    patientId: record.gestanteId,
    date: record.data,
    summary: record.descricao,
    actions: record.acoesRealizadas ? [record.acoesRealizadas] : [],
    nextAppointment: undefined,
    doctorId: record.medicoId ?? '',
    doctorName: 'Dr. Responsavel',
  };
}

function normalizeVital(vital: SinalVitalOut): VitalSign {
  return {
    id: vital.id,
    patientId: vital.gestanteId,
    date: vital.data_registro,
    bloodPressureSystolic: vital.pressao_sistolica ?? 0,
    bloodPressureDiastolic: vital.pressao_diastolica ?? 0,
    heartRate: vital.frequencia_cardiaca ?? 0,
    oxygenSaturation: vital.saturacao_oxigenio ?? 0,
    weight: vital.peso_kg ?? undefined,
    temperature: vital.temperatura_c ?? undefined,
  };
}

function normalizeReviewedSummary(item: ResumoOut): ReviewedSummary {
  return {
    id: item.id,
    patientId: item.gestanteId,
    date: item.data,
    type: item.tipo,
    status: item.status,
    semaphore: item.semaforo,
    summary: item.resumo,
    symptoms: item.sintomasIdentificados ?? [],
    alerts: item.avisos ?? [],
    recommendations: item.recomendacoes ?? '',
    approvedAt: item.aprovadoEm ?? undefined,
  };
}

export async function fetchPatients(): Promise<Patient[]> {
  const { data } = await api.get<PatientApi[]>('/medicos/pacientes');
  return data.map(normalizePatient);
}

export async function fetchAvailablePatients(): Promise<Patient[]> {
  return fetchPatients();
}

export async function createPatientAccount(payload: CreatePatientAccountInput): Promise<void> {
  await api.post('/auth/doctor/patients', {
    nome_completo: payload.nomeCompleto,
    email: payload.email,
    senha: payload.senha,
    telefone: payload.telefone || null,
    semanas_gestacao_atual: payload.semanasGestacao ?? null,
  });
}

export async function fetchKPI(): Promise<KPIData> {
  const { data } = await api.get<KPIData>('/medicos/kpi');
  return data;
}

export async function fetchAlerts(): Promise<Alert[]> {
  const { data } = await api.get<Alert[]>('/medicos/alerts');
  return data;
}

export async function fetchAlertsKPI(): Promise<AlertsKPI> {
  const { data } = await api.get<AlertsKPI>('/medicos/alerts/kpi');
  return data;
}

export async function markAlertReviewed(id: string): Promise<void> {
  await api.patch(`/medicos/alerts/${id}/revisar`);
}

export async function addAlertNote(id: string, text: string): Promise<Alert['notes'][number]> {
  const { data } = await api.post<Alert['notes'][number]>(`/medicos/alerts/${id}/notes`, { text });
  return data;
}

export async function fetchReportData(period: ReportPeriod): Promise<ReportData> {
  const { data } = await api.get<ReportData>('/medicos/reports', { params: { period } });
  return data;
}

export async function fetchPatientDetailsBundle(id: string): Promise<PatientDetailsBundle> {
  const { data } = await api.get<PatientDetailApi>(`/medicos/pacientes/${id}/detalhe`);

  return {
    patient: {
      ...data.patient,
      dueDate: data.patient.dueDate ?? undefined,
      lastReportDate: data.patient.lastReportDate ?? undefined,
      firstAppointmentDate: data.patient.firstAppointmentDate ?? undefined,
      lastVitals: data.patient.lastVitals
        ? {
            id: data.patient.lastVitals.id,
            patientId: data.patient.lastVitals.patientId,
            date: data.patient.lastVitals.date,
            bloodPressureSystolic: data.patient.lastVitals.bloodPressureSystolic,
            bloodPressureDiastolic: data.patient.lastVitals.bloodPressureDiastolic,
            heartRate: data.patient.lastVitals.heartRate,
            oxygenSaturation: data.patient.lastVitals.oxygenSaturation,
            weight: data.patient.lastVitals.weight,
          }
        : undefined,
    },
    reports: data.reports,
    medications: data.medications.map(normalizeMedication),
    medicalRecords: data.medicalRecords.map(normalizeMedicalRecord),
    summary: data.summary,
    timeline: data.timeline,
  };
}

export async function addMedication(payload: AddMedicationInput): Promise<Medication> {
  const { data } = await api.post<MedicamentoOut>('/medicamentos', {
    gestanteId: payload.patientId,
    nome: payload.name,
    dosagem: payload.dose,
    frequencia: payload.frequency,
    dataInicio: payload.startDate,
    dataFim: payload.endDate,
    ativo: payload.isActive,
    observacoes: payload.notes,
  });
  return normalizeMedication(data);
}

export async function addMedicalRecord(payload: AddMedicalRecordInput): Promise<MedicalRecord> {
  const { data } = await api.post<ProntuarioOut>('/prontuarios', {
    gestanteId: payload.patientId,
    data: payload.date.slice(0, 10),
    descricao: payload.summary,
    medicamentosPrescritos: [],
    acoesRealizadas: payload.actions.join('\n'),
    medicoId: payload.doctorId,
  });
  return normalizeMedicalRecord(data);
}

export async function addVitalSign(payload: VitalSignInput): Promise<VitalSign> {
  const { data } = await api.post<SinalVitalOut>(`/medicos/pacientes/${payload.patientId}/sinais-vitais`, {
    data_registro: payload.date,
    pressao_sistolica: payload.bloodPressureSystolic,
    pressao_diastolica: payload.bloodPressureDiastolic,
    frequencia_cardiaca: payload.heartRate,
    saturacao_oxigenio: payload.oxygenSaturation,
    peso_kg: payload.weight,
    temperatura_c: payload.temperature,
  });
  return normalizeVital(data);
}

export async function fetchPatientSummaries(patientId: string): Promise<ReviewedSummary[]> {
  const { data } = await api.get<ResumoOut[]>(`/medicos/pacientes/${patientId}/resumos-ia`);
  return data.map(normalizeReviewedSummary);
}

export async function generatePatientSummary(patientId: string, start: string, end: string): Promise<ReviewedSummary> {
  const { data } = await api.post<ResumoOut>('/resumos-ia/gerar', {
    gestanteId: patientId,
    periodo_inicio: `${start}T00:00:00Z`,
    periodo_fim: `${end}T23:59:59Z`,
  });
  return normalizeReviewedSummary(data);
}

export async function approvePatientSummary(
  summaryId: string,
  payload: { summary?: string; recommendations?: string },
): Promise<ReviewedSummary> {
  const { data } = await api.patch<ResumoOut>(`/medicos/resumos-ia/${summaryId}/aprovar`, {
    resumo: payload.summary,
    recomendacoes: payload.recommendations,
  });
  return normalizeReviewedSummary(data);
}
