export type AlertLevel = 'none' | 'low' | 'medium' | 'high';

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  age: number;
  gestationalWeeks?: number;
  gestationalDays?: number;
  lastReportDate?: string;
  alertLevel: AlertLevel;
  alertFlags: string[];
  isActive: boolean;
  dueDate?: string;
  phone?: string;
  address?: string;
  bloodType?: string;
  firstAppointmentDate?: string;
}

export interface DailyReport {
  id: string;
  patientId: string;
  date: string;
  description: string;
  complementaryNote?: string;
  mood: 'feliz' | 'normal' | 'triste' | 'ansioso';
  symptoms: string[];
  clinicalPriority: 'baixa' | 'normal' | 'alta' | 'critica';
  highlightForConsultation: boolean;
  priorityReason?: string;
  doctorNote?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
  prescribedBy: string;
}

export interface MedicalExam {
  id: string;
  patientId: string;
  title: string;
  examType?: string;
  examDate?: string;
  notes?: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  summary: string;
  actions: string[];
  nextAppointment?: string;
  doctorId: string;
  doctorName: string;
}

export interface PrenatalProfile {
  riskClassification: 'habitual' | 'intermediario' | 'alto';
  chronicConditions: string[];
  previousPregnancyComplications: string[];
  familyHistory: string[];
  allergies?: string;
  continuousMedications?: string;
  surgeries?: string;
  obstetricHistory?: string;
  mentalHealthNotes?: string;
  socialContext?: string;
  additionalNotes?: string;
}

export interface AssistantSummary {
  patientId: string;
  generatedAt: string;
  summaryText: string;
  changesDetected: string[];
  dataPoints: number;
}

export interface TimelineEvent {
  id: string;
  patientId: string;
  date: string;
  type: 'report' | 'appointment' | 'medication';
  description: string;
  hasFlag: boolean;
}

export interface KPIData {
  newReportsToday: number;
  pendingAlerts: number;
  activePatients: number;
}
