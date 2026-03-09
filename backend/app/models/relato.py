import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, String, Text, UniqueConstraint
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
