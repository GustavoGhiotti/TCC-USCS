import json
from dataclasses import dataclass
from datetime import UTC, date, datetime

from app.core.config import settings
from app.models.gestante import Gestante
from app.models.relato import RelatoDiario
from app.services.ai_calibration import (
    build_obstetric_summary_system_prompt,
    load_calibration_examples,
    load_validation_cases,
)
from app.services.ai_provider import AIProviderError, get_ai_provider
from app.services.knowledge_base_service import KnowledgeChunk, retrieve_knowledge_chunks


ATTENTION_SIGNS = {
    "pressao alta": "Pressao elevada descrita nos relatos.",
    "sangramento": "Sangramento relatado no periodo.",
    "contracoes": "Contracoes referidas em relato recente.",
    "tontura": "Tontura recorrente ou associada a outros sintomas.",
    "dor de cabeca": "Cefaleia descrita nos registros recentes.",
    "cefaleia": "Cefaleia descrita nos registros recentes.",
    "edema severo": "Edema importante relatado.",
}

REPORT_DIGEST_LIMIT = 4
DESCRIPTION_LIMIT = 100
SUMMARY_MAX_OUTPUT_TOKENS = 140
REFERENCE_CONTEXT_CHARS = 360
HIGH_RISK_SYMPTOMS = {"pressao alta", "sangramento", "perda de liquido", "convulsao", "desmaio", "falta de ar"}
MODERATE_RISK_SYMPTOMS = {
    "contracoes",
    "tontura",
    "dor de cabeca",
    "cefaleia",
    "inchaco",
    "edema",
    "edema severo",
    "febre",
    "visao embacada",
}


@dataclass
class ClinicalSummaryResult:
    summary_text: str
    identified_symptoms: list[str]
    alerts: list[str]
    recommendations: str
    semaphore: str
    source: str


@dataclass
class AIRuntimeStatus:
    enabled: bool
    provider: str
    model: str
    base_url: str
    provider_reachable: bool
    status: str
    calibration_examples: int
    validation_cases: int
    message: str


@dataclass
class AICalibrationCaseResult:
    name: str
    expected_semaphore: str
    actual_semaphore: str
    semaphore_match: bool
    expected_symptoms: list[str]
    actual_symptoms: list[str]
    matched_symptoms: int
    passed: bool


@dataclass
class AICalibrationRunResult:
    provider: str
    model: str
    executed_at: datetime
    provider_reachable: bool
    total_cases: int
    passed_cases: int
    message: str
    cases: list[AICalibrationCaseResult]


def _build_patient_payload(gestante: Gestante, relatos: list[RelatoDiario], start: date, end: date) -> dict:
    ordered_reports = sorted(relatos, key=lambda item: item.data_relato, reverse=True)
    report_items: list[dict] = []
    symptom_frequency: dict[str, int] = {}
    critical_flags: list[str] = []
    systolic_values: list[int] = []
    diastolic_values: list[int] = []

    for report in ordered_reports:
        try:
            symptoms = json.loads(report.sintomas_json or "[]")
        except json.JSONDecodeError:
            symptoms = []
        for symptom in symptoms:
            symptom_frequency[str(symptom)] = symptom_frequency.get(str(symptom), 0) + 1
            lowered = str(symptom).lower()
            if lowered in ATTENTION_SIGNS and ATTENTION_SIGNS[lowered] not in critical_flags:
                critical_flags.append(ATTENTION_SIGNS[lowered])
        if report.pressao_sistolica is not None:
            systolic_values.append(report.pressao_sistolica)
        if report.pressao_diastolica is not None:
            diastolic_values.append(report.pressao_diastolica)

    for report in ordered_reports[:REPORT_DIGEST_LIMIT]:
        try:
            symptoms = json.loads(report.sintomas_json or "[]")
        except json.JSONDecodeError:
            symptoms = []
        report_items.append(
            {
                "date": report.data_relato.isoformat(),
                "mood": report.humor,
                "symptoms": symptoms,
                "priority": report.prioridade_clinica,
                "highlighted": bool(report.destaque_consulta),
                "description": (report.descricao or "")[:DESCRIPTION_LIMIT],
                "systolic_pressure": report.pressao_sistolica,
                "diastolic_pressure": report.pressao_diastolica,
            }
        )

    top_symptoms = [item[0] for item in sorted(symptom_frequency.items(), key=lambda item: item[1], reverse=True)[:6]]
    return {
        "patient": {
            "name": gestante.nome_completo,
            "gestational_weeks": gestante.semanas_gestacao_atual,
            "blood_type": gestante.tipo_sanguineo,
        },
        "period": {"start": start.isoformat(), "end": end.isoformat()},
        "report_count": len(ordered_reports),
        "top_symptoms": top_symptoms,
        "blood_pressure_range": {
            "systolic_min": min(systolic_values) if systolic_values else None,
            "systolic_max": max(systolic_values) if systolic_values else None,
            "diastolic_min": min(diastolic_values) if diastolic_values else None,
            "diastolic_max": max(diastolic_values) if diastolic_values else None,
        },
        "critical_flags": critical_flags[:6],
        "recent_reports": report_items,
    }


