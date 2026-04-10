from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class AuthLoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=6, max_length=128)


class AuthRegisterRequest(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=6, max_length=128)
    role: Literal["gestante", "medico"]
    nome_completo: str = Field(min_length=2, max_length=255)


class DoctorCreatePatientRequest(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=6, max_length=128)
    nome_completo: str = Field(min_length=2, max_length=255)
    telefone: str | None = Field(default=None, max_length=30)
    semanas_gestacao_atual: int | None = Field(default=None, ge=0, le=45)


class DoctorCreatePatientResponse(BaseModel):
    id: str
    email: EmailStr
    role: Literal["gestante"]
    nomeCompleto: str
    telefone: str | None = None
    semanasGestacao: int | None = None


class UserMeResponse(BaseModel):
    id: str
    email: EmailStr
    role: Literal["gestante", "medico"]
    nomeCompleto: str
    semanasGestacao: int | None = None
    consentimentoAceito: bool
    consentimentoAceitoEm: datetime | None = None


class AuthLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserMeResponse
