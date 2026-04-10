import json
from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, desc, func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.alerta import Alerta, AlertaNota
from app.models.consulta import Consulta
from app.models.gestante import Gestante
from app.models.medicamento import Medicamento
from app.models.orientacao import Orientacao
from app.models.prontuario import Prontuario
from app.models.relato import RelatoDiario
from app.models.resumo_ia import ResumoIA
from app.models.sinal_vital import SinalVital
from app.models.user import User
from app.schemas.care import (
    AlertNoteIn,
    AlertNoteOut,
    AlertOut,
    AlertsKPIOut,
    ConsultaIn,
    ConsultaOut,
    MedicoKPIOut,
    MedicoPacienteOut,
    MedicamentoIn,
    MedicamentoOut,
    OrientacaoIn,
    OrientacaoOut,
    ProntuarioIn,
    ProntuarioOut,
    ResumoGerarIn,
    ResumoOut,
    ResumoReviewIn,
    SinalVitalIn,
    SinalVitalOut,
)

router = APIRouter(tags=["Care"])


def _require_role(user: User, role: str):
    if user.role != role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado para esse perfil.")


def _get_gestante_by_user(db: Session, user_id: str) -> Gestante:
    gestante = db.scalar(select(Gestante).where(Gestante.user_id == user_id))
    if not gestante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gestante nao encontrada.")
    return gestante


def _get_gestante_by_id(db: Session, gestante_id: str) -> Gestante:
    gestante = db.scalar(select(Gestante).where(Gestante.id == gestante_id))
    if not gestante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gestante nao encontrada.")
    return gestante


def _semaforo_from_alerts(alerts: list[str]) -> str:
    if any(a in {"pressao alta", "edema severo", "sangramento", "convulsao"} for a in alerts):
        return "vermelho"
    if any(a in {"tontura", "contracoes", "cefaleia", "dor de cabeca"} for a in alerts):
        return "amarelo"
    return "verde"


def _map_resumo_out(resumo: ResumoIA, *, for_patient: bool) -> ResumoOut:
    resumo_texto = resumo.resumo_aprovado_texto if for_patient and resumo.resumo_aprovado_texto else resumo.resumo_texto
    recomendacoes = (
        resumo.recomendacoes_aprovadas
        if for_patient and resumo.recomendacoes_aprovadas
        else (resumo.recomendacoes or "")
    )
    return ResumoOut(
        id=resumo.id,
        gestanteId=resumo.gestante_id,
        relatoId=resumo.id,
        data=resumo.gerado_em.date(),
        tipo="semanal",
        semaforo=(resumo.nivel_alerta if resumo.nivel_alerta in {"verde", "amarelo", "vermelho"} else "verde"),
        resumo=resumo_texto,
        sintomasIdentificados=json.loads(resumo.sintomas_identificados_json or "[]"),
        avisos=json.loads(resumo.avisos_json or "[]"),
        recomendacoes=recomendacoes,
        status=(resumo.status if resumo.status in {"pending", "approved"} else "pending"),
        aprovadoEm=resumo.revisado_em,
    )


@router.get("/medicamentos/me", response_model=list[MedicamentoOut])
def medicamentos_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "gestante")
    gestante = _get_gestante_by_user(db, current_user.id)
    meds = list(db.scalars(select(Medicamento).where(Medicamento.gestante_id == gestante.id).order_by(desc(Medicamento.created_at))))
    return [
        MedicamentoOut(
            id=m.id,
            gestanteId=m.gestante_id,
            nome=m.nome,
            dosagem=m.dosagem,
            frequencia=m.frequencia,
            dataInicio=m.data_inicio,
            dataFim=m.data_fim,
            dataPrescricao=(m.data_inicio or date.today()),
            ativo=m.ativo,
            observacoes=m.observacoes,
        )
        for m in meds
    ]


