from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db import base  # noqa: F401
from app.db.session import engine
from app.models.alerta import Alerta
from app.models.base import Base
from app.models.consulta import Consulta
from app.models.gestante import Gestante
from app.models.medicamento import Medicamento
from app.models.orientacao import Orientacao
from app.models.prontuario import Prontuario
from app.models.relato import RelatoDiario
from app.models.resumo_ia import ResumoIA
from app.models.sinal_vital import SinalVital
from app.models.user import User


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def seed_db(db: Session) -> None:
    has_user = db.scalar(select(User.id).limit(1))
    if has_user:
        return

    medico = User(email="doctor@gestacare.com", senha_hash=get_password_hash("123456"), role="medico", ativo=True)
    gestante_login = User(email="patient@gestacare.com", senha_hash=get_password_hash("123456"), role="gestante", ativo=True)

    extras = [
        User(email="maria@example.com", senha_hash=get_password_hash("senha123"), role="gestante", ativo=True),
        User(email="ana@example.com", senha_hash=get_password_hash("senha123"), role="gestante", ativo=True),
        User(email="paula@example.com", senha_hash=get_password_hash("senha123"), role="gestante", ativo=True),
        User(email="lucia@example.com", senha_hash=get_password_hash("senha123"), role="gestante", ativo=True),
    ]

    db.add_all([medico, gestante_login, *extras])
    db.flush()

    gestantes = [
        Gestante(user_id=gestante_login.id, nome_completo="Maria Santos", semanas_gestacao_atual=28, telefone="11999999999"),
        Gestante(user_id=extras[0].id, nome_completo="Maria Silva", semanas_gestacao_atual=30, telefone="11911111111"),
        Gestante(user_id=extras[1].id, nome_completo="Ana Santos", semanas_gestacao_atual=32, telefone="11922222222"),
        Gestante(user_id=extras[2].id, nome_completo="Paula Costa", semanas_gestacao_atual=21, telefone="11933333333"),
        Gestante(user_id=extras[3].id, nome_completo="Lucia Oliveira", semanas_gestacao_atual=36, telefone="11944444444"),
    ]
    db.add_all(gestantes)
    db.flush()

    now = datetime.now(UTC)

    for idx, g in enumerate(gestantes):
        db.add_all(
            [
                RelatoDiario(
                    gestante_id=g.id,
                    data_relato=date.today() - timedelta(days=idx),
                    humor="normal" if idx % 2 == 0 else "ansioso",
                    sintomas_json='["cansaco", "azia"]' if idx % 2 == 0 else '["tontura", "pressao alta"]',
                    descricao="Relato inicial de seed para testes.",
                ),
                Medicamento(
                    gestante_id=g.id,
                    medico_id=medico.id,
                    nome="Acido folico",
                    dosagem="5 mg",
                    frequencia="1x ao dia",
                    data_inicio=date.today() - timedelta(days=60),
                    ativo=True,
                    observacoes="Uso continuo durante gestacao.",
                ),
                Consulta(
                    gestante_id=g.id,
                    medico_id=medico.id,
                    data_hora=now + timedelta(days=7 + idx),
                    tipo="rotina",
                    status="agendada",
                    observacoes="Consulta de acompanhamento.",
                ),
                Orientacao(
                    gestante_id=g.id,
                    medico_id=medico.id,
                    data=now - timedelta(days=idx),
                    texto="Manter hidratacao e registrar sintomas diariamente.",
                    prioridade="normal",
                ),
                Prontuario(
                    gestante_id=g.id,
                    medico_id=medico.id,
                    data=now - timedelta(days=idx + 10),
                    descricao="Evolucao estavel em acompanhamento.",
                    medicamentos_prescritos_json='["Acido folico"]',
                    acoes_realizadas="Orientacoes reforcadas em consulta.",
                ),
                SinalVital(
                    gestante_id=g.id,
                    data_registro=now - timedelta(days=idx),
                    pressao_sistolica=120 + idx * 4,
                    pressao_diastolica=80 + idx * 3,
                    frequencia_cardiaca=82 + idx,
                    saturacao_oxigenio=98,
                    peso_kg=68 + idx,
                    temperatura_c=36,
                ),
            ]
        )

    first_g = gestantes[0]
    db.add(
        Alerta(
            gestante_id=first_g.id,
            patient_name=first_g.nome_completo,
            patient_ig=f"{first_g.semanas_gestacao_atual or 0}s",
            tipo="PA fora do padrao",
            severity="high",
            status="pending",
            metric_label="Pressao arterial",
            metric_value="PA: 148/95 mmHg",
            created_at_event=now,
        )
    )

    db.add(
        ResumoIA(
            gestante_id=first_g.id,
            periodo_inicio=now - timedelta(days=7),
            periodo_fim=now,
            resumo_texto="Resumo semanal com predominio de sintomas leves.",
            nivel_alerta="amarelo",
            sintomas_identificados_json='["cansaco", "azia"]',
            avisos_json='["Pressao em monitoramento"]',
            recomendacoes="Continuar monitoramento e contato com medico.",
            gerado_em=now,
        )
    )

    db.commit()
