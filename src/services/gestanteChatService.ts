import api from './api';

export interface KnowledgeCitation {
  title: string;
  page?: number | null;
  url?: string | null;
  excerpt: string;
}

export interface ChatGestanteMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  urgencyLevel?: 'rotina' | 'proxima_consulta' | 'mesmo_dia' | 'pronto_socorro' | 'sem_base' | null;
  citations: KnowledgeCitation[];
  createdAt: string;
}

export interface ChatGestanteStatus {
  knowledgeLoaded: boolean;
  knowledgeChunks: number;
}

export interface ChatGestanteAskResponse {
  userMessage: ChatGestanteMessage;
  assistantMessage: ChatGestanteMessage;
  knowledgeLoaded: boolean;
  knowledgeChunks: number;
}

export async function getGestanteChatHistory(): Promise<ChatGestanteMessage[]> {
  const { data } = await api.get<ChatGestanteMessage[]>('/chat-gestante/me');
  return data;
}

export async function getGestanteChatStatus(): Promise<ChatGestanteStatus> {
  const { data } = await api.get<ChatGestanteStatus>('/chat-gestante/status');
  return data;
}

export async function askGestanteChat(message: string): Promise<ChatGestanteAskResponse> {
  const { data } = await api.post<ChatGestanteAskResponse>('/chat-gestante/perguntar', {
    message,
  });
  return data;
}
