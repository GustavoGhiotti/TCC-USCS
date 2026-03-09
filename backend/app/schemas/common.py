from datetime import datetime

from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str


class ConsentimentoStatus(BaseModel):
    aceito: bool
    versao_termo: str | None = None
    aceito_em: datetime | None = None
