import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class RelatoDiario(Base, TimestampMixin):
    __tablename__ = "relatos_diarios"
    __table_args__ = (UniqueConstraint("gestante_id", "data_relato", name="uq_relato_gestante_data"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    gestante_id: Mapped[str] = mapped_column(String(36), ForeignKey("gestantes.id"), nullable=False, index=True)
    data_relato: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    humor: Mapped[str] = mapped_column(String(20), nullable=False)
    sintomas_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    descricao: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    nota_complementar: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pressao_sistolica: Mapped[Optional[int]] = mapped_column(nullable=True)
    pressao_diastolica: Mapped[Optional[int]] = mapped_column(nullable=True)
    frequencia_cardiaca: Mapped[Optional[int]] = mapped_column(nullable=True)
    saturacao_oxigenio: Mapped[Optional[int]] = mapped_column(nullable=True)
    peso_kg: Mapped[Optional[float]] = mapped_column(nullable=True)
    temperatura_c: Mapped[Optional[float]] = mapped_column(nullable=True)
    prioridade_clinica: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")
    destaque_consulta: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    motivo_prioridade: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    nota_medica: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
