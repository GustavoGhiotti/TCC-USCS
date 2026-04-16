import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ExameArquivo(Base, TimestampMixin):
    __tablename__ = "exames_arquivos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    gestante_id: Mapped[str] = mapped_column(String(36), ForeignKey("gestantes.id"), nullable=False, index=True)
    uploaded_by_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String(160), nullable=False)
    tipo_exame: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    data_exame: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    observacoes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    nome_arquivo: Mapped[str] = mapped_column(String(255), nullable=False)
    nome_arquivo_salvo: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    mime_type: Mapped[str] = mapped_column(String(80), nullable=False, default="application/pdf")
    tamanho_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
