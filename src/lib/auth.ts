import { User, UserRole } from '../types/domain';

// ─── Credenciais mock ─────────────────────────────────────────────────────────
interface MockCredential {
  email: string;
  senha: string;
  user: User;
}

const MOCK_CREDENTIALS: MockCredential[] = [
  {
    email: 'doctor@gestacare.com',
    senha: '123456',
    user: {
      id: 'mock-medico-001',
      email: 'doctor@gestacare.com',
      role: 'medico',
      nomeCompleto: 'Dr. Carlos Oliveira',
      consentimentoAceito: true,
    },
  },
  {
    // patient@gestacare.com sem consentimento — para demonstrar o fluxo LGPD
    email: 'patient@gestacare.com',
    senha: '123456',
    user: {
      id: 'mock-gestante-001',
      email: 'patient@gestacare.com',
      role: 'gestante',
      nomeCompleto: 'Maria Santos',
      semanasGestacao: 28,
      consentimentoAceito: false,
    },
  },
  // Credenciais de compatibilidade com as credenciais de teste originais
  {
    email: 'medico@example.com',
    senha: 'senha123',
    user: {
      id: 'mock-medico-002',
      email: 'medico@example.com',
      role: 'medico',
      nomeCompleto: 'Dr. Ana Ferreira',
      consentimentoAceito: true,
    },
  },
  {
    email: 'maria@example.com',
    senha: 'senha123',
    user: {
      id: 'mock-gestante-002',
      email: 'maria@example.com',
      role: 'gestante',
      nomeCompleto: 'Maria Oliveira',
      semanasGestacao: 32,
      consentimentoAceito: true,
    },
  },
];

const FAKE_TOKEN = 'mock-jwt-token-gestacare-2026';

// ─── Mock login ───────────────────────────────────────────────────────────────
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Simula um login assíncrono com 700ms de delay.
 * Valida email, senha e, opcionalmente, se o perfil selecionado bate com o
 * role da credencial encontrada.
 */
export async function mockLogin(
  email: string,
  senha: string,
  perfilSelecionado?: UserRole,
): Promise<User> {
  await new Promise(resolve => setTimeout(resolve, 700));

  const credential = MOCK_CREDENTIALS.find(
    c => c.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (!credential) {
    throw new AuthError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
  }

  if (credential.senha !== senha) {
    throw new AuthError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
  }

  if (perfilSelecionado && credential.user.role !== perfilSelecionado) {
    const perfilLabel = perfilSelecionado === 'medico' ? 'Médico' : 'Gestante';
    throw new AuthError(
      `Este e-mail está cadastrado como ${credential.user.role === 'medico' ? 'Médico' : 'Gestante'}, não como ${perfilLabel}. Selecione o perfil correto.`,
    );
  }

  localStorage.setItem('token', FAKE_TOKEN);
  return credential.user;
}

/**
 * Recupera o usuário mock a partir do token salvo no localStorage.
 */
export function getMockCurrentUser(): User | null {
  const token = localStorage.getItem('token');
  if (token !== FAKE_TOKEN) return null;
  return null;
}

/**
 * Atualiza o consentimento LGPD para o usuário nas credenciais mock (in-memory).
 * Em produção, chamaria PATCH /users/:id/consent.
 */
export function acceptConsentimentoMock(userId: string): void {
  const cred = MOCK_CREDENTIALS.find(c => c.user.id === userId);
  if (cred) {
    cred.user.consentimentoAceito = true;
    cred.user.consentimentoAceitoEm = new Date().toISOString();
  }
}
