import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { GestanteLayout } from '../../components/layout/GestanteLayout';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import { PageSpinner, Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { cn, formatDate, formatTime } from '../../lib/utils';
import {
  askGestanteChat,
  getGestanteChatHistory,
  getGestanteChatStatus,
  type ChatGestanteMessage,
  type ChatGestanteStatus,
} from '../../services/gestanteChatService';

const EXAMPLE_QUESTIONS = [
  'Posso usar repelente na gestacao?',
  'Dor de cabeca na gravidez: quando preciso procurar atendimento?',
  'Posso pintar o cabelo durante a gestacao?',
];

function urgencyLabel(level?: ChatGestanteMessage['urgencyLevel']) {
  switch (level) {
    case 'rotina':
      return { label: 'Orientacao de rotina', variant: 'success' as const };
    case 'proxima_consulta':
      return { label: 'Levar para a proxima consulta', variant: 'warning' as const };
    case 'mesmo_dia':
      return { label: 'Buscar atendimento no mesmo dia', variant: 'danger' as const };
    case 'pronto_socorro':
      return { label: 'Ir ao pronto socorro', variant: 'danger' as const };
    case 'sem_base':
      return { label: 'Sem base oficial carregada', variant: 'neutral' as const };
    default:
      return null;
  }
}

function StatusBanner({ status }: { status: ChatGestanteStatus | null }) {
  if (!status) return null;

  if (!status.knowledgeLoaded) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        A base oficial da assistente ainda nao foi carregada. O chat continua protegido e evita responder sem os livros/manuais do projeto.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      Base oficial carregada com {status.knowledgeChunks} trecho(s). As respostas devem citar fonte, pagina e link quando houver referencia disponivel.
    </div>
  );
}

function AssistantNotice() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 shadow-sm">
      <p className="font-semibold text-slate-800">Como esta assistente funciona</p>
      <p className="mt-2 leading-6">
        Este chat foi preparado para responder duvidas da gestacao somente com base na bibliografia oficial carregada no projeto.
        Ele nao substitui consulta, nao fecha diagnostico e deve ser incisivo quando houver sinal de urgencia.
      </p>
    </div>
  );
}

