from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class RelatoCreateRequest(BaseModel):
    data: date
    humor: Literal["feliz", "normal", "triste", "ansioso"]
    sintomas: list[str] = Field(default_factory=list)
    descricao: str = Field(default="", max_length=3000)
    pressao_sistolica: int | None = None
    pressao_diastolica: int | None = None
    frequencia_cardiaca: int | None = None
    saturacao_oxigenio: int | None = None
    peso_kg: float | None = None
    temperatura_c: float | None = None


class RelatoResponse(BaseModel):
    id: str
    gestante_id: str
    data: date
    humor: Literal["feliz", "normal", "triste", "ansioso"]
    sintomas: list[str]
    descricao: str | None = None
    pressao_sistolica: int | None = None
    pressao_diastolica: int | None = None
    frequencia_cardiaca: int | None = None
    saturacao_oxigenio: int | None = None
    peso_kg: float | None = None
    temperatura_c: float | None = None
    created_at: datetime
    updated_at: datetime
