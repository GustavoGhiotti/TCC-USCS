import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class ConsentimentoLGPD(Base, TimestampMixin):
    __tablename__ = "consentimentos_lgpd"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    aceito: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    versao_termo: Mapped[str] = mapped_column(String(20), nullable=False)
    aceito_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ip_origem: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    user = relationship("User", back_populates="consentimentos")
