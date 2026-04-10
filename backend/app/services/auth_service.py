from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.repositories.consentimento_repository import ConsentimentoRepository
from app.repositories.gestante_repository import GestanteRepository
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.schemas.auth import (
    AuthLoginRequest,
    AuthLoginResponse,
    AuthRegisterRequest,
    DoctorCreatePatientRequest,
    DoctorCreatePatientResponse,
    UserMeResponse,
)


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.gestante_repo = GestanteRepository(db)
        self.consent_repo = ConsentimentoRepository(db)

    def register(self, payload: AuthRegisterRequest) -> UserMeResponse:
        existing = self.user_repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado.")

        user = self.user_repo.create(
            email=payload.email,
            senha_hash=get_password_hash(payload.senha),
            role=payload.role,
        )

        if payload.role == "gestante":
            self.gestante_repo.create(user_id=user.id, nome_completo=payload.nome_completo)

        self.db.commit()
        return self.build_user_me(user.id)

    def create_patient_by_doctor(self, current_user: User, payload: DoctorCreatePatientRequest) -> DoctorCreatePatientResponse:
        if current_user.role != "medico":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas médicos podem cadastrar pacientes.")

        existing = self.user_repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado.")

        user = self.user_repo.create(
            email=payload.email,
            senha_hash=get_password_hash(payload.senha),
            role="gestante",
        )

        gestante = self.gestante_repo.create(
            user_id=user.id,
            nome_completo=payload.nome_completo,
            semanas_gestacao_atual=payload.semanas_gestacao_atual,
        )

        if payload.telefone:
            self.gestante_repo.update(gestante, telefone=payload.telefone)

        self.db.commit()
        return DoctorCreatePatientResponse(
            id=user.id,
            email=user.email,
            role="gestante",
            nomeCompleto=gestante.nome_completo,
            telefone=gestante.telefone,
            semanasGestacao=gestante.semanas_gestacao_atual,
        )

    def login(self, payload: AuthLoginRequest) -> AuthLoginResponse:
        user = self.user_repo.get_by_email(payload.email)
        if not user or not verify_password(payload.senha, user.senha_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas.")

        access_token = create_access_token(user.id)
        return AuthLoginResponse(access_token=access_token, user=self.build_user_me(user.id))

    def build_user_me(self, user_id: str) -> UserMeResponse:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

        gestante = self.gestante_repo.get_by_user_id(user.id) if user.role == "gestante" else None
        consentimento = self.consent_repo.get_latest_by_user_id(user.id)

        return UserMeResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            nomeCompleto=gestante.nome_completo if gestante else user.email.split("@")[0],
            semanasGestacao=gestante.semanas_gestacao_atual if gestante else None,
            consentimentoAceito=bool(consentimento and consentimento.aceito),
            consentimentoAceitoEm=consentimento.aceito_em if consentimento else None,
        )
