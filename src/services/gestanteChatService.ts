import api from './api';

export interface KnowledgeCitation {
  title: string;
  page?: number | null;
  url?: string | null;
  excerpt: string;
}

export interface ChatGestanteMessage {
  id: string;
  threadId: string;
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
  threadId: string;
  userMessage: ChatGestanteMessage;
  assistantMessage: ChatGestanteMessage;
  knowledgeLoaded: boolean;
  knowledgeChunks: number;
}

export interface ChatGestanteThread {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export async function getGestanteChatHistory(threadId?: string | null): Promise<ChatGestanteMessage[]> {
  const { data } = await api.get<ChatGestanteMessage[]>('/chat-gestante/me', {
    params: threadId ? { threadId } : undefined,
  });
  return data;
}

export async function getGestanteChatThreads(): Promise<ChatGestanteThread[]> {
  const { data } = await api.get<ChatGestanteThread[]>('/chat-gestante/threads');
  return data;
}

export async function createGestanteChatThread(): Promise<ChatGestanteThread> {
  const { data } = await api.post<ChatGestanteThread>('/chat-gestante/threads');
  return data;
}

export async function getGestanteChatStatus(): Promise<ChatGestanteStatus> {
  const { data } = await api.get<ChatGestanteStatus>('/chat-gestante/status');
  return data;
}

export async function askGestanteChat(message: string, threadId?: string | null): Promise<ChatGestanteAskResponse> {
  const { data } = await api.post<ChatGestanteAskResponse>('/chat-gestante/perguntar', {
    message,
    threadId,
  });
  return data;
}
