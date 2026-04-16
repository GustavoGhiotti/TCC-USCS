import api from './api';

export interface MedicalExam {
  id: string;
  gestanteId: string;
  titulo: string;
  tipoExame?: string;
  dataExame?: string;
  observacoes?: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  enviadoEm: string;
}

export interface ExamUploadInput {
  titulo: string;
  tipoExame?: string;
  dataExame?: string;
  observacoes?: string;
  nomeArquivo: string;
  mimeType: string;
  conteudoBase64: string;
}

export interface GestanteProfileRef {
  id: string;
  user_id: string;
  nome_completo: string;
}

export async function fetchGestanteProfileRef(): Promise<GestanteProfileRef> {
  const { data } = await api.get<GestanteProfileRef>('/gestantes/me');
  return data;
}

export async function fetchMyExams(): Promise<MedicalExam[]> {
  const { data } = await api.get<MedicalExam[]>('/exames/me');
  return data;
}

export async function uploadMyExam(payload: ExamUploadInput): Promise<MedicalExam> {
  const { data } = await api.post<MedicalExam>('/exames', payload);
  return data;
}

export async function fetchPatientExams(patientId: string): Promise<MedicalExam[]> {
  const { data } = await api.get<MedicalExam[]>(`/medicos/pacientes/${patientId}/exames`);
  return data;
}

export function getExamDownloadUrl(examId: string): string {
  const baseURL = api.defaults.baseURL ?? 'http://localhost:8000';
  return `${baseURL}/exames/${examId}/download`;
}

export function formatExamSize(size: number): string {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}
