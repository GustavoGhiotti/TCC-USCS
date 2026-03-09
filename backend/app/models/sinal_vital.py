import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class SinalVital(Base, TimestampMixin):
    __tablename__ = "sinais_vitais"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    gestante_id: Mapped[str] = mapped_column(String(36), ForeignKey("gestantes.id"), nullable=False, index=True)
    data_registro: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    pressao_sistolica: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pressao_diastolica: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    frequencia_cardiaca: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    saturacao_oxigenio: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    peso_kg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    temperatura_c: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
