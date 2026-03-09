from datetime import datetime

from pydantic import BaseModel, Field


class ConsentimentoCreateRequest(BaseModel):
    versao_termo: str = Field(default="1.0", min_length=1, max_length=20)


class ConsentimentoResponse(BaseModel):
    id: str
    user_id: str
    aceito: bool
    versao_termo: str
    aceito_em: datetime
    ip_origem: str | None = None