def _safe_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _extract_payload_symptoms(payload: dict) -> list[str]:
    symptoms: list[str] = []
    top_symptoms = payload.get("top_symptoms", [])
    if isinstance(top_symptoms, list):
        symptoms.extend([str(item) for item in top_symptoms])
    reports = payload.get("recent_reports") or payload.get("reports") or []
    for report in reports:
        items = report.get("symptoms", [])
        if isinstance(items, list):
            symptoms.extend([str(item) for item in items])
    return symptoms


def _payload_reports(payload: dict) -> list[dict]:
    reports = payload.get("recent_reports") or payload.get("reports") or []
    return [item for item in reports if isinstance(item, dict)]


def _pressure_range_from_payload(payload: dict) -> tuple[int | None, int | None]:
    bp_range = payload.get("blood_pressure_range")
    if isinstance(bp_range, dict):
        return bp_range.get("systolic_max"), bp_range.get("diastolic_max")

    systolic_values = []
    diastolic_values = []
    for report in _payload_reports(payload):
        systolic = report.get("systolic_pressure")
        diastolic = report.get("diastolic_pressure")
        if isinstance(systolic, int):
            systolic_values.append(systolic)
        if isinstance(diastolic, int):
            diastolic_values.append(diastolic)
    return (max(systolic_values) if systolic_values else None, max(diastolic_values) if diastolic_values else None)


def _infer_semaphore(payload: dict, top_symptoms: list[str], alerts: list[str]) -> str:
    lowered = {symptom.lower() for symptom in top_symptoms}
    systolic_max, diastolic_max = _pressure_range_from_payload(payload)
    if lowered & HIGH_RISK_SYMPTOMS or (systolic_max is not None and systolic_max >= 140) or (diastolic_max is not None and diastolic_max >= 90):
        return "vermelho"
    if alerts or lowered & MODERATE_RISK_SYMPTOMS:
        return "amarelo"
    return "verde"


def _reference_query(payload: dict, top_symptoms: list[str], alerts: list[str]) -> str:
    terms = [*top_symptoms[:4], *alerts[:2]]
    if not terms:
        terms = ["pre natal gestacao sinais de alerta"]
    return " ".join(terms)


def _format_reference_refs(chunks: list[KnowledgeChunk]) -> str:
    refs = []
    for index, chunk in enumerate(chunks, start=1):
        page = f", p. {chunk.page}" if chunk.page else ""
        refs.append(f"[{index}] {chunk.title}{page}")
    return "; ".join(refs)


def _format_reference_context(chunks: list[KnowledgeChunk]) -> str:
    items = []
    for index, chunk in enumerate(chunks, start=1):
        page = f", p. {chunk.page}" if chunk.page else ""
        items.append(f"[{index}] {chunk.title}{page}: {chunk.content[:REFERENCE_CONTEXT_CHARS]}")
    return "\n".join(items)


