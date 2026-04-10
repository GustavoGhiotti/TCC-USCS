import json
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.gestante_repository import GestanteRepository
from app.repositories.relato_repository import RelatoRepository
from app.schemas.relato import RelatoCreateRequest, RelatoResponse
from app.models.sinal_vital import SinalVital


class RelatoService:
    def __init__(self, db: Session):
        self.db = db
        self.gestante_repo = GestanteRepository(db)
        self.relato_repo = RelatoRepository(db)

    def _resolve_gestante_id(self, user: User) -> str:
        if user.role != "gestante":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso permitido apenas para gestantes.")

        gestante = self.gestante_repo.get_by_user_id(user.id)
        if not gestante:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil gestacional não encontrado.")
        return gestante.id

    def list_me(self, user: User, periodo: str = "todos") -> list[RelatoResponse]:
        gestante_id = self._resolve_gestante_id(user)
        relatos = self.relato_repo.list_by_gestante(gestante_id)

        if periodo in {"7d", "30d"}:
            dias = 7 if periodo == "7d" else 30
            cutoff = date.today() - timedelta(days=dias)
            relatos = [r for r in relatos if r.data_relato >= cutoff]

        return [self._to_response(r) for r in relatos]

    def get_me_by_id(self, user: User, relato_id: str) -> RelatoResponse:
        gestante_id = self._resolve_gestante_id(user)
        relato = self.relato_repo.get_by_id_and_gestante(relato_id, gestante_id)
        if not relato:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relato não encontrado.")
        return self._to_response(relato)

    def create_or_update_me(self, user: User, payload: RelatoCreateRequest) -> RelatoResponse:
        gestante_id = self._resolve_gestante_id(user)
        existing = self.relato_repo.get_by_date(gestante_id, payload.data)

        if existing:
            existing.humor = payload.humor
            existing.sintomas_json = json.dumps(payload.sintomas, ensure_ascii=False)
            existing.descricao = payload.descricao or None
            existing.pressao_sistolica = payload.pressao_sistolica
            existing.pressao_diastolica = payload.pressao_diastolica
            existing.frequencia_cardiaca = payload.frequencia_cardiaca
            existing.saturacao_oxigenio = payload.saturacao_oxigenio
            existing.peso_kg = payload.peso_kg
            existing.temperatura_c = payload.temperatura_c
            self.db.add(existing)
            self._upsert_vitals_for_report(gestante_id, existing.data_relato, payload)
            self.db.commit()
            self.db.refresh(existing)
            return self._to_response(existing)

        relato = self.relato_repo.create(
            gestante_id=gestante_id,
            data_relato=payload.data,
            humor=payload.humor,
            sintomas_json=json.dumps(payload.sintomas, ensure_ascii=False),
            descricao=payload.descricao or None,
            pressao_sistolica=payload.pressao_sistolica,
            pressao_diastolica=payload.pressao_diastolica,
            frequencia_cardiaca=payload.frequencia_cardiaca,
            saturacao_oxigenio=payload.saturacao_oxigenio,
            peso_kg=payload.peso_kg,
            temperatura_c=payload.temperatura_c,
        )
        self._upsert_vitals_for_report(gestante_id, payload.data, payload)
        self.db.commit()
        self.db.refresh(relato)
        return self._to_response(relato)

    def _upsert_vitals_for_report(self, gestante_id: str, report_date: date, payload: RelatoCreateRequest) -> None:
        has_vitals = any(
            value is not None
            for value in (
                payload.pressao_sistolica,
                payload.pressao_diastolica,
                payload.frequencia_cardiaca,
                payload.saturacao_oxigenio,
                payload.peso_kg,
                payload.temperatura_c,
            )
        )
        if not has_vitals:
            return

        report_dt = datetime.combine(report_date, datetime.min.time())
        existing = self.db.query(SinalVital).filter(
            SinalVital.gestante_id == gestante_id,
            SinalVital.data_registro == report_dt,
        ).one_or_none()

        if existing:
            existing.pressao_sistolica = payload.pressao_sistolica
            existing.pressao_diastolica = payload.pressao_diastolica
            existing.frequencia_cardiaca = payload.frequencia_cardiaca
            existing.saturacao_oxigenio = payload.saturacao_oxigenio
            existing.peso_kg = payload.peso_kg
            existing.temperatura_c = payload.temperatura_c
            self.db.add(existing)
            return

        self.db.add(
            SinalVital(
                gestante_id=gestante_id,
                data_registro=report_dt,
                pressao_sistolica=payload.pressao_sistolica,
                pressao_diastolica=payload.pressao_diastolica,
                frequencia_cardiaca=payload.frequencia_cardiaca,
                saturacao_oxigenio=payload.saturacao_oxigenio,
                peso_kg=payload.peso_kg,
                temperatura_c=payload.temperatura_c,
            )
        )

    @staticmethod
    def _to_response(relato) -> RelatoResponse:
        try:
            sintomas = json.loads(relato.sintomas_json) if relato.sintomas_json else []
        except json.JSONDecodeError:
            sintomas = []

        return RelatoResponse(
            id=relato.id,
            gestante_id=relato.gestante_id,
            data=relato.data_relato,
            humor=relato.humor,
            sintomas=sintomas,
            descricao=relato.descricao,
            pressao_sistolica=relato.pressao_sistolica,
            pressao_diastolica=relato.pressao_diastolica,
            frequencia_cardiaca=relato.frequencia_cardiaca,
            saturacao_oxigenio=relato.saturacao_oxigenio,
            peso_kg=relato.peso_kg,
            temperatura_c=relato.temperatura_c,
            created_at=relato.created_at,
            updated_at=relato.updated_at,
        )
