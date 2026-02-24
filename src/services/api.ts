import axios from 'axios';
import { User } from '../types/domain';

// ============================================
// INSTÂNCIA AXIOS — aponta para o backend real
// ============================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injeta o token JWT em todas as requisições automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================
// AUTH
// ============================================

export async function login(email: string, senha: string): Promise<User> {
  const { data } = await api.post<{ access_token: string; user: User }>('/auth/login', {
    email,
    senha,
  });
  localStorage.setItem('token', data.access_token);
  return data.user;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const { data } = await api.get<User>('/auth/me');
    return data;
  } catch {
    localStorage.removeItem('token');
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem('token');
}

export default api;