def _fallback_summary_from_payload(payload: dict) -> ClinicalSummaryResult:
    all_symptoms = _extract_payload_symptoms(payload)
    freq: dict[str, int] = {}
    for symptom in all_symptoms:
        freq[symptom] = freq.get(symptom, 0) + 1
    top_symptoms = [item[0] for item in sorted(freq.items(), key=lambda item: item[1], reverse=True)[:5]]

    alerts: list[str] = []
    lowered = {symptom.lower() for symptom in top_symptoms}
    for sign, message in ATTENTION_SIGNS.items():
        if sign in lowered:
            alerts.append(message)

    if alerts:
        semaphore = "vermelho" if any(sign in lowered for sign in {"pressao alta", "sangramento"}) else "amarelo"
    else:
        semaphore = "verde"

    reports = _payload_reports(payload)
    report_count = int(payload.get("report_count", len(reports) or 0))
    systolic_max, diastolic_max = _pressure_range_from_payload(payload)
    semaphore = _infer_semaphore(payload, top_symptoms, alerts)
    reference_chunks = retrieve_knowledge_chunks(_reference_query(payload, top_symptoms, alerts), top_k=2)
    reference_refs = _format_reference_refs(reference_chunks)

    if reports:
        bp_text = ""
        if systolic_max is not None or diastolic_max is not None:
            bp_text = f" Maior PA registrada: {systolic_max or 'n/d'}/{diastolic_max or 'n/d'} mmHg."
        symptoms_text = f"Sintomas mais citados: {', '.join(top_symptoms)}." if top_symptoms else "Sem sintomas relevantes descritos."
        alerts_text = f" Alertas para revisao: {'; '.join(alerts)}." if alerts else ""
        refs_text = f" Base consultada: {reference_refs}." if reference_refs else ""
        summary_text = f"Resumo do periodo com {report_count} relato(s). {symptoms_text}{bp_text}{alerts_text}{refs_text}"
    else:
        summary_text = "Nenhum relato encontrado no periodo selecionado."

    return ClinicalSummaryResult(
        summary_text=summary_text,
        identified_symptoms=top_symptoms,
        alerts=alerts,
        recommendations=(
            "Rascunho para revisao medica. Conferir sinais de alerta, medidas de pressao e necessidade de orientacao presencial. "
            + (f"Referencias: {reference_refs}." if reference_refs else "Sem referencia especifica recuperada da base.")
        ),
        semaphore=semaphore,
        source="local-regras-base",
    )


def _build_user_prompt(payload: dict, reference_chunks: list[KnowledgeChunk]) -> str:
    compact_payload = {
        "period": payload.get("period"),
        "report_count": payload.get("report_count"),
        "top_symptoms": payload.get("top_symptoms"),
        "blood_pressure_range": payload.get("blood_pressure_range"),
        "critical_flags": payload.get("critical_flags"),
        "recent_reports": _payload_reports(payload)[:REPORT_DIGEST_LIMIT],
    }
    references = _format_reference_context(reference_chunks)
    return (
        "Gere um resumo clinico preliminar para revisao medica usando somente os dados e referencias abaixo. "
        "Responda de forma objetiva, curta e referenciada. "
        "Nao invente sintomas, nao faca diagnostico e nao prescreva conduta. "
        f"Dados: {json.dumps(compact_payload, ensure_ascii=False)}\n"
        f"Referencias recuperadas da base:\n{references or 'Sem referencia especifica recuperada.'}"
    )


def _generate_provider_summary(payload: dict) -> ClinicalSummaryResult:
    system_prompt = build_obstetric_summary_system_prompt()
    fallback = _fallback_summary_from_payload(payload)
    reference_chunks = retrieve_knowledge_chunks(
        _reference_query(payload, fallback.identified_symptoms, fallback.alerts),
        top_k=2,
    )
    reference_refs = _format_reference_refs(reference_chunks)
    result = get_ai_provider(model=settings.ollama_summary_model).generate_json(
        system_prompt=system_prompt,
        user_prompt=_build_user_prompt(payload, reference_chunks),
        max_output_tokens=SUMMARY_MAX_OUTPUT_TOKENS,
        timeout_seconds=settings.ai_summary_timeout_seconds,
    )

    data = result.payload
    summary_text = str(data.get("summary_text", "")).strip() or fallback.summary_text
    identified_symptoms = _safe_list(data.get("identified_symptoms")) or fallback.identified_symptoms
    alerts = _safe_list(data.get("alerts")) or fallback.alerts
    recommendations = str(data.get("recommendations", "")).strip() or fallback.recommendations
    semaphore = str(data.get("semaphore", "")).strip().lower()
    if semaphore not in {"verde", "amarelo", "vermelho"}:
        semaphore = fallback.semaphore
    if semaphore != fallback.semaphore and fallback.semaphore == "vermelho":
        semaphore = fallback.semaphore
    if reference_refs and "base consultada" not in summary_text.lower():
        summary_text = f"{summary_text} Base consultada: {reference_refs}."
    if reference_refs and "referencias" not in recommendations.lower():
        recommendations = f"{recommendations} Referencias: {reference_refs}."

    return ClinicalSummaryResult(
        summary_text=summary_text,
        identified_symptoms=identified_symptoms[:8],
        alerts=alerts[:6],
        recommendations=recommendations,
        semaphore=semaphore,
        source=f"{result.provider_name}:{result.model_name}",
    )


