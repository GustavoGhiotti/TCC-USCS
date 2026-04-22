import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ChatGestanteMessage(Base, TimestampMixin):
    __tablename__ = "chat_gestante_mensagens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    gestante_id: Mapped[str] = mapped_column(String(36), ForeignKey("gestantes.id"), nullable=False, index=True)
    thread_id: Mapped[str] = mapped_column(String(36), nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    citations_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    urgency_level: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
