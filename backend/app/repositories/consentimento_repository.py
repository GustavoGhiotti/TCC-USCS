from datetime import datetime

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.consentimento import ConsentimentoLGPD


class ConsentimentoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_latest_by_user_id(self, user_id: str) -> ConsentimentoLGPD | None:
        stmt = select(ConsentimentoLGPD).where(ConsentimentoLGPD.user_id == user_id).order_by(
            desc(ConsentimentoLGPD.aceito_em)
        )
        return self.db.scalar(stmt)

    def create_accepted(self, *, user_id: str, versao_termo: str, aceito_em: datetime, ip_origem: str | None):
        consentimento = ConsentimentoLGPD(
            user_id=user_id,
            aceito=True,
            versao_termo=versao_termo,
            aceito_em=aceito_em,
            ip_origem=ip_origem,
        )
        self.db.add(consentimento)
        self.db.flush()
        return consentimento
