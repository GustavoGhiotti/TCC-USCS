import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Gestante(Base, TimestampMixin):
    __tablename__ = "gestantes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)

    nome_completo: Mapped[str] = mapped_column(String(255), nullable=False)
    data_nascimento: Mapped[date | None] = mapped_column(Date, nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    dum: Mapped[date | None] = mapped_column(Date, nullable=True)
    dpp: Mapped[date | None] = mapped_column(Date, nullable=True)
    tipo_sanguineo: Mapped[str | None] = mapped_column(String(8), nullable=True)
    semanas_gestacao_atual: Mapped[int | None] = mapped_column(nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="gestante")
