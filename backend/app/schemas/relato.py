from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class RelatoCreateRequest(BaseModel):
    data: date
    humor: Literal["feliz", "normal", "triste", "ansioso"]
    sintomas: list[str] = Field(default_factory=list)
    descricao: str = Field(default="", max_length=3000)


class RelatoResponse(BaseModel):
    id: str
    gestante_id: str
    data: date
    humor: Literal["feliz", "normal", "triste", "ansioso"]
    sintomas: list[str]
    descricao: str | None = None
    created_at: datetime
    updated_at: datetime