function CitationList({ message }: { message: ChatGestanteMessage }) {
  if (message.citations.length === 0) return null;

  return (
    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fontes usadas</p>
      {message.citations.map((citation, index) => (
        <div key={`${message.id}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">
            {citation.title}
            {citation.page ? ` · p. ${citation.page}` : ''}
          </p>
          {citation.excerpt && <p className="mt-1 leading-5">{citation.excerpt}</p>}
          {citation.url && (
            <a
              href={citation.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              Abrir referencia
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatGestanteMessage }) {
  const isAssistant = message.role === 'assistant';
  const urgency = urgencyLabel(message.urgencyLevel);

  return (
    <div className={cn('flex', isAssistant ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-3xl rounded-[24px] px-4 py-3 shadow-sm',
          isAssistant
            ? 'border border-slate-200 bg-white text-slate-700'
            : 'bg-brand-600 text-white',
        )}
      >
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className={cn('font-semibold', isAssistant ? 'text-slate-700' : 'text-white/90')}>
            {isAssistant ? 'Assistente GestaCare' : 'Voce'}
          </span>
          <span className={cn(isAssistant ? 'text-slate-400' : 'text-white/70')}>
            {formatDate(message.createdAt, { day: '2-digit', month: '2-digit' })} · {formatTime(message.createdAt)}
          </span>
          {urgency && isAssistant && <Badge variant={urgency.variant}>{urgency.label}</Badge>}
        </div>

        <p className={cn('whitespace-pre-wrap text-sm leading-6', isAssistant ? 'text-slate-700' : 'text-white')}>
          {message.content}
        </p>

        {isAssistant && <CitationList message={message} />}
      </div>
    </div>
  );
}

export function GestanteChatIA() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatGestanteMessage[]>([]);
  const [status, setStatus] = useState<ChatGestanteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([getGestanteChatHistory(), getGestanteChatStatus()])
      .then(([history, chatStatus]) => {
        setMessages(history);
        setStatus(chatStatus);
      })
      .catch(() => setError('Nao foi possivel carregar o chat agora.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const welcomeName = useMemo(() => user?.nomeCompleto?.split(' ')[0] ?? 'gestante', [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length < 3 || sending) return;

    setSending(true);
    setError(null);

    try {
      const response = await askGestanteChat(trimmed);
      setMessages((current) => [...current, response.userMessage, response.assistantMessage]);
      setStatus({
        knowledgeLoaded: response.knowledgeLoaded,
        knowledgeChunks: response.knowledgeChunks,
      });
      setInput('');
    } catch {
      setError('Nao foi possivel enviar sua pergunta. Tente novamente.');
    } finally {
      setSending(false);
    }
  }

  return (
    <GestanteLayout>
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-6 py-3 backdrop-blur">
        <h1 className="text-base font-semibold text-slate-900">Assistente IA</h1>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Converse com a assistente</h2>
              <p className="mt-1 text-sm text-slate-500">
                Tire duvidas do dia a dia com base apenas na bibliografia oficial carregada no projeto.
              </p>
            </div>

            <StatusBanner status={status} />

            <Card className="min-h-[560px] overflow-hidden rounded-[28px] border-slate-100">
              {loading ? (
                <PageSpinner label="Carregando conversa..." />
              ) : (
                <>
                  <div className="flex max-h-[58vh] flex-col gap-4 overflow-y-auto bg-[linear-gradient(180deg,_rgba(248,250,252,0.82)_0%,_rgba(255,255,255,1)_100%)] px-4 py-5 sm:px-5">
                    {messages.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/85 px-5 py-6 text-sm text-slate-500">
                        <p className="font-semibold text-slate-800">Oi, {welcomeName}.</p>
                        <p className="mt-2 leading-6">
                          Este espaco serve para duvidas frequentes da gestacao, como alimentacao, pele, sintomas comuns e sinais de alerta.
                          Quando a base oficial ainda nao estiver carregada, a assistente avisa e nao improvisa resposta.
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => <MessageBubble key={message.id} message={message} />)
                    )}

                    {sending && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                          <Spinner size="sm" label="Gerando resposta..." />
                          Assistente consultando a base oficial...
                        </div>
                      </div>
                    )}

                    <div ref={endRef} />
                  </div>

                  <CardBody className="border-t border-slate-100 pt-4">
                    {error && (
                      <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <label htmlFor="chat-message" className="text-sm font-medium text-slate-700">
                        Sua pergunta
                      </label>
                      <textarea
                        id="chat-message"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        rows={4}
                        placeholder="Ex.: Posso usar repelente? Dor de cabeca na gestacao quando preocupa?"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-400">
                          A resposta deve citar fonte. Se houver sinal de urgencia, o chat prioriza orientar busca de atendimento.
                        </p>
                        <button
                          type="submit"
                          disabled={sending || input.trim().length < 3}
                          className="inline-flex items-center rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Enviar pergunta
                        </button>
                      </div>
                    </form>
                  </CardBody>
                </>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <AssistantNotice />

            <Card className="rounded-[24px] border-slate-100">
              <CardBody className="pt-5">
                <h3 className="text-sm font-semibold text-slate-800">Perguntas que fazem sentido aqui</h3>
                <div className="mt-3 space-y-2">
                  {EXAMPLE_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => setInput(question)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-600 transition hover:border-brand-200 hover:bg-brand-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="rounded-[24px] border-slate-100">
              <CardBody className="pt-5">
                <h3 className="text-sm font-semibold text-slate-800">Quando nao depender do chat</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>Se houver sangramento, falta de ar importante, convulsao, perda de liquido ou dor intensa.</li>
                  <li>Se a pressao estiver alta com sintomas como cefaleia forte, alteracao visual ou mal-estar.</li>
                  <li>Se o medico ja orientou procurar atendimento presencial diante de um sintoma especifico.</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>
    </GestanteLayout>
  );
}
