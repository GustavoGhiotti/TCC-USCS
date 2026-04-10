import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ResumoIA(Base, TimestampMixin):
    __tablename__ = "resumos_ia"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    gestante_id: Mapped[str] = mapped_column(String(36), ForeignKey("gestantes.id"), nullable=False, index=True)
    periodo_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    periodo_fim: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resumo_texto: Mapped[str] = mapped_column(Text, nullable=False)
    nivel_alerta: Mapped[str] = mapped_column(String(20), default="verde", nullable=False)
    sintomas_identificados_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    avisos_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    recomendacoes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    resumo_aprovado_texto: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recomendacoes_aprovadas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    revisado_por_medico_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    revisado_em: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    gerado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
