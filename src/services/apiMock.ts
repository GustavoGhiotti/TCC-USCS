import api from './api';
import { User, RelatoDiario, Medicamento, Consulta, ResumoIA } from '../types/domain';

export interface Prontuario {
  id: string;
  gestanteId: string;
  data: string;
  descricao: string;
  medicamentosPrescritos: string[];
  acoesRealizadas: string;
  medicoId: string;
}

export interface Orientacao {
  id: string;
  gestanteId: string;
  medicoId: string;
  data: string;
  texto: string;
}

function mapRelato(r: any): RelatoDiario {
  return {
    id: r.id,
    gestanteId: r.gestante_id ?? r.gestanteId,
    data: r.data,
    descricao: r.descricao ?? '',
    humor: r.humor,
    sintomas: r.sintomas ?? [],
    criadoEm: r.created_at,
  };
}

function mapMedicamento(m: any): Medicamento {
  return {
    id: m.id,
    gestanteId: m.gestanteId ?? m.gestante_id,
    nome: m.nome,
    dosagem: m.dosagem,
    frequencia: m.frequencia,
    dataInicio: m.dataInicio,
    dataPrescricao: m.dataPrescricao,
    dataFim: m.dataFim,
    ativo: m.ativo,
  };
}

export async function loginMock(email: string, role: 'gestante' | 'medico'): Promise<User> {
  const senha = role === 'medico' ? '123456' : (email === 'patient@gestacare.com' ? '123456' : 'senha123');
  const { data } = await api.post('/auth/login', { email, senha });
  localStorage.setItem('token', data.access_token);
  return data.user;
}

export async function getCurrentUserMock(): Promise<User | null> {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch {
    return null;
  }
}

export function logoutMock(): void {
  localStorage.removeItem('token');
}

export async function getRelatos(_gestanteId: string): Promise<RelatoDiario[]> {
  const { data } = await api.get('/relatos/me', { params: { periodo: 'todos' } });
  return (data ?? []).map(mapRelato);
}

export async function getRelatosGestante(gestanteId: string): Promise<RelatoDiario[]> {
  return getRelatos(gestanteId);
}

export async function createRelato(novoRelato: RelatoDiario): Promise<RelatoDiario> {
  const { data } = await api.post('/relatos', {
    data: novoRelato.data,
    humor: novoRelato.humor,
    sintomas: novoRelato.sintomas,
    descricao: novoRelato.descricao,
  });
  return mapRelato(data);
}

export async function getMedicamentos(_gestanteId: string): Promise<Medicamento[]> {
  const { data } = await api.get('/medicamentos/me');
  return (data ?? []).map(mapMedicamento);
}

export async function getMedicamentosGestante(gestanteId: string): Promise<Medicamento[]> {
  return getMedicamentos(gestanteId);
}

export async function createMedicamento(novoMedicamento: Medicamento): Promise<Medicamento> {
  const { data } = await api.post('/medicamentos', {
    gestanteId: novoMedicamento.gestanteId,
    nome: novoMedicamento.nome,
    dosagem: novoMedicamento.dosagem,
    frequencia: novoMedicamento.frequencia,
    dataInicio: novoMedicamento.dataInicio ?? null,
    dataFim: novoMedicamento.dataFim ?? null,
    ativo: novoMedicamento.ativo,
    observacoes: '',
  });
  return mapMedicamento(data);
}

export async function getConsultas(_gestanteId: string): Promise<Consulta[]> {
  const { data } = await api.get('/consultas/me');
  return (data ?? []).map((c: any) => ({
    id: c.id,
    gestanteId: c.gestanteId,
    data: c.data,
    tipo: c.tipo,
    observacoes: c.observacoes,
  }));
}

export async function createConsulta(novaConsulta: Consulta): Promise<Consulta> {
  const { data } = await api.post('/consultas', {
    gestanteId: novaConsulta.gestanteId,
    data: novaConsulta.data,
    tipo: novaConsulta.tipo,
    observacoes: novaConsulta.observacoes ?? '',
  });
  return {
    id: data.id,
    gestanteId: data.gestanteId,
    data: data.data,
    tipo: data.tipo,
    observacoes: data.observacoes,
  };
}

export async function getProntuarios(_gestanteId: string): Promise<Prontuario[]> {
  const { data } = await api.get('/prontuarios/me');
  return data ?? [];
}

export async function createProntuario(novoProntuario: Omit<Prontuario, 'id'>): Promise<Prontuario> {
  const { data } = await api.post('/prontuarios', novoProntuario);
  return data;
}

export async function getOrientacoes(_gestanteId: string): Promise<Orientacao[]> {
  const { data } = await api.get('/orientacoes/me');
  return data ?? [];
}

export async function createOrientacao(novaOrientacao: Omit<Orientacao, 'id'>): Promise<Orientacao> {
  const { data } = await api.post('/orientacoes', novaOrientacao);
  return data;
}

export async function getAllGestantes(): Promise<User[]> {
  const { data } = await api.get('/medicos/pacientes');
  return (data ?? []).map((p: any) => ({
    id: p.id,
    email: `${p.id}@gestacare.local`,
    role: 'gestante' as const,
    nomeCompleto: p.name,
    semanasGestacao: p.gestationalWeeks,
    consentimentoAceito: true,
  }));
}

export async function getGestanteById(id: string): Promise<User | null> {
  const gestantes = await getAllGestantes();
  return gestantes.find((g) => g.id === id) ?? null;
}

export async function getResumos(gestanteId: string): Promise<ResumoIA[]> {
  const { data } = await api.get('/resumos-ia/me');
  const all = (data ?? []).map((r: any) => ({
    id: r.id,
    relatoId: r.relatoId,
    tipo: r.tipo,
    resumo: r.resumo,
    sintomasIdentificados: r.sintomasIdentificados ?? [],
    avisos: r.avisos ?? [],
    recomendacoes: r.recomendacoes ?? '',
    semaforo: r.semaforo,
    gestanteId: r.gestanteId,
    data: r.data,
  }));
  return all.filter((r: any) => r.gestanteId === gestanteId || !r.gestanteId);
}

export async function getResumosIA(gestanteId: string): Promise<string> {
  const resumos: any[] = (await getResumos(gestanteId)) as any[];
  if (resumos.length === 0) return 'Sem resumos gerados para este periodo.';
  return resumos
    .map((r) => `Data: ${r.data}\nSemaforo: ${r.semaforo}\nResumo: ${r.resumo}\nAvisos: ${(r.avisos || []).join(', ') || 'Nenhum'}`)
    .join('\n\n');
}
