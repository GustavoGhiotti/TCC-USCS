import json
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import (
    ChatGestanteAskIn,
    ChatGestanteAskOut,
    ChatGestanteMessageOut,
    ChatGestanteStatusOut,
    ChatGestanteThreadOut,
    KnowledgeCitationOut,
)
from app.services.gestante_chat_service import (
    answer_gestante_question,
    create_chat_message,
    create_chat_thread_id,
    list_gestante_chat_messages,
    list_gestante_chat_threads,
)
from app.services.knowledge_base_service import knowledge_stats
from app.services.gestante_service import GestanteService

router = APIRouter(prefix="/chat-gestante", tags=["Chat Gestante"])


def _require_gestante(user: User):
    if user.role != "gestante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso permitido apenas para gestantes.")


def _map_message(message) -> ChatGestanteMessageOut:
    try:
        citations = json.loads(message.citations_json or "[]")
    except json.JSONDecodeError:
        citations = []
    return ChatGestanteMessageOut(
        id=message.id,
        threadId=message.thread_id,
        role=("assistant" if message.role == "assistant" else "user"),
        content=message.content,
        urgencyLevel=message.urgency_level,
        citations=[KnowledgeCitationOut(**item) for item in citations if isinstance(item, dict)],
        createdAt=message.created_at,
    )


@router.get("/me", response_model=list[ChatGestanteMessageOut])
def get_chat_history(threadId: str | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_gestante(current_user)
    gestante = GestanteService(db).repo.get_by_user_id(current_user.id)
    if not gestante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil gestacional nao encontrado.")
    return [_map_message(item) for item in list_gestante_chat_messages(db, gestante.id, threadId)]


@router.get("/threads", response_model=list[ChatGestanteThreadOut])
def get_chat_threads(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_gestante(current_user)
    gestante = GestanteService(db).repo.get_by_user_id(current_user.id)
    if not gestante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil gestacional nao encontrado.")
    return [ChatGestanteThreadOut(**item) for item in list_gestante_chat_threads(db, gestante.id)]


@router.post("/threads", response_model=ChatGestanteThreadOut)
def create_chat_thread(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_gestante(current_user)
    gestante = GestanteService(db).repo.get_by_user_id(current_user.id)
    if not gestante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil gestacional nao encontrado.")
    thread_id = create_chat_thread_id()
    return ChatGestanteThreadOut(id=thread_id, title="Nova conversa", updatedAt=datetime.now(UTC), messageCount=0)


@router.get("/status", response_model=ChatGestanteStatusOut)
def get_chat_status(current_user: User = Depends(get_current_user)):
    _require_gestante(current_user)
    loaded, chunks = knowledge_stats()
    return ChatGestanteStatusOut(knowledgeLoaded=loaded, knowledgeChunks=chunks)


@router.post("/perguntar", response_model=ChatGestanteAskOut)
def ask_chat_question(
    payload: ChatGestanteAskIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_gestante(current_user)
    gestante = GestanteService(db).repo.get_by_user_id(current_user.id)
    if not gestante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil gestacional nao encontrado.")

    thread_id = payload.threadId or create_chat_thread_id()
    user_message = create_chat_message(
        db,
        gestante_id=gestante.id,
        thread_id=thread_id,
        role="user",
        content=payload.message.strip(),
    )
    answer = answer_gestante_question(db, gestante, payload.message.strip(), thread_id=thread_id)
    assistant_message = create_chat_message(
        db,
        gestante_id=gestante.id,
        thread_id=thread_id,
        role="assistant",
        content=answer.answer,
        citations=answer.citations,
        urgency_level=answer.urgency_level,
    )
    return ChatGestanteAskOut(
        threadId=thread_id,
        userMessage=_map_message(user_message),
        assistantMessage=_map_message(assistant_message),
        knowledgeLoaded=answer.knowledge_loaded,
        knowledgeChunks=answer.knowledge_chunks,
    )
