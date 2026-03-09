from datetime import UTC, datetime

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.consentimento_repository import ConsentimentoRepository
from app.schemas.common import ConsentimentoStatus
from app.schemas.consentimento import ConsentimentoCreateRequest, ConsentimentoResponse


class ConsentimentoService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ConsentimentoRepository(db)

    def get_status(self, user: User) -> ConsentimentoStatus:
        consentimento = self.repo.get_latest_by_user_id(user.id)
        if not consentimento:
            return ConsentimentoStatus(aceito=False)

        return ConsentimentoStatus(
            aceito=consentimento.aceito,
            versao_termo=consentimento.versao_termo,
            aceito_em=consentimento.aceito_em,
        )

    def aceitar(self, user: User, payload: ConsentimentoCreateRequest, request: Request) -> ConsentimentoResponse:
        ip_origem = request.client.host if request.client else None
        consentimento = self.repo.create_accepted(
            user_id=user.id,
            versao_termo=payload.versao_termo,
            aceito_em=datetime.now(UTC),
            ip_origem=ip_origem,
        )
        self.db.commit()
        self.db.refresh(consentimento)
        return ConsentimentoResponse.model_validate(consentimento, from_attributes=True)
