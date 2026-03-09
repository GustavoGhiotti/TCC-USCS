from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.relato import RelatoCreateRequest, RelatoResponse
from app.services.relato_service import RelatoService

router = APIRouter(prefix="/relatos", tags=["Relatos"])


@router.post("", response_model=RelatoResponse)
def create_relato(payload: RelatoCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return RelatoService(db).create_or_update_me(current_user, payload)


@router.get("/me", response_model=list[RelatoResponse])
def list_relatos_me(
    periodo: str = "todos", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return RelatoService(db).list_me(current_user, periodo=periodo)


@router.get("/me/{relato_id}", response_model=RelatoResponse)
def get_relato_me(relato_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return RelatoService(db).get_me_by_id(current_user, relato_id)