@router.post("/medicamentos", response_model=MedicamentoOut)
def create_medicamento(payload: MedicamentoIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    _get_gestante_by_id(db, payload.gestanteId)

    med = Medicamento(
        gestante_id=payload.gestanteId,
        medico_id=current_user.id,
        nome=payload.nome,
        dosagem=payload.dosagem,
        frequencia=payload.frequencia,
        data_inicio=payload.dataInicio,
        data_fim=payload.dataFim,
        ativo=payload.ativo,
        observacoes=payload.observacoes,
    )
    db.add(med)
    db.commit()
    db.refresh(med)

    return MedicamentoOut(
        id=med.id,
        gestanteId=med.gestante_id,
        nome=med.nome,
        dosagem=med.dosagem,
        frequencia=med.frequencia,
        dataInicio=med.data_inicio,
        dataFim=med.data_fim,
        dataPrescricao=(med.data_inicio or date.today()),
        ativo=med.ativo,
        observacoes=med.observacoes,
    )


@router.get("/consultas/me", response_model=list[ConsultaOut])
def consultas_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "gestante")
    gestante = _get_gestante_by_user(db, current_user.id)
    consultas = list(db.scalars(select(Consulta).where(Consulta.gestante_id == gestante.id).order_by(desc(Consulta.data_hora))))
    return [
        ConsultaOut(
            id=c.id,
            gestanteId=c.gestante_id,
            data=c.data_hora.date(),
            tipo=(c.tipo if c.tipo in {"ultrassom", "pressao", "rotina", "emergencia"} else "rotina"),
            observacoes=c.observacoes,
            status=c.status,
        )
        for c in consultas
    ]


