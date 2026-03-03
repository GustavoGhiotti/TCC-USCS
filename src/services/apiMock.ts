import { User, RelatoDiario, Medicamento, Consulta, ResumoIA } from '../types/domain';

// ============================================
// DADOS MOCK - SIMULANDO BANCO DE DADOS
// ============================================

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

const gestantes: any[] = [
  {
    id: '1',
    nomeCompleto: 'Maria Silva',
    email: 'maria@example.com',
    role: 'gestante',
    semanasGestacao: 28,
    dadosExames: {
      pressaoArterial: '120/80',
      circunferenciaAbdominal: '95 cm'
    }
  },
  {
    id: '2',
    nomeCompleto: 'Ana Santos',
    email: 'ana@example.com',
    role: 'gestante',
    semanasGestacao: 32,
    dadosExames: {
      pressaoArterial: '130/85',
      circunferenciaAbdominal: '102 cm'
    }
  },
  {
    id: '3',
    nomeCompleto: 'Paula Costa',
    email: 'paula@example.com',
    role: 'gestante',
    semanasGestacao: 20,
    dadosExames: {
      pressaoArterial: '110/70',
      circunferenciaAbdominal: '88 cm'
    }
  },
  {
    id: '4',
    nomeCompleto: 'Lucia Oliveira',
    email: 'lucia@example.com',
    role: 'gestante',
    semanasGestacao: 35,
    dadosExames: {
      pressaoArterial: '125/82',
      circunferenciaAbdominal: '105 cm'
    }
  },
];

const medicos: User[] = [
  {
    id: 'med-1',
    nomeCompleto: 'Dr. Teste Ghiotti',
    email: 'medico@example.com',
    role: 'medico',
    consentimentoAceito: true,
  },
];

const relatos: any[] = [
  {
    id: '1',
    gestanteId: '1',
    data: '2026-01-28',
    descricao: 'Dia normal, sem grandes incômodos. Bebê se mexendo bastante.',
    sintomas: ['cansaço', 'inchaço', 'dor nas costas'],
    humor: 'feliz',
    sinaisVitais: {
      batimentos: 85,
      oxigenacao: 98,
      outros: 'Temperatura 36.5'
    },
    ocorrencias: 'Nenhuma ocorrência relevante.'
  },
  {
    id: '2',
    gestanteId: '1',
    data: '2026-01-25',
    descricao: 'Senti azia e alguns gases. Mas nada preocupante.',
    sintomas: ['azia', 'gases'],
    sinaisVitais: {
      pressao: '110/70',
      batimentos: 80
    },
    ocorrencias: '',
    humor: 'normal',
  },
  {
    id: '3',
    gestanteId: '2',
    data: '2026-01-27',
    descricao: 'Muito cansada, tentei descansar o dia todo.',
    sintomas: ['contrações', 'cansaço extremo'],
    ocorrencias: 'Tive uma leve tontura ao levantar.',
    humor: 'triste',
  },
  {
    id: '4',
    gestanteId: '2',
    data: '2026-01-20',
    descricao: 'Dia melhor, consegui sair um pouco.',
    sintomas: ['cansaço leve'],
    humor: 'normal',
  },
  {
    id: '5',
    gestanteId: '3',
    data: '2026-01-26',
    descricao: 'Pressão arterial elevada conforme aferição em casa.',
    sintomas: ['pressão alta', 'dor de cabeça', 'edema severo'],
    humor: 'ansioso',
  },
  {
    id: '6',
    gestanteId: '4',
    data: '2026-01-15',
    descricao: 'Tudo bem, sem maiores sintomas.',
    sintomas: ['inchaço leve'],
    humor: 'feliz',
  },
  // ── Relatos recentes para demo dos Indicadores da Unidade ──────────────────
  {
    id: '7',
    gestanteId: '1',
    data: '2026-03-01',
    descricao: 'Cansaço persistente ao longo do dia, azia após o almoço.',
    sintomas: ['cansaço', 'azia'],
    humor: 'normal',
  },
  {
    id: '8',
    gestanteId: '2',
    data: '2026-03-01',
    descricao: 'Senti algumas contrações irregulares e dor nas costas.',
    sintomas: ['contrações', 'dor nas costas'],
    humor: 'ansioso',
  },
  {
    id: '9',
    gestanteId: '3',
    data: '2026-02-28',
    descricao: 'Pressão arterial elevada ao aferir em casa, dor de cabeça leve.',
    sintomas: ['pressão alta', 'dor de cabeça'],
    humor: 'triste',
  },
  {
    id: '10',
    gestanteId: '4',
    data: '2026-02-27',
    descricao: 'Dia tranquilo, porém com inchaço nas pernas à tarde.',
    sintomas: ['inchaço', 'cansaço leve'],
    humor: 'normal',
  },
  {
    id: '11',
    gestanteId: '1',
    data: '2026-02-25',
    descricao: 'Noite com insônia, gases e desconforto abdominal.',
    sintomas: ['insônia', 'gases'],
    humor: 'normal',
  },
  {
    id: '12',
    gestanteId: '2',
    data: '2026-02-22',
    descricao: 'Tontura ao levantar, cansaço intenso.',
    sintomas: ['tontura', 'cansaço extremo'],
    humor: 'triste',
    ocorrencias: 'Tontura ao se levantar pela manhã, precisou sentar.',
  },
  {
    id: '13',
    gestanteId: '3',
    data: '2026-02-20',
    descricao: 'Edema nas mãos e pés, pressão alta aferida.',
    sintomas: ['edema severo', 'pressão alta'],
    humor: 'ansioso',
  },
];

