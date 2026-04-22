from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class KnowledgeCitationOut(BaseModel):
    title: str
    page: int | None = None
    url: str | None = None
    excerpt: str = ""


class ChatGestanteMessageOut(BaseModel):
    id: str
    threadId: str
    role: Literal["user", "assistant"]
    content: str
    urgencyLevel: Literal["rotina", "proxima_consulta", "mesmo_dia", "pronto_socorro", "sem_base"] | None = None
    citations: list[KnowledgeCitationOut] = Field(default_factory=list)
    createdAt: datetime


class ChatGestanteAskIn(BaseModel):
    message: str = Field(min_length=3, max_length=3000)
    threadId: str | None = Field(default=None, min_length=1, max_length=36)


class ChatGestanteAskOut(BaseModel):
    threadId: str
    userMessage: ChatGestanteMessageOut
    assistantMessage: ChatGestanteMessageOut
    knowledgeLoaded: bool
    knowledgeChunks: int


class ChatGestanteStatusOut(BaseModel):
    knowledgeLoaded: bool
    knowledgeChunks: int


class ChatGestanteThreadOut(BaseModel):
    id: str
    title: str
    updatedAt: datetime
    messageCount: int
