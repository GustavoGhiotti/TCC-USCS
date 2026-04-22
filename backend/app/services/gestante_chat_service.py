import json
import re
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chat_gestante_message import ChatGestanteMessage
from app.models.gestante import Gestante
from app.services.ai_provider import AIProviderError, get_ai_provider
from app.services.knowledge_base_service import _tokenize
from app.services.knowledge_base_service import KnowledgeChunk, knowledge_stats, retrieve_knowledge_chunks


@dataclass
class GestanteChatAnswer:
    answer: str
    urgency_level: str
    citations: list[dict]
    knowledge_loaded: bool
    knowledge_chunks: int


def _extract_relevant_excerpt(chunk: KnowledgeChunk, question: str) -> str:
    query_tokens = _tokenize(question)
    candidates = [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", chunk.content) if part.strip()]
    if not candidates:
        return chunk.content[:240].strip()

    best = candidates[0]
    best_score = -1
    for sentence in candidates:
        sent_tokens = _tokenize(sentence)
        overlap = len(query_tokens & sent_tokens)
        score = overlap * 2 + min(len(sentence), 220) / 220
        if score > best_score:
            best = sentence
            best_score = score
    return best[:300].strip()


def _serialize_citations(chunks: list[KnowledgeChunk], *, question: str) -> list[dict]:
    return [
        {
            "title": chunk.title,
            "page": chunk.page,
            "url": chunk.url,
            "excerpt": _extract_relevant_excerpt(chunk, question),
        }
        for chunk in chunks
    ]


def _history_excerpt(db: Session, gestante_id: str, question: str, limit: int = 8) -> str:
    messages = list(
        db.scalars(
            select(ChatGestanteMessage)
            .where(ChatGestanteMessage.gestante_id == gestante_id)
            .order_by(ChatGestanteMessage.created_at.desc())
            .limit(limit)
        )
    )
    if not messages:
        return ""
    ordered = list(reversed(messages))
    query_tokens = _tokenize(question)
    related = []
    for item in ordered:
        message_tokens = _tokenize(item.content)
        if not query_tokens or query_tokens & message_tokens:
            related.append(f"{item.role}: {item.content}")
    return "\n".join(related[-4:])


def _infer_urgency_from_question(question: str) -> str:
    q = question.lower()
    pronto_socorro_terms = {"convulsao", "desmaio", "sangramento intenso", "falta de ar", "dor forte no peito"}
    mesmo_dia_terms = {"sangramento", "visao embacada", "pressao alta", "dor de cabeca forte", "perda de liquido", "febre"}
    if any(term in q for term in pronto_socorro_terms):
        return "pronto_socorro"
    if any(term in q for term in mesmo_dia_terms):
        return "mesmo_dia"
    return "proxima_consulta"


def _fallback_answer(
    question: str,
    chunks: list[KnowledgeChunk],
    *,
    knowledge_loaded: bool,
    knowledge_chunks: int,
) -> GestanteChatAnswer:
    if not knowledge_loaded or not chunks:
        return GestanteChatAnswer(
            answer=(
                "Nao consegui encontrar um trecho especifico da base oficial para essa pergunta. "
                "Reformule com mais contexto (sintoma principal, tempo de inicio e intensidade) "
                "ou leve a duvida para sua consulta."
            ),
            urgency_level="sem_base",
            citations=[],
            knowledge_loaded=knowledge_loaded,
            knowledge_chunks=knowledge_chunks,
        )

    first = chunks[0]
    urgency = _infer_urgency_from_question(question)
    excerpt = _extract_relevant_excerpt(first, question)
    urgency_hint = {
        "pronto_socorro": "Pelos sinais que voce descreveu, procure atendimento de urgencia agora.",
        "mesmo_dia": "Pelos sinais descritos, e importante buscar avaliacao presencial ainda hoje.",
        "proxima_consulta": "Parece uma duvida importante para orientar com calma na proxima consulta.",
        "rotina": "Parece uma duvida de rotina e acompanhamento.",
    }.get(urgency, "Essa duvida merece acompanhamento com sua equipe.")
    return GestanteChatAnswer(
        answer=(
            "Estou com instabilidade para montar a resposta completa agora, mas quero te orientar de forma pratica. "
            f"{urgency_hint} "
            "Enquanto isso, observe como o sintoma evolui e, se piorar, procure atendimento. "
            f"O ponto mais relacionado da base fala sobre: {excerpt[:180]}."
        ),
        urgency_level=urgency,
        citations=_serialize_citations(chunks, question=question),
        knowledge_loaded=knowledge_loaded,
        knowledge_chunks=knowledge_chunks,
    )


def answer_gestante_question(db: Session, gestante: Gestante, question: str) -> GestanteChatAnswer:
    knowledge_loaded, knowledge_chunks = knowledge_stats()
    chunks = retrieve_knowledge_chunks(question)
    fallback = _fallback_answer(question, chunks, knowledge_loaded=knowledge_loaded, knowledge_chunks=knowledge_chunks)
    if not knowledge_loaded or not chunks:
        return fallback

    context = "\n\n".join(
        f"Fonte: {chunk.title} | Pagina: {chunk.page or 'n/d'} | Link: {chunk.url or 'n/d'} | Secao: {chunk.section or 'n/d'}\nTrecho: {chunk.content}"
        for chunk in chunks
    )
    history = _history_excerpt(db, gestante.id, question)
    system_prompt = (
        "Voce e uma assistente virtual de orientacao para gestantes e deve soar humana, clara e acolhedora. "
        "Responda somente com base nos trechos oficiais fornecidos. "
        "Nao invente condutas e nao cite informacoes fora do contexto. "
        "Nao copie trechos literais das fontes no corpo da resposta e nao fale sobre 'base oficial' na resposta final. "
        "Entregue orientacao pratica em linguagem simples, como conversa de chat. "
        "Se a pergunta indicar risco, seja direta e orientada a acao. "
        "Quando apropriado, termine com uma pergunta curta para continuar o atendimento. "
        "Sua saida deve ser SOMENTE JSON valido no formato "
        '{"answer":"string","urgency_level":"rotina|proxima_consulta|mesmo_dia|pronto_socorro"}.'
    )
    user_prompt = (
        f"Historico recente relacionado (use apenas se realmente ajudar na resposta atual):\n{history or 'Sem historico relevante.'}\n\n"
        f"Pergunta da gestante: {question}\n\n"
        f"Base oficial carregada:\n{context}\n\n"
        "Responda em portugues do Brasil, de forma acolhedora, objetiva e com no maximo 140 palavras."
    )

    try:
        result = get_ai_provider().generate_json(system_prompt=system_prompt, user_prompt=user_prompt)
        payload = result.payload
    except AIProviderError:
        return fallback

    answer = str(payload.get("answer", "")).strip() or fallback.answer
    urgency_level = str(payload.get("urgency_level", "")).strip().lower()
    if urgency_level not in {"rotina", "proxima_consulta", "mesmo_dia", "pronto_socorro"}:
        urgency_level = _infer_urgency_from_question(question)

    return GestanteChatAnswer(
        answer=answer,
        urgency_level=urgency_level,
        citations=_serialize_citations(chunks, question=question),
        knowledge_loaded=knowledge_loaded,
        knowledge_chunks=knowledge_chunks,
    )


def list_gestante_chat_messages(db: Session, gestante_id: str) -> list[ChatGestanteMessage]:
    return list(
        db.scalars(
            select(ChatGestanteMessage)
            .where(ChatGestanteMessage.gestante_id == gestante_id)
            .order_by(ChatGestanteMessage.created_at.asc())
        )
    )


def create_chat_message(
    db: Session,
    *,
    gestante_id: str,
    role: str,
    content: str,
    citations: list[dict] | None = None,
    urgency_level: str | None = None,
) -> ChatGestanteMessage:
    message = ChatGestanteMessage(
        gestante_id=gestante_id,
        role=role,
        content=content,
        citations_json=json.dumps(citations or [], ensure_ascii=False),
        urgency_level=urgency_level,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