const medicamentos: Medicamento[] = [
  {
    id: '1',
    gestanteId: '1',
    nome: 'Ácido Fólico',
    dosagem: '400 mcg',
    frequencia: '1x ao dia',
    ativo: true,
    dataPrescricao: '2025-10-01',
  },
  {
    id: '2',
    gestanteId: '1',
    nome: 'Ferro',
    dosagem: '65 mg',
    frequencia: '1x ao dia',
    ativo: true,
    dataPrescricao: '2025-10-01',
  },
  {
    id: '3',
    gestanteId: '2',
    nome: 'Repouso Relativo',
    dosagem: 'N/A',
    frequencia: 'Contínuo',
    ativo: true,
    dataPrescricao: '2026-01-01',
  },
  {
    id: '4',
    gestanteId: '3',
    nome: 'Anti-hipertensivo',
    dosagem: '10 mg',
    frequencia: '2x ao dia',
    ativo: true,
    dataPrescricao: '2025-12-15',
  },
  {
    id: '5',
    gestanteId: '4',
    nome: 'Vitamina D',
    dosagem: '1000 UI',
    frequencia: '1x ao dia',
    ativo: true,
    dataPrescricao: '2025-11-01',
  },
];

const prontuarios: Prontuario[] = [
  {
    id: '1',
    gestanteId: '1',
    data: '2026-01-15',
    descricao: 'Paciente relatou dores nas costas.',
    medicamentosPrescritos: ['Paracetamol'],
    acoesRealizadas: 'Recomendação de fisioterapia e repouso.',
    medicoId: 'med-1'
  }
];

const orientacoes: Orientacao[] = [
  {
    id: '1',
    gestanteId: '1',
    medicoId: 'med-1',
    data: '2026-01-29',
    texto: 'Mantenha o repouso e continue monitorando a pressão arterial diariamente. Se passar de 140/90, vá ao pronto-socorro.'
  }
];

const consultas: Consulta[] = [
  {
    id: '1',
    gestanteId: '1',
    data: '2026-02-10',
    tipo: 'ultrassom',
    observacoes: 'Bebê com desenvolvimento normal',
  },
  {
    id: '2',
    gestanteId: '2',
    data: '2026-01-15',
    tipo: 'pressão',
    observacoes: 'Monitorar a cada 2 dias',
  },
];

// ============================================
// AUTENTICAÇÃO
// ============================================

export async function loginMock(email: string, role: 'gestante' | 'medico'): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (role === 'gestante') {
        const user = gestantes.find((g) => g.email === email);
        if (user) {
          resolve(user);
        } else {
          reject(new Error('Usuário não encontrado'));
        }
      } else {
        const user = medicos.find((m) => m.email === email);
        if (user) {
          resolve(user);
        } else {
          reject(new Error('Usuário não encontrado'));
        }
      }
    }, 500);
  });
}

export async function getCurrentUserMock(): Promise<User | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        resolve(JSON.parse(userJson));
      } else {
        resolve(null);
      }
    }, 300);
  });
}

export function logoutMock(): void {
  localStorage.removeItem('user');
}

// ============================================
// RELATOS
// ============================================

