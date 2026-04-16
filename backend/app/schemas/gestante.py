from datetime import date

from pydantic import BaseModel, Field


class GestanteMeResponse(BaseModel):
    id: str
    user_id: str
    nome_completo: str
    data_nascimento: date | None = None
    telefone: str | None = None
    dum: date | None = None
    dpp: date | None = None
    tipo_sanguineo: str | None = None
    semanas_gestacao_atual: int | None = None
    observacoes: str | None = None


class GestanteUpdateRequest(BaseModel):
    nome_completo: str | None = Field(default=None, min_length=2, max_length=255)
    data_nascimento: date | None = None
    telefone: str | None = Field(default=None, max_length=30)
