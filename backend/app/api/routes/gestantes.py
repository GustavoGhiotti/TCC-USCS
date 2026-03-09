from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.gestante import GestanteMeResponse, GestanteUpdateRequest
from app.services.gestante_service import GestanteService

router = APIRouter(prefix="/gestantes", tags=["Gestantes"])


@router.get("/me", response_model=GestanteMeResponse)
def get_gestante_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return GestanteService(db).get_me(current_user)


@router.put("/me", response_model=GestanteMeResponse)
def update_gestante_me(
    payload: GestanteUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return GestanteService(db).update_me(current_user, payload)