export async function getRelatos(gestanteId: string): Promise<RelatoDiario[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const relatosFiltrados = relatos
        .filter((r) => r.gestanteId === gestanteId)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      resolve(relatosFiltrados);
    }, 300);
  });
}

export async function getRelatosGestante(gestanteId: string): Promise<RelatoDiario[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const relatosFiltrados = relatos
        .filter((r) => r.gestanteId === gestanteId)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      resolve(relatosFiltrados);
    }, 300);
  });
}

export async function createRelato(novoRelato: RelatoDiario): Promise<RelatoDiario> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const relato = {
        ...novoRelato,
        id: String(relatos.length + 1),
      };
      relatos.push(relato);
      resolve(relato);
    }, 300);
  });
}

// ============================================
// MEDICAMENTOS
// ============================================

export async function getMedicamentos(gestanteId: string): Promise<Medicamento[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const medicamentosFiltrados = medicamentos.filter(
        (m) => m.gestanteId === gestanteId
      );
      resolve(medicamentosFiltrados);
    }, 300);
  });
}

export async function getMedicamentosGestante(gestanteId: string): Promise<Medicamento[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const medicamentosFiltrados = medicamentos.filter(
        (m) => m.gestanteId === gestanteId
      );
      resolve(medicamentosFiltrados);
    }, 300);
  });
}

export async function createMedicamento(novoMedicamento: Medicamento): Promise<Medicamento> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const med = {
        ...novoMedicamento,
        id: String(medicamentos.length + 1),
      };
      medicamentos.push(med);
      resolve(med);
    }, 300);
  });
}

// ============================================
// CONSULTAS
// ============================================

export async function getConsultas(gestanteId: string): Promise<Consulta[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consultasFiltradas = consultas.filter(
        (c) => c.gestanteId === gestanteId
      );
      resolve(consultasFiltradas);
    }, 300);
  });
}

export async function createConsulta(novaConsulta: Consulta): Promise<Consulta> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const consulta = {
        ...novaConsulta,
        id: String(consultas.length + 1),
      };
      consultas.push(consulta);
      resolve(consulta);
    }, 300);
  });
}

// ============================================
// PRONTUÁRIOS
// ============================================

export async function getProntuarios(gestanteId: string): Promise<Prontuario[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(prontuarios.filter(p => p.gestanteId === gestanteId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
    }, 300);
  });
}

export async function createProntuario(novoProntuario: Omit<Prontuario, 'id'>): Promise<Prontuario> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const prontuario = { ...novoProntuario, id: String(prontuarios.length + 1) };
      prontuarios.push(prontuario);
      resolve(prontuario);
    }, 300);
  });
}

// ============================================
// ORIENTAÇÕES
// ============================================

export async function getOrientacoes(gestanteId: string): Promise<Orientacao[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(orientacoes.filter(o => o.gestanteId === gestanteId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
    }, 300);
  });
}

export async function createOrientacao(novaOrientacao: Omit<Orientacao, 'id'>): Promise<Orientacao> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orientacao = { ...novaOrientacao, id: String(orientacoes.length + 1) };
      orientacoes.push(orientacao);
      resolve(orientacao);
    }, 300);
  });
}

// ============================================
// FUNÇÕES PARA MÉDICO
// ============================================

export async function getAllGestantes(): Promise<User[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(gestantes);
    }, 300);
  });
}

export async function getGestanteById(id: string): Promise<User | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const gestante = gestantes.find((g) => g.id === id);
      resolve(gestante || null);
    }, 300);
  });
}

// ============================================
// RESUMOS DA IA (Mock)
// ============================================

const resumosMock: (ResumoIA & { gestanteId: string, data:string })[] = [
  {
    id: '1',
    gestanteId: '1',
    relatoId: '1',
    data: '2026-01-28',
    tipo: 'diario',
    semaforo: 'verde',
    resumo: 'Análise diária indica estabilidade. Sintomas leves de cansaço relatados, dentro da normalidade para o período.',
    sintomasIdentificados: ['cansaço', 'inchaço leve'],
    avisos: [],
    recomendacoes: 'Manter hidratação e rotina de sono. Repouso se o inchaço aumentar.',
  },
  {
    id: '2',
    gestanteId: '1',
    relatoId: '2',
    data: '2026-01-21',
    tipo: 'semanal',
    semaforo: 'amarelo',
    resumo: 'Análise semanal aponta aumento na frequência de azia e desconforto gástrico. Padrão de sono irregular.',
    sintomasIdentificados: ['azia', 'gases', 'insônia'],
    avisos: ['Qualidade do sono reduzida', 'Desconforto gástrico frequente'],
    recomendacoes: 'Evitar refeições pesadas à noite. Tentar elevar a cabeceira da cama.',
  }
];

