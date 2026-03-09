from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class MedicamentoOut(BaseModel):
    id: str
    gestanteId: str
    nome: str
    dosagem: str
    frequencia: str
    dataInicio: date | None = None
    dataFim: date | None = None
    dataPrescricao: date | None = None
    ativo: bool
    observacoes: str | None = None


class MedicamentoIn(BaseModel):
    gestanteId: str
    nome: str
    dosagem: str
    frequencia: str
    dataInicio: date | None = None
    dataFim: date | None = None
    ativo: bool = True
    observacoes: str | None = None


class ConsultaOut(BaseModel):
    id: str
    gestanteId: str
    data: date
    tipo: Literal["ultrassom", "pressao", "rotina", "emergencia"]
    observacoes: str | None = None
    status: str


class ConsultaIn(BaseModel):
    gestanteId: str
    data: date
    tipo: Literal["ultrassom", "pressao", "rotina", "emergencia"]
    observacoes: str | None = None


class OrientacaoOut(BaseModel):
    id: str
    gestanteId: str
    medicoId: str | None = None
    data: date
    texto: str


class OrientacaoIn(BaseModel):
    gestanteId: str
    medicoId: str | None = None
    data: date
    texto: str


class ProntuarioOut(BaseModel):
    id: str
    gestanteId: str
    data: date
    descricao: str
    medicamentosPrescritos: list[str]
    acoesRealizadas: str
    medicoId: str | None = None


class ProntuarioIn(BaseModel):
    gestanteId: str
    data: date
    descricao: str
    medicamentosPrescritos: list[str] = Field(default_factory=list)
    acoesRealizadas: str = ""
    medicoId: str | None = None


class ResumoOut(BaseModel):
    id: str
    gestanteId: str
    relatoId: str
    data: date
    tipo: Literal["diario", "semanal"]
    semaforo: Literal["verde", "amarelo", "vermelho"]
    resumo: str
    sintomasIdentificados: list[str]
    avisos: list[str]
    recomendacoes: str


class ResumoGerarIn(BaseModel):
    gestanteId: str
    periodo_inicio: datetime
    periodo_fim: datetime


class SinalVitalIn(BaseModel):
    data_registro: datetime
    pressao_sistolica: int | None = None
    pressao_diastolica: int | None = None
    frequencia_cardiaca: int | None = None
    saturacao_oxigenio: int | None = None
    peso_kg: int | None = None
    temperatura_c: int | None = None


class SinalVitalOut(BaseModel):
    id: str
    gestanteId: str
    data_registro: datetime
    pressao_sistolica: int | None = None
    pressao_diastolica: int | None = None
    frequencia_cardiaca: int | None = None
    saturacao_oxigenio: int | None = None
    peso_kg: int | None = None
    temperatura_c: int | None = None


class AlertNoteOut(BaseModel):
    id: str
    text: str
    createdAt: datetime
    authorName: str


class AlertOut(BaseModel):
    id: str
    patientId: str
    patientName: str
    patientIG: str | None = None
    type: str
    severity: Literal["high", "medium", "low"]
    status: Literal["pending", "reviewed"]
    createdAt: datetime
    metricLabel: str
    metricValue: str
    notes: list[AlertNoteOut] = Field(default_factory=list)


class AlertNoteIn(BaseModel):
    text: str


class AlertsKPIOut(BaseModel):
    pendingToday: int
    pendingTotal: int
    criticalTotal: int
    avgHoursSinceAlert: int


class MedicoPacienteOut(BaseModel):
    id: str
    name: str
    cpf: str
    age: int
    gestationalWeeks: int | None = None
    gestationalDays: int | None = None
    lastReportDate: datetime | None = None
    alertLevel: Literal["none", "low", "medium", "high"]
    alertFlags: list[str] = Field(default_factory=list)
    isActive: bool = True
    dueDate: date | None = None


class MedicoKPIOut(BaseModel):
    newReportsToday: int
    pendingAlerts: int
    activePatients: int
