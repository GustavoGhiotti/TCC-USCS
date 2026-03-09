from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import ConsentimentoStatus
from app.schemas.consentimento import ConsentimentoCreateRequest, ConsentimentoResponse
from app.services.consentimento_service import ConsentimentoService

router = APIRouter(prefix="/consentimentos", tags=["Consentimentos LGPD"])


@router.get("/me", response_model=ConsentimentoStatus)
def get_consentimento_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return ConsentimentoService(db).get_status(current_user)


@router.post("/me", response_model=ConsentimentoResponse, status_code=status.HTTP_201_CREATED)
def post_consentimento_me(
    payload: ConsentimentoCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ConsentimentoService(db).aceitar(current_user, payload, request)
