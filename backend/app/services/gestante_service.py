from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.gestante_repository import GestanteRepository
from app.schemas.gestante import GestanteMeResponse, GestanteUpdateRequest


class GestanteService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = GestanteRepository(db)

    def get_me(self, current_user: User) -> GestanteMeResponse:
        if current_user.role != "gestante":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso permitido apenas para gestantes.")

        gestante = self.repo.get_by_user_id(current_user.id)
        if not gestante:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil gestacional não encontrado.")

        return GestanteMeResponse.model_validate(gestante, from_attributes=True)

    def update_me(self, current_user: User, payload: GestanteUpdateRequest) -> GestanteMeResponse:
        if current_user.role != "gestante":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso permitido apenas para gestantes.")

        gestante = self.repo.get_by_user_id(current_user.id)
        if not gestante:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil gestacional não encontrado.")

        updated = self.repo.update(gestante, **payload.model_dump(exclude_unset=True))
        self.db.commit()
        self.db.refresh(updated)
        return GestanteMeResponse.model_validate(updated, from_attributes=True)
