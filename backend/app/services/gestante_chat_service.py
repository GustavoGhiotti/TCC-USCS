import json
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chat_gestante_message import ChatGestanteMessage
from app.models.gestante import Gestante
from app.services.ai_provider import AIProviderError, get_ai_provider
from app.services.knowledge_base_service import KnowledgeChunk, knowledge_stats, retrieve_knowledge_chunks


@dataclass
class GestanteChatAnswer:
    answer: str
    urgency_level: str
    citations: list[dict]
    knowledge_loaded: bool
    knowledge_chunks: int


def _serialize_citations(chunks: list[KnowledgeChunk]) -> list[dict]:
    return [
        {
            "title": chunk.title,
            "page": chunk.page,
            "url": chunk.url,
            "excerpt": chunk.content[:240].strip(),
        }
        for chunk in chunks
    ]


def _history_excerpt(db: Session, gestante_id: str, limit: int = 6) -> str:
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
    return "\n".join(f"{item.role}: {item.content}" for item in ordered)


def _fallback_answer(chunks: list[KnowledgeChunk], *, knowledge_loaded: bool, knowledge_chunks: int) -> GestanteChatAnswer:
    if not knowledge_loaded or not chunks:
        return GestanteChatAnswer(
            answer=(
                "Ainda nao encontrei trechos suficientes na base oficial carregada para responder com seguranca. "
                "Adicione os capitulos/manuais no banco de conhecimento antes de usar esta duvida no chat."
            ),
            urgency_level="sem_base",
            citations=[],
            knowledge_loaded=knowledge_loaded,
            knowledge_chunks=knowledge_chunks,
        )

    first = chunks[0]
    return GestanteChatAnswer(
        answer=(
            "Encontrei uma referencia relacionada na base oficial carregada. "
            f"Considere este trecho para orientacao inicial: {first.content[:320].strip()}"
        ),
        urgency_level="proxima_consulta",
        citations=_serialize_citations(chunks),
        knowledge_loaded=knowledge_loaded,
        knowledge_chunks=knowledge_chunks,
    )


def answer_gestante_question(db: Session, gestante: Gestante, question: str) -> GestanteChatAnswer:
    knowledge_loaded, knowledge_chunks = knowledge_stats()
    chunks = retrieve_knowledge_chunks(question)
    fallback = _fallback_answer(chunks, knowledge_loaded=knowledge_loaded, knowledge_chunks=knowledge_chunks)
    if not knowledge_loaded or not chunks:
        return fallback

    context = "\n\n".join(
        f"Fonte: {chunk.title} | Pagina: {chunk.page or 'n/d'} | Link: {chunk.url or 'n/d'} | Secao: {chunk.section or 'n/d'}\nTrecho: {chunk.content}"
        for chunk in chunks
    )
    history = _history_excerpt(db, gestante.id)
    system_prompt = (
        "Voce e uma assistente de orientacao para gestantes. "
        "Responda somente com base nos trechos oficiais fornecidos. "
        "Nao invente condutas. Nao cite informacoes fora do contexto. "
        "Se a pergunta indicar risco, seja direta. "
        "Sua saida deve ser SOMENTE JSON valido no formato "
        '{"answer":"string","urgency_level":"rotina|proxima_consulta|mesmo_dia|pronto_socorro"}.'
    )
    user_prompt = (
        f"Historico recente da conversa:\n{history or 'Sem historico relevante.'}\n\n"
        f"Pergunta da gestante: {question}\n\n"
        f"Base oficial carregada:\n{context}\n\n"
        "Responda em portugues do Brasil, de forma acolhedora, objetiva e com no maximo 180 palavras."
    )

    try:
        result = get_ai_provider().generate_json(system_prompt=system_prompt, user_prompt=user_prompt)
        payload = result.payload
    except AIProviderError:
        return fallback

    answer = str(payload.get("answer", "")).strip() or fallback.answer
    urgency_level = str(payload.get("urgency_level", "")).strip().lower()
    if urgency_level not in {"rotina", "proxima_consulta", "mesmo_dia", "pronto_socorro"}:
        urgency_level = fallback.urgency_level

    return GestanteChatAnswer(
        answer=answer,
        urgency_level=urgency_level,
        citations=_serialize_citations(chunks),
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
