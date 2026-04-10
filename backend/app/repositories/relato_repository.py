from datetime import date

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.relato import RelatoDiario


class RelatoRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_gestante(self, gestante_id: str) -> list[RelatoDiario]:
        stmt = (
            select(RelatoDiario)
            .where(RelatoDiario.gestante_id == gestante_id)
            .order_by(desc(RelatoDiario.data_relato), desc(RelatoDiario.created_at))
        )
        return list(self.db.scalars(stmt).all())

    def get_by_id_and_gestante(self, relato_id: str, gestante_id: str) -> RelatoDiario | None:
        stmt = select(RelatoDiario).where(
            RelatoDiario.id == relato_id, RelatoDiario.gestante_id == gestante_id
        )
        return self.db.scalar(stmt)

    def get_by_date(self, gestante_id: str, data_relato: date) -> RelatoDiario | None:
        stmt = select(RelatoDiario).where(
            RelatoDiario.gestante_id == gestante_id, RelatoDiario.data_relato == data_relato
        )
        return self.db.scalar(stmt)

    def create(
        self,
        *,
        gestante_id: str,
        data_relato: date,
        humor: str,
        sintomas_json: str,
        descricao: str | None,
        pressao_sistolica: int | None,
        pressao_diastolica: int | None,
        frequencia_cardiaca: int | None,
        saturacao_oxigenio: int | None,
        peso_kg: float | None,
        temperatura_c: float | None,
    ) -> RelatoDiario:
        relato = RelatoDiario(
            gestante_id=gestante_id,
            data_relato=data_relato,
            humor=humor,
            sintomas_json=sintomas_json,
            descricao=descricao,
            pressao_sistolica=pressao_sistolica,
            pressao_diastolica=pressao_diastolica,
            frequencia_cardiaca=frequencia_cardiaca,
            saturacao_oxigenio=saturacao_oxigenio,
            peso_kg=peso_kg,
            temperatura_c=temperatura_c,
        )
        self.db.add(relato)
        self.db.flush()
        return relato