def generate_clinical_summary(gestante: Gestante, relatos: list[RelatoDiario], start: date, end: date) -> ClinicalSummaryResult:
    payload = _build_patient_payload(gestante, relatos, start, end)
    fallback = _fallback_summary_from_payload(payload)

    if not settings.ai_enabled or not settings.ai_summary_use_llm:
        return fallback

    try:
        return _generate_provider_summary(payload)
    except AIProviderError:
        return fallback


def get_ai_runtime_status() -> AIRuntimeStatus:
    provider = get_ai_provider()
    calibration_examples = len(load_calibration_examples())
    validation_cases = len(load_validation_cases())

    if not settings.ai_enabled:
        return AIRuntimeStatus(
            enabled=False,
            provider=settings.ai_provider,
            model=settings.ollama_model,
            base_url=settings.ollama_base_url,
            provider_reachable=False,
            status="disabled",
            calibration_examples=calibration_examples,
            validation_cases=validation_cases,
            message="A IA esta desativada no backend. O sistema operara apenas com fallback conservador.",
        )

    provider_reachable = provider.healthcheck()
    return AIRuntimeStatus(
        enabled=True,
        provider=settings.ai_provider,
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
        provider_reachable=provider_reachable,
        status="online" if provider_reachable else "offline",
        calibration_examples=calibration_examples,
        validation_cases=validation_cases,
        message=(
            "Provedor de IA acessivel para gerar rascunhos clinicos."
            if provider_reachable
            else "Nao foi possivel contatar o provedor de IA. O sistema usara fallback local ate a conexao ser restabelecida."
        ),
    )


def run_calibration_suite() -> AICalibrationRunResult:
    provider = get_ai_provider()
    validation_cases = load_validation_cases()

    if not settings.ai_enabled:
        return AICalibrationRunResult(
            provider=settings.ai_provider,
            model=settings.ollama_model,
            executed_at=datetime.now(UTC),
            provider_reachable=False,
            total_cases=len(validation_cases),
            passed_cases=0,
            message="A IA esta desativada. Ative o backend para executar a calibracao.",
            cases=[],
        )

    if not provider.healthcheck():
        return AICalibrationRunResult(
            provider=settings.ai_provider,
            model=settings.ollama_model,
            executed_at=datetime.now(UTC),
            provider_reachable=False,
            total_cases=len(validation_cases),
            passed_cases=0,
            message="O provedor de IA nao respondeu. A calibracao nao foi executada.",
            cases=[],
        )

    results: list[AICalibrationCaseResult] = []
    for case in validation_cases:
        payload = case.get("input", {})
        expected = case.get("expected", {})
        try:
            generated = _generate_provider_summary(payload)
        except AIProviderError:
            generated = _fallback_summary_from_payload(payload)
        expected_symptoms = _safe_list(expected.get("identified_symptoms"))
        actual_symptoms = generated.identified_symptoms
        matched_symptoms = len({item.lower() for item in expected_symptoms} & {item.lower() for item in actual_symptoms})
        semaphore = str(expected.get("semaphore", "")).strip().lower() or "verde"
        semaphore_match = generated.semaphore == semaphore
        passed = semaphore_match and (not expected_symptoms or matched_symptoms >= max(1, len(expected_symptoms) - 1))
        results.append(
            AICalibrationCaseResult(
                name=str(case.get("name", "Caso de validacao")),
                expected_semaphore=semaphore,
                actual_semaphore=generated.semaphore,
                semaphore_match=semaphore_match,
                expected_symptoms=expected_symptoms,
                actual_symptoms=actual_symptoms,
                matched_symptoms=matched_symptoms,
                passed=passed,
            )
        )

    passed_cases = sum(1 for item in results if item.passed)
    return AICalibrationRunResult(
        provider=settings.ai_provider,
        model=settings.ollama_model,
        executed_at=datetime.now(UTC),
        provider_reachable=True,
        total_cases=len(results),
        passed_cases=passed_cases,
        message=(
            "Calibracao concluida com desempenho satisfatorio."
            if passed_cases == len(results)
            else "Calibracao concluida com divergencias. Revise os casos antes de ampliar o uso clinico."
        ),
        cases=results,
    )
