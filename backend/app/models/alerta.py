import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Alerta(Base, TimestampMixin):
    __tablename__ = "alertas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    gestante_id: Mapped[str] = mapped_column(String(36), ForeignKey("gestantes.id"), nullable=False, index=True)
    patient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    patient_ig: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    tipo: Mapped[str] = mapped_column(String(120), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    metric_label: Mapped[str] = mapped_column(String(120), nullable=False)
    metric_value: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at_event: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)


class AlertaNota(Base, TimestampMixin):
    __tablename__ = "alertas_notas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alerta_id: Mapped[str] = mapped_column(String(36), ForeignKey("alertas.id"), nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    author_name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at_note: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
