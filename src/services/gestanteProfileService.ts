import api from './api';

export interface GestanteProfile {
  id: string;
  user_id: string;
  nome_completo: string;
  data_nascimento?: string;
  telefone?: string;
  dum?: string;
  dpp?: string;
  tipo_sanguineo?: string;
  semanas_gestacao_atual?: number;
  observacoes?: string;
}

export interface GestanteProfileUpdateInput {
  nome_completo?: string;
  data_nascimento?: string;
  telefone?: string;
}

export async function fetchGestanteProfile(): Promise<GestanteProfile> {
  const { data } = await api.get<GestanteProfile>('/gestantes/me');
  return data;
}

export async function updateGestanteProfile(payload: GestanteProfileUpdateInput): Promise<GestanteProfile> {
  const { data } = await api.put<GestanteProfile>('/gestantes/me', payload);
  return data;
}
