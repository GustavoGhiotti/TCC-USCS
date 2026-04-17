import json
from pathlib import Path


CALIBRATION_FILE = Path(__file__).resolve().parents[1] / "ai" / "calibration_examples.json"
VALIDATION_FILE = Path(__file__).resolve().parents[1] / "ai" / "calibration_validation_cases.json"


def load_calibration_examples() -> list[dict]:
    if not CALIBRATION_FILE.exists():
        return []
    try:
        return json.loads(CALIBRATION_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def load_validation_cases() -> list[dict]:
    if not VALIDATION_FILE.exists():
        return []
    try:
        return json.loads(VALIDATION_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def build_obstetric_summary_system_prompt() -> str:
    examples = load_calibration_examples()
    examples_text = json.dumps(examples[:3], ensure_ascii=False)
    return (
        "Você é um assistente clínico para apoio ao pré-natal. "
        "Sua saída é SOMENTE JSON válido. "
        "Você não pode diagnosticar, prescrever, nem afirmar conduta clínica definitiva. "
        "Seu papel é resumir registros, agrupar sintomas, apontar avisos para revisão médica e sugerir texto rascunho para revisão do médico. "
        "Classifique o semáforo apenas como verde, amarelo ou vermelho com base em sinais de atenção observados nos dados. "
        "O campo recommendations deve ser conservador, informativo e deixar claro que depende de revisão médica. "
        "Estrutura obrigatória do JSON: "
        '{"summary_text":"string","identified_symptoms":["string"],"alerts":["string"],"recommendations":"string","semaphore":"verde|amarelo|vermelho"}. '
        f"Exemplos de calibração do projeto: {examples_text}"
    )
