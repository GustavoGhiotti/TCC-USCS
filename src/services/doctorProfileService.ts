import type { User } from '../types/domain';

export interface DoctorProfessionalProfile {
  displayName: string;
  crm: string;
  crmUf: string;
  specialty: string;
  subspecialty: string;
  institution: string;
  department: string;
  professionalEmail: string;
  professionalPhone: string;
  city: string;
  state: string;
  serviceModes: string[];
  languages: string[];
  bio: string;
  updatedAt?: string;
}

const STORAGE_PREFIX = 'doctor-professional-profile:';

const DEFAULT_SERVICE_MODES = ['Presencial', 'Telemonitoramento'];

export function createDefaultDoctorProfile(user: User): DoctorProfessionalProfile {
  return {
    displayName: user.nomeCompleto,
    crm: '',
    crmUf: '',
    specialty: '',
    subspecialty: '',
    institution: '',
    department: '',
    professionalEmail: user.email,
    professionalPhone: '',
    city: '',
    state: '',
    serviceModes: DEFAULT_SERVICE_MODES,
    languages: ['Português'],
    bio: '',
  };
}

export function getDoctorProfile(user: User): DoctorProfessionalProfile {
  const fallback = createDefaultDoctorProfile(user);

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${user.id}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DoctorProfessionalProfile>;

    return {
      ...fallback,
      ...parsed,
      serviceModes: Array.isArray(parsed.serviceModes) && parsed.serviceModes.length > 0
        ? parsed.serviceModes
        : fallback.serviceModes,
      languages: Array.isArray(parsed.languages) && parsed.languages.length > 0
        ? parsed.languages
        : fallback.languages,
    };
  } catch {
    return fallback;
  }
}

export function saveDoctorProfile(user: User, profile: DoctorProfessionalProfile): DoctorProfessionalProfile {
  const next = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`${STORAGE_PREFIX}${user.id}`, JSON.stringify(next));
  return next;
}