export async function getResumos(gestanteId: string): Promise<ResumoIA[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const results = resumosMock.filter((r) => r.gestanteId === gestanteId);
      resolve(results);
    }, 600);
  });
}

export async function getResumosIA(gestanteId: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const gestante = gestantes.find((g) => g.id === gestanteId);
      const relatosDaGestante = relatos.filter((r) => r.gestanteId === gestanteId);

      const resumo = `
RESUMO DE ANÁLISE - IA MÉDICA
============================

Paciente: ${gestante?.nomeCompleto || 'Não identificada'}
Semanas de Gestação: ${gestante?.semanasGestacao || '—'}
Total de Relatos: ${relatosDaGestante.length}
Dados de Exames Recentes: PA ${gestante?.dadosExames?.pressaoArterial || 'N/A'}, Circ. ${gestante?.dadosExames?.circunferenciaAbdominal || 'N/A'}

ANÁLISE:
--------
${
  relatosDaGestante.length === 0
    ? 'Nenhum relato registrado para análise.'
    : `Baseado em ${relatosDaGestante.length} relatos, observamos os seguintes padrões:

Sintomas Mais Frequentes:
${getAllSymptoms(relatosDaGestante)
  .slice(0, 5)
  .map((s, i) => `${i + 1}. ${s.sintoma} (${s.count}x)`)
  .join('\n')}

Humor Predominante:
${getMoodAnalysis(relatosDaGestante)}

Alertas de Sinais Vitais/Ocorrências:
${getVitalSignsAnalysis(relatosDaGestante)}

Recomendações:
- Manter acompanhamento regular
- Continuar registrando sintomas diariamente
- Procurar médico se surgirem sintomas graves
`
}

Gerado em: ${new Date().toLocaleString('pt-BR')}
      `;

      resolve(resumo);
    }, 1000);
  });
}

function getAllSymptoms(
  relatosList: RelatoDiario[]
): Array<{ sintoma: string; count: number }> {
  const symptoms: Record<string, number> = {};

  relatosList.forEach((relato) => {
    relato.sintomas?.forEach((sintoma) => {
      symptoms[sintoma] = (symptoms[sintoma] || 0) + 1;
    });
  });

  return Object.entries(symptoms)
    .map(([sintoma, count]) => ({ sintoma, count }))
    .sort((a, b) => b.count - a.count);
}

function getMoodAnalysis(relatosList: RelatoDiario[]): string {
  const moods: Record<string, number> = {};

  relatosList.forEach((relato) => {
    if (relato.humor) {
      moods[relato.humor] = (moods[relato.humor] || 0) + 1;
    }
  });

  const maisPequente = Object.entries(moods).sort((a, b) => b[1] - a[1])[0];
  
  if (!maisPequente) return 'Sem dados suficientes para análise de humor.';

  const moodEmojis: Record<string, string> = {
    feliz: '😊 Feliz',
    normal: '😐 Normal',
    triste: '😢 Triste',
    ansioso: '😰 Ansioso',
  };

  return moodEmojis[maisPequente[0]] || 'Normal';
}

function getVitalSignsAnalysis(relatosList: any[]): string {
  let alertas: string[] = [];
  relatosList.forEach(r => {
    if (r.sinaisVitais?.pressao) {
      const [sis, dia] = r.sinaisVitais.pressao.split('/').map(Number);
      if (sis >= 140 || dia >= 90) alertas.push(`- Pressão alta (${r.sinaisVitais.pressao}) em ${r.data}`);
    }
    if (r.ocorrencias && r.ocorrencias.length > 5 && !r.ocorrencias.toLowerCase().includes('nenhuma')) {
      alertas.push(`- Ocorrência em ${r.data}: ${r.ocorrencias}`);
    }
    if (r.sintomas?.includes('contrações')) {
      alertas.push(`- Contrações relatadas em ${r.data}`);
    }
  });

  if (alertas.length === 0) return "Nenhum sinal vital crítico ou ocorrência grave detectada nos relatos recentes.";
  
  return alertas.slice(0, 5).join('\n');
}