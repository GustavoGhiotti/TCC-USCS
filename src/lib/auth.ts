import axios from 'axios';

import { User, UserRole } from '../types/domain';
import { acceptConsentimento, login } from '../services/api';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function mockLogin(email: string, senha: string, perfilSelecionado?: UserRole): Promise<User> {
  try {
    const user = await login(email, senha);

    if (perfilSelecionado && user.role !== perfilSelecionado) {
      const perfilLabel = perfilSelecionado === 'medico' ? 'Medico' : 'Gestante';
      throw new AuthError(`Este e-mail nao esta cadastrado como ${perfilLabel}.`);
    }

    return user;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new AuthError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
      }
      throw new AuthError('Falha na comunicacao com o backend. Verifique se a API esta rodando.');
    }

    throw new AuthError('Ocorreu um erro inesperado. Tente novamente.');
  }
}

export async function acceptConsentimentoMock(_userId: string): Promise<void> {
  await acceptConsentimento('1.0');
}
