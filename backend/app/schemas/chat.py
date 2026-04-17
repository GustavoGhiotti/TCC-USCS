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
    role: Literal["user", "assistant"]
    content: str
    urgencyLevel: Literal["rotina", "proxima_consulta", "mesmo_dia", "pronto_socorro", "sem_base"] | None = None
    citations: list[KnowledgeCitationOut] = Field(default_factory=list)
    createdAt: datetime


class ChatGestanteAskIn(BaseModel):
    message: str = Field(min_length=3, max_length=3000)


class ChatGestanteAskOut(BaseModel):
    userMessage: ChatGestanteMessageOut
    assistantMessage: ChatGestanteMessageOut
    knowledgeLoaded: bool
    knowledgeChunks: int


class ChatGestanteStatusOut(BaseModel):
    knowledgeLoaded: bool
    knowledgeChunks: int