@router.post("/consultas", response_model=ConsultaOut)
def create_consulta(payload: ConsultaIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    _get_gestante_by_id(db, payload.gestanteId)
    c = Consulta(
        gestante_id=payload.gestanteId,
        medico_id=current_user.id,
        data_hora=datetime.combine(payload.data, datetime.min.time()).replace(tzinfo=UTC),
        tipo=payload.tipo,
        status="agendada",
        observacoes=payload.observacoes,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return ConsultaOut(
        id=c.id,
        gestanteId=c.gestante_id,
        data=c.data_hora.date(),
        tipo=payload.tipo,
        observacoes=c.observacoes,
        status=c.status,
    )


@router.get("/orientacoes/me", response_model=list[OrientacaoOut])
def orientacoes_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "gestante")
    gestante = _get_gestante_by_user(db, current_user.id)
    data = list(db.scalars(select(Orientacao).where(Orientacao.gestante_id == gestante.id).order_by(desc(Orientacao.data))))
    return [
        OrientacaoOut(
            id=o.id,
            gestanteId=o.gestante_id,
            medicoId=o.medico_id,
            data=o.data.date(),
            texto=o.texto,
        )
        for o in data
    ]


@router.post("/orientacoes", response_model=OrientacaoOut)
def create_orientacao(payload: OrientacaoIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    _get_gestante_by_id(db, payload.gestanteId)
    o = Orientacao(
        gestante_id=payload.gestanteId,
        medico_id=current_user.id,
        data=datetime.combine(payload.data, datetime.min.time()).replace(tzinfo=UTC),
        texto=payload.texto,
        prioridade="normal",
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return OrientacaoOut(id=o.id, gestanteId=o.gestante_id, medicoId=o.medico_id, data=o.data.date(), texto=o.texto)


@router.get("/prontuarios/me", response_model=list[ProntuarioOut])
def prontuarios_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "gestante")
    gestante = _get_gestante_by_user(db, current_user.id)
    rows = list(db.scalars(select(Prontuario).where(Prontuario.gestante_id == gestante.id).order_by(desc(Prontuario.data))))
    return [
        ProntuarioOut(
            id=r.id,
            gestanteId=r.gestante_id,
            data=r.data.date(),
            descricao=r.descricao,
            medicamentosPrescritos=json.loads(r.medicamentos_prescritos_json or "[]"),
            acoesRealizadas=r.acoes_realizadas or "",
            medicoId=r.medico_id,
        )
        for r in rows
    ]


@router.post("/prontuarios", response_model=ProntuarioOut)
def create_prontuario(payload: ProntuarioIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    _get_gestante_by_id(db, payload.gestanteId)
    r = Prontuario(
        gestante_id=payload.gestanteId,
        medico_id=current_user.id,
        data=datetime.combine(payload.data, datetime.min.time()).replace(tzinfo=UTC),
        descricao=payload.descricao,
        medicamentos_prescritos_json=json.dumps(payload.medicamentosPrescritos, ensure_ascii=False),
        acoes_realizadas=payload.acoesRealizadas,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return ProntuarioOut(
        id=r.id,
        gestanteId=r.gestante_id,
        data=r.data.date(),
        descricao=r.descricao,
        medicamentosPrescritos=json.loads(r.medicamentos_prescritos_json),
        acoesRealizadas=r.acoes_realizadas or "",
        medicoId=r.medico_id,
    )


@router.get("/resumos-ia/me", response_model=list[ResumoOut])
def resumos_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "gestante")
    gestante = _get_gestante_by_user(db, current_user.id)
    rows = list(
        db.scalars(
            select(ResumoIA)
            .where(and_(ResumoIA.gestante_id == gestante.id, ResumoIA.status == "approved"))
            .order_by(desc(ResumoIA.gerado_em))
        )
    )
    return [_map_resumo_out(r, for_patient=True) for r in rows]


@router.post("/resumos-ia/gerar", response_model=ResumoOut)
def gerar_resumo(payload: ResumoGerarIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    gestante = _get_gestante_by_id(db, payload.gestanteId)

    relatos = list(
        db.scalars(
            select(RelatoDiario).where(
                and_(
                    RelatoDiario.gestante_id == gestante.id,
                    RelatoDiario.data_relato >= payload.periodo_inicio.date(),
                    RelatoDiario.data_relato <= payload.periodo_fim.date(),
                )
            )
        )
    )
    sintomas: list[str] = []
    for r in relatos:
        sintomas.extend(json.loads(r.sintomas_json or "[]"))

    sintomas_freq: dict[str, int] = {}
    for s in sintomas:
        sintomas_freq[s] = sintomas_freq.get(s, 0) + 1
    top = sorted(sintomas_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    top_list = [k for k, _ in top]

    avisos = [s for s in top_list if s.lower() in {"pressao alta", "edema severo", "sangramento", "contracoes"}]
    semaforo = _semaforo_from_alerts([s.lower() for s in top_list])

    texto = (
        f"Resumo do periodo: {len(relatos)} relato(s) registrado(s). "
        + (f"Sintomas mais frequentes: {', '.join(top_list)}." if top_list else "Sem sintomas relevantes registrados.")
    )

    resumo = ResumoIA(
        gestante_id=gestante.id,
        periodo_inicio=payload.periodo_inicio,
        periodo_fim=payload.periodo_fim,
        resumo_texto=texto,
        nivel_alerta=semaforo,
        sintomas_identificados_json=json.dumps(top_list, ensure_ascii=False),
        avisos_json=json.dumps(avisos, ensure_ascii=False),
        recomendacoes="Resumo informativo; nao substitui avaliacao medica.",
        status="pending",
        gerado_em=datetime.now(UTC),
    )
    db.add(resumo)
    db.commit()
    db.refresh(resumo)

    return _map_resumo_out(resumo, for_patient=False)


@router.get("/medicos/pacientes/{gestante_id}/resumos-ia", response_model=list[ResumoOut])
def medico_resumos_paciente(gestante_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    gestante = _get_gestante_by_id(db, gestante_id)
    rows = list(
        db.scalars(
            select(ResumoIA)
            .where(ResumoIA.gestante_id == gestante.id)
            .order_by(desc(ResumoIA.gerado_em))
        )
    )
    return [_map_resumo_out(r, for_patient=False) for r in rows]


@router.patch("/medicos/resumos-ia/{resumo_id}/aprovar", response_model=ResumoOut)
def aprovar_resumo_ia(
    resumo_id: str, payload: ResumoReviewIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    _require_role(current_user, "medico")
    resumo = db.scalar(select(ResumoIA).where(ResumoIA.id == resumo_id))
    if not resumo:
        raise HTTPException(status_code=404, detail="Resumo nao encontrado")

    resumo.status = "approved"
    resumo.resumo_aprovado_texto = (payload.resumo.strip() if payload.resumo and payload.resumo.strip() else resumo.resumo_texto)
    resumo.recomendacoes_aprovadas = (
        payload.recomendacoes.strip()
        if payload.recomendacoes and payload.recomendacoes.strip()
        else (resumo.recomendacoes or "")
    )
    resumo.revisado_por_medico_id = current_user.id
    resumo.revisado_em = datetime.now(UTC)
    db.add(resumo)
    db.commit()
    db.refresh(resumo)
    return _map_resumo_out(resumo, for_patient=False)


@router.get("/sinais-vitais/me", response_model=list[SinalVitalOut])
def sinais_vitais_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "gestante")
    gestante = _get_gestante_by_user(db, current_user.id)
    rows = list(db.scalars(select(SinalVital).where(SinalVital.gestante_id == gestante.id).order_by(desc(SinalVital.data_registro))))
    return [
        SinalVitalOut(
            id=r.id,
            gestanteId=r.gestante_id,
            data_registro=r.data_registro,
            pressao_sistolica=r.pressao_sistolica,
            pressao_diastolica=r.pressao_diastolica,
            frequencia_cardiaca=r.frequencia_cardiaca,
            saturacao_oxigenio=r.saturacao_oxigenio,
            peso_kg=r.peso_kg,
            temperatura_c=r.temperatura_c,
        )
        for r in rows
    ]


@router.post("/sinais-vitais", response_model=SinalVitalOut)
def create_sinal_vital(payload: SinalVitalIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "gestante")
    gestante = _get_gestante_by_user(db, current_user.id)

    r = SinalVital(
        gestante_id=gestante.id,
        data_registro=payload.data_registro,
        pressao_sistolica=payload.pressao_sistolica,
        pressao_diastolica=payload.pressao_diastolica,
        frequencia_cardiaca=payload.frequencia_cardiaca,
        saturacao_oxigenio=payload.saturacao_oxigenio,
        peso_kg=payload.peso_kg,
        temperatura_c=payload.temperatura_c,
    )
    db.add(r)
    db.flush()

    if (payload.pressao_sistolica or 0) >= 140 or (payload.pressao_diastolica or 0) >= 90:
        db.add(
            Alerta(
                gestante_id=gestante.id,
                patient_name=gestante.nome_completo,
                patient_ig=(f"{gestante.semanas_gestacao_atual or 0}s"),
                tipo="PA fora do padrao",
                severity="high",
                status="pending",
                metric_label="Pressao arterial",
                metric_value=f"PA: {payload.pressao_sistolica or '-'} / {payload.pressao_diastolica or '-'} mmHg",
                created_at_event=datetime.now(UTC),
            )
        )

    db.commit()
    db.refresh(r)

    return SinalVitalOut(
        id=r.id,
        gestanteId=r.gestante_id,
        data_registro=r.data_registro,
        pressao_sistolica=r.pressao_sistolica,
        pressao_diastolica=r.pressao_diastolica,
        frequencia_cardiaca=r.frequencia_cardiaca,
        saturacao_oxigenio=r.saturacao_oxigenio,
        peso_kg=r.peso_kg,
        temperatura_c=r.temperatura_c,
    )


@router.post("/medicos/pacientes/{gestante_id}/sinais-vitais", response_model=SinalVitalOut)
def create_sinal_vital_medico(
    gestante_id: str, payload: SinalVitalIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    _require_role(current_user, "medico")
    gestante = _get_gestante_by_id(db, gestante_id)

    r = SinalVital(
        gestante_id=gestante.id,
        data_registro=payload.data_registro,
        pressao_sistolica=payload.pressao_sistolica,
        pressao_diastolica=payload.pressao_diastolica,
        frequencia_cardiaca=payload.frequencia_cardiaca,
        saturacao_oxigenio=payload.saturacao_oxigenio,
        peso_kg=payload.peso_kg,
        temperatura_c=payload.temperatura_c,
    )
    db.add(r)
    db.flush()

    if (payload.pressao_sistolica or 0) >= 140 or (payload.pressao_diastolica or 0) >= 90:
        db.add(
            Alerta(
                gestante_id=gestante.id,
                patient_name=gestante.nome_completo,
                patient_ig=(f"{gestante.semanas_gestacao_atual or 0}s"),
                tipo="PA fora do padrao",
                severity="high",
                status="pending",
                metric_label="Pressao arterial",
                metric_value=f"PA: {payload.pressao_sistolica or '-'} / {payload.pressao_diastolica or '-'} mmHg",
                created_at_event=datetime.now(UTC),
            )
        )

    db.commit()
    db.refresh(r)

    return SinalVitalOut(
        id=r.id,
        gestanteId=r.gestante_id,
        data_registro=r.data_registro,
        pressao_sistolica=r.pressao_sistolica,
        pressao_diastolica=r.pressao_diastolica,
        frequencia_cardiaca=r.frequencia_cardiaca,
        saturacao_oxigenio=r.saturacao_oxigenio,
        peso_kg=r.peso_kg,
        temperatura_c=r.temperatura_c,
    )


@router.get("/medicos/pacientes", response_model=list[MedicoPacienteOut])
def medicos_pacientes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    gestantes = list(db.scalars(select(Gestante).order_by(Gestante.nome_completo.asc())))
    out: list[MedicoPacienteOut] = []
    for g in gestantes:
        user = db.scalar(select(User).where(User.id == g.user_id))
        last_relato = db.scalar(
            select(RelatoDiario).where(RelatoDiario.gestante_id == g.id).order_by(desc(RelatoDiario.data_relato)).limit(1)
        )
        pending = list(
            db.scalars(select(Alerta).where(and_(Alerta.gestante_id == g.id, Alerta.status == "pending")))
        )
        level = "none"
        if any(a.severity == "high" for a in pending):
            level = "high"
        elif any(a.severity == "medium" for a in pending):
            level = "medium"
        elif any(a.severity == "low" for a in pending):
            level = "low"

        out.append(
            MedicoPacienteOut(
                id=g.id,
                name=g.nome_completo,
                cpf=f"***.{(g.id or '000')[-3:]}.***-**",
                age=30,
                gestationalWeeks=g.semanas_gestacao_atual,
                gestationalDays=0,
                lastReportDate=(
                    datetime.combine(last_relato.data_relato, datetime.min.time()).replace(tzinfo=UTC)
                    if last_relato
                    else None
                ),
                alertLevel=level,
                alertFlags=[a.tipo for a in pending][:4],
                isActive=(user.ativo if user else True),
                dueDate=g.dpp,
            )
        )
    return out


@router.get("/medicos/alerts", response_model=list[AlertOut])
def medicos_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    alerts = list(db.scalars(select(Alerta).order_by(desc(Alerta.created_at_event))))
    out: list[AlertOut] = []
    for a in alerts:
        notes = list(db.scalars(select(AlertaNota).where(AlertaNota.alerta_id == a.id).order_by(AlertaNota.created_at_note.asc())))
        out.append(
            AlertOut(
                id=a.id,
                patientId=a.gestante_id,
                patientName=a.patient_name,
                patientIG=a.patient_ig,
                type=a.tipo,
                severity=(a.severity if a.severity in {"high", "medium", "low"} else "low"),
                status=(a.status if a.status in {"pending", "reviewed"} else "pending"),
                createdAt=a.created_at_event,
                metricLabel=a.metric_label,
                metricValue=a.metric_value,
                notes=[
                    AlertNoteOut(
                        id=n.id,
                        text=n.text,
                        createdAt=n.created_at_note,
                        authorName=n.author_name,
                    )
                    for n in notes
                ],
            )
        )
    return out


@router.get("/medicos/alerts/kpi", response_model=AlertsKPIOut)
def medicos_alerts_kpi(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    now = datetime.now(UTC)
    today_start = datetime(now.year, now.month, now.day, tzinfo=UTC)

    pending_today = db.scalar(
        select(func.count(Alerta.id)).where(and_(Alerta.status == "pending", Alerta.created_at_event >= today_start))
    ) or 0
    pending_total = db.scalar(select(func.count(Alerta.id)).where(Alerta.status == "pending")) or 0
    critical_total = db.scalar(
        select(func.count(Alerta.id)).where(and_(Alerta.status == "pending", Alerta.severity == "high"))
    ) or 0

    oldest_pending = db.scalar(
        select(Alerta).where(Alerta.status == "pending").order_by(Alerta.created_at_event.asc()).limit(1)
    )
    avg_hours = int((now - oldest_pending.created_at_event).total_seconds() / 3600) if oldest_pending else 0

    return AlertsKPIOut(
        pendingToday=int(pending_today),
        pendingTotal=int(pending_total),
        criticalTotal=int(critical_total),
        avgHoursSinceAlert=max(avg_hours, 0),
    )


@router.patch("/medicos/alerts/{alert_id}/revisar")
def revisar_alert(alert_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    alert = db.scalar(select(Alerta).where(Alerta.id == alert_id))
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta nao encontrado")
    alert.status = "reviewed"
    db.add(alert)
    db.commit()
    return {"message": "ok"}


@router.post("/medicos/alerts/{alert_id}/notes", response_model=AlertNoteOut)
def add_alert_note(alert_id: str, payload: AlertNoteIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    alert = db.scalar(select(Alerta).where(Alerta.id == alert_id))
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta nao encontrado")

    note = AlertaNota(
        alerta_id=alert.id,
        text=payload.text,
        author_name=current_user.email,
        created_at_note=datetime.now(UTC),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return AlertNoteOut(id=note.id, text=note.text, createdAt=note.created_at_note, authorName=note.author_name)


@router.get("/medicos/kpi", response_model=MedicoKPIOut)
def medico_kpi(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    today = date.today()
    new_reports = db.scalar(select(func.count(RelatoDiario.id)).where(RelatoDiario.data_relato == today)) or 0
    pending_alerts = db.scalar(select(func.count(Alerta.id)).where(Alerta.status == "pending")) or 0
    active = db.scalar(
        select(func.count(User.id)).join(Gestante, Gestante.user_id == User.id).where(User.ativo == True)  # noqa: E712
    ) or 0
    return MedicoKPIOut(newReportsToday=int(new_reports), pendingAlerts=int(pending_alerts), activePatients=int(active))


@router.get("/medicos/reports")
def medico_reports(period: str = "30d", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    days = 7 if period == "7d" else 90 if period == "90d" else 30
    start = date.today() - timedelta(days=days)

    relatos = list(db.scalars(select(RelatoDiario).where(RelatoDiario.data_relato >= start)))
    alerts = list(db.scalars(select(Alerta).where(Alerta.created_at_event >= datetime.combine(start, datetime.min.time()).replace(tzinfo=UTC))))

    per_day: dict[str, int] = {}
    for r in relatos:
        key = r.data_relato.isoformat()
        per_day[key] = per_day.get(key, 0) + 1

    def series_for(sev: str):
        out: dict[str, int] = {}
        for a in alerts:
            if a.severity == sev:
                k = a.created_at_event.date().isoformat()
                out[k] = out.get(k, 0) + 1
        return [{"date": k, "value": out[k]} for k in sorted(out.keys())]

    patient_summary = []
    gestantes = list(db.scalars(select(Gestante)))
    for g in gestantes:
        rc = len([r for r in relatos if r.gestante_id == g.id])
        ac = len([a for a in alerts if a.gestante_id == g.id])
        patient_summary.append(
            {
                "id": g.id,
                "name": g.nome_completo,
                "ig": f"{g.semanas_gestacao_atual or 0}s",
                "reportCount": rc,
                "alertCount": ac,
                "lastRecord": None,
                "alertLevel": "high" if ac > 3 else "medium" if ac > 1 else "low" if ac == 1 else "none",
            }
        )

    return {
        "period": period,
        "kpi": {
            "activePatients": len(gestantes),
            "totalReports": len(relatos),
            "totalAlerts": len(alerts),
            "reviewedPct": int((len([a for a in alerts if a.status == 'reviewed']) / len(alerts)) * 100) if alerts else 0,
        },
        "reportsPerDay": [{"date": k, "value": per_day[k]} for k in sorted(per_day.keys())],
        "alertsHighPerDay": series_for("high"),
        "alertsMediumPerDay": series_for("medium"),
        "alertsLowPerDay": series_for("low"),
        "alertTypeDist": [
            {"type": t, "count": c}
            for t, c in sorted(
                {
                    a.tipo: len([x for x in alerts if x.tipo == a.tipo])
                    for a in alerts
                }.items(),
                key=lambda x: x[1],
                reverse=True,
            )
        ],
        "patientSummary": patient_summary,
    }

@router.get("/medicos/pacientes/{gestante_id}/detalhe")
def medico_paciente_detalhe(gestante_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_role(current_user, "medico")
    g = _get_gestante_by_id(db, gestante_id)

    relatos = list(db.scalars(select(RelatoDiario).where(RelatoDiario.gestante_id == g.id).order_by(desc(RelatoDiario.data_relato))))
    meds = list(db.scalars(select(Medicamento).where(Medicamento.gestante_id == g.id).order_by(desc(Medicamento.created_at))))
    records = list(db.scalars(select(Prontuario).where(Prontuario.gestante_id == g.id).order_by(desc(Prontuario.data))))
    vitais = list(db.scalars(select(SinalVital).where(SinalVital.gestante_id == g.id).order_by(SinalVital.data_registro.asc())))

    dates = [v.data_registro.date().isoformat() for v in vitais[-7:]]
    systolic = [v.pressao_sistolica or 0 for v in vitais[-7:]]
    diastolic = [v.pressao_diastolica or 0 for v in vitais[-7:]]
    heart = [v.frequencia_cardiaca or 0 for v in vitais[-7:]]
    oxygen = [v.saturacao_oxigenio or 0 for v in vitais[-7:]]
    weight = [v.peso_kg or 0 for v in vitais[-7:]]

    top_symptoms: dict[str, int] = {}
    for r in relatos:
        for s in json.loads(r.sintomas_json or "[]"):
            top_symptoms[s] = top_symptoms.get(s, 0) + 1

    sorted_symptoms = sorted(top_symptoms.items(), key=lambda x: x[1], reverse=True)
    summary_text = (
        f"Paciente com {len(relatos)} relato(s) no periodo recente. "
        + (f"Sintomas frequentes: {', '.join([k for k, _ in sorted_symptoms[:3]])}." if sorted_symptoms else "Sem sintomas relevantes.")
    )

    patient = {
        "id": g.id,
        "name": g.nome_completo,
        "cpf": f"***.{g.id[-3:]}.***-**",
        "age": 30,
        "gestationalWeeks": g.semanas_gestacao_atual,
        "gestationalDays": 0,
        "lastReportDate": (datetime.combine(relatos[0].data_relato, datetime.min.time()).replace(tzinfo=UTC).isoformat() if relatos else None),
        "alertLevel": "high" if any(s.lower() in {"pressao alta", "edema severo"} for s in top_symptoms.keys()) else "medium" if len(top_symptoms) > 0 else "none",
        "alertFlags": [k for k, _ in sorted_symptoms[:3]],
        "isActive": True,
        "dueDate": (g.dpp.isoformat() if g.dpp else None),
        "phone": g.telefone,
        "address": "",
        "bloodType": g.tipo_sanguineo,
        "firstAppointmentDate": None,
        "lastVitals": (
            {
                "id": vitais[-1].id,
                "patientId": g.id,
                "date": vitais[-1].data_registro.isoformat(),
                "bloodPressureSystolic": vitais[-1].pressao_sistolica or 0,
                "bloodPressureDiastolic": vitais[-1].pressao_diastolica or 0,
                "heartRate": vitais[-1].frequencia_cardiaca or 0,
                "oxygenSaturation": vitais[-1].saturacao_oxigenio or 0,
                "weight": vitais[-1].peso_kg or 0,
            }
            if vitais
            else None
        ),
        "vitalsHistory": {
            "dates": dates,
            "systolic": systolic,
            "diastolic": diastolic,
            "heartRate": heart,
            "oxygenSaturation": oxygen,
            "weight": weight,
        },
    }

    reports = [
        {
            "id": r.id,
            "patientId": g.id,
            "date": datetime.combine(r.data_relato, datetime.min.time()).replace(tzinfo=UTC).isoformat(),
            "description": r.descricao or "",
            "mood": r.humor,
            "symptoms": json.loads(r.sintomas_json or "[]"),
            "vitalSigns": (
                {
                    "bloodPressureSystolic": r.pressao_sistolica,
                    "bloodPressureDiastolic": r.pressao_diastolica,
                    "heartRate": r.frequencia_cardiaca,
                    "oxygenSaturation": r.saturacao_oxigenio,
                    "weight": r.peso_kg,
                    "temperature": r.temperatura_c,
                }
                if any(
                    value is not None
                    for value in (
                        r.pressao_sistolica,
                        r.pressao_diastolica,
                        r.frequencia_cardiaca,
                        r.saturacao_oxigenio,
                        r.peso_kg,
                        r.temperatura_c,
                    )
                )
                else None
            ),
        }
        for r in relatos
    ]
    medications = [
        {
            "id": m.id,
            "patientId": g.id,
            "name": m.nome,
            "dose": m.dosagem,
            "frequency": m.frequencia,
            "duration": "continuo",
            "startDate": (m.data_inicio.isoformat() if m.data_inicio else date.today().isoformat()),
            "endDate": (m.data_fim.isoformat() if m.data_fim else None),
            "notes": m.observacoes,
            "isActive": m.ativo,
            "prescribedBy": "Dr. Responsavel",
        }
        for m in meds
    ]
    medical_records = [
        {
            "id": r.id,
            "patientId": g.id,
            "date": r.data.isoformat(),
            "summary": r.descricao,
            "actions": [r.acoes_realizadas or ""],
            "nextAppointment": None,
            "doctorId": r.medico_id,
            "doctorName": "Dr. Responsavel",
        }
        for r in records
    ]

    timeline = [
        {
            "id": f"t-{r.id}",
            "patientId": g.id,
            "date": datetime.combine(r.data_relato, datetime.min.time()).replace(tzinfo=UTC).isoformat(),
            "type": "report",
            "description": (r.descricao or "Relato registrado"),
            "hasFlag": len(json.loads(r.sintomas_json or "[]")) > 0,
        }
        for r in relatos[:20]
    ]

    return {
        "patient": patient,
        "reports": reports,
        "medications": medications,
        "medicalRecords": medical_records,
        "summary": {
            "patientId": g.id,
            "generatedAt": datetime.now(UTC).isoformat(),
            "summaryText": summary_text,
            "changesDetected": [k for k, _ in sorted_symptoms[:5]],
            "dataPoints": len(reports),
        },
        "timeline": timeline,
    }
