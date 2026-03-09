from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db import base  # noqa: F401 - garante registro dos modelos no metadata
from app.db.session import engine
from app.models.base import Base
from app.models.gestante import Gestante
from app.models.relato import RelatoDiario
from app.models.user import User


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def seed_db(db: Session) -> None:
    has_user = db.scalar(select(User.id).limit(1))
    if has_user:
        return

    medico = User(
        email="doctor@gestacare.com",
        senha_hash=get_password_hash("123456"),
        role="medico",
        ativo=True,
    )
    gestante = User(
        email="patient@gestacare.com",
        senha_hash=get_password_hash("123456"),
        role="gestante",
        ativo=True,
    )
    db.add_all([medico, gestante])
    db.flush()

    db.add(
        Gestante(
            user_id=gestante.id,
            nome_completo="Maria Santos",
            semanas_gestacao_atual=28,
            telefone="11999999999",
        )
    )
    db.flush()

    gestante_row = db.scalar(select(Gestante).where(Gestante.user_id == gestante.id))
    if gestante_row:
        db.add(
            RelatoDiario(
                gestante_id=gestante_row.id,
                data_relato=date.today(),
                humor="normal",
                sintomas_json='["Cansaco leve"]',
                descricao="Relato inicial criado automaticamente.",
            )
        )

    db.commit()
