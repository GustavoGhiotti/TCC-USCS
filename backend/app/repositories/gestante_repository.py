from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.gestante import Gestante


class GestanteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: str) -> Gestante | None:
        stmt = select(Gestante).where(Gestante.user_id == user_id)
        return self.db.scalar(stmt)

    def create(self, *, user_id: str, nome_completo: str, semanas_gestacao_atual: int | None = None) -> Gestante:
        gestante = Gestante(
            user_id=user_id,
            nome_completo=nome_completo,
            semanas_gestacao_atual=semanas_gestacao_atual,
        )
        self.db.add(gestante)
        self.db.flush()
        return gestante

    def update(self, gestante: Gestante, **fields) -> Gestante:
        for key, value in fields.items():
            if value is not None or key in {"observacoes", "telefone", "tipo_sanguineo"}:
                setattr(gestante, key, value)
        self.db.add(gestante)
        self.db.flush()
        return gestante
