import json
import re
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chat_gestante_message import ChatGestanteMessage
from app.core.config import settings
from app.models.gestante import Gestante
from app.services.ai_provider import AIProviderError, get_ai_provider
from app.services.knowledge_base_service import _tokenize
from app.services.knowledge_base_service import KnowledgeChunk, knowledge_stats, retrieve_knowledge_chunks


@dataclass
class GestanteChatAnswer:
    answer: str
    urgency_level: str
    citations: list[dict]
    knowledge_loaded: bool
    knowledge_chunks: int


CHAT_CONTEXT_CHUNKS = 2
CHAT_CONTEXT_CHARS = 420
CHAT_MAX_OUTPUT_TOKENS = 110
SUPPORTED_URGENCY_LEVELS = {"rotina", "proxima_consulta", "mesmo_dia", "pronto_socorro", "sem_base"}
MIN_EVIDENCE_OVERLAP = 3
PUBLIC_PREGNANCY_SOURCES = (
    "Para se informar com seguranca enquanto conversa com sua equipe, prefira fontes publicas como "
    "Ministerio da Saude, Biblioteca Virtual em Saude do Ministerio da Saude e Fiocruz."
)
WEAK_EVIDENCE_TERMS = {
    "artigo",
    "artigos",
    "base",
    "consulta",
    "duvida",
    "duvidas",
    "equipe",
    "fonte",
    "fontes",
    "medico",
    "obstetra",
    "orientacao",
    "pergunta",
    "resposta",
    "saude",
    "sintoma",
    "sintomas",
}


def _extract_relevant_excerpt(chunk: KnowledgeChunk, question: str) -> str:
    query_tokens = _tokenize(question)
    candidates = [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", chunk.content) if part.strip()]
    if not candidates:
        return chunk.content[:240].strip()

    best = candidates[0]
    best_score = -1
    for sentence in candidates:
        sent_tokens = _tokenize(sentence)
        overlap = len(query_tokens & sent_tokens)
        score = overlap * 2 + min(len(sentence), 220) / 220
        if score > best_score:
            best = sentence
            best_score = score
    return best[:300].strip()


def _build_context(chunks: list[KnowledgeChunk], question: str) -> str:
    items = []
    for index, chunk in enumerate(chunks[:CHAT_CONTEXT_CHUNKS], start=1):
        excerpt = _extract_relevant_excerpt(chunk, question)
        if len(excerpt) < 180:
            excerpt = chunk.content[:CHAT_CONTEXT_CHARS].strip()
        items.append(
            f"[{index}] Fonte: {chunk.title} | Pagina: {chunk.page or 'n/d'} | Secao: {chunk.section or 'n/d'}\n"
            f"Trecho: {excerpt[:CHAT_CONTEXT_CHARS]}"
        )
    return "\n\n".join(items)


def _format_source_refs(chunks: list[KnowledgeChunk]) -> str:
    refs = []
    for index, chunk in enumerate(chunks[:CHAT_CONTEXT_CHUNKS], start=1):
        page = f", p. {chunk.page}" if chunk.page else ""
        url = f", link: {chunk.url}" if chunk.url else ""
        refs.append(f"[{index}] {chunk.title}{page}{url}")
    return "; ".join(refs)


def _is_hair_dye_question(question: str) -> bool:
    question_tokens = _tokenize(question)
    hair_terms = {"cabelo", "capilar"}
    dye_terms = {"pintar", "tintura", "tinturas", "tingir", "descolorir", "alisamento", "progressiva"}
    return bool(question_tokens & hair_terms) and bool(question_tokens & dye_terms)


def _hair_dye_chunks(chunks: list[KnowledgeChunk]) -> list[KnowledgeChunk]:
    evidence = {"tintura", "tinturas", "tinta", "cosmetico", "cosmeticos", "amonia", "quimica", "descolorir", "alisamento"}
    selected = []
    for chunk in chunks:
        tokens = _tokenize(f"{chunk.title} {chunk.section} {chunk.content}")
        if tokens & evidence:
            selected.append(chunk)
    return selected or chunks[:1]


def _is_headache_question(question: str) -> bool:
    tokens = _tokenize(question)
    return "cefaleia" in tokens or ("dor" in tokens and "cabeca" in tokens)


def _is_repellent_question(question: str) -> bool:
    tokens = _tokenize(question)
    return bool(tokens & {"repelente", "repelentes", "mosquito", "dengue", "arbovirose", "zika", "chikungunya"})


def _repellent_chunks(chunks: list[KnowledgeChunk]) -> list[KnowledgeChunk]:
    evidence = {"repelente", "deet", "ir3535", "icaridina", "mosquito", "dengue", "arbovirose", "zika"}
    selected = []
    for chunk in chunks:
        tokens = _tokenize(f"{chunk.title} {chunk.section} {chunk.content}")
        if tokens & evidence:
            selected.append(chunk)
    return selected or chunks[:1]


def _repellent_answer(
    chunks: list[KnowledgeChunk],
    *,
    knowledge_loaded: bool,
    knowledge_chunks: int,
    question: str,
) -> GestanteChatAnswer:
    targeted_chunks = retrieve_knowledge_chunks("repelente gestacao DEET IR3535 icaridina mosquito dengue", top_k=4)
    source_chunks = _repellent_chunks([*targeted_chunks, *chunks])
    source_refs = _format_source_refs(source_chunks)
    return GestanteChatAnswer(
        answer=(
            "Resposta direta: os trechos da base citam DEET, IR3535 e icaridina como repelentes considerados seguros na gravidez quando usados conforme as instrucoes do produto.\n\n"
            "Cuidados: alem do repelente, use roupas que cubram mais a pele, telas em portas e janelas e evite exposicao a mosquitos quando possivel.\n\n"
            "Quando procurar atendimento: se tiver febre, manchas no corpo, dor intensa, sangramento ou mal-estar importante, procure avaliacao.\n\n"
            f"Fonte usada: {source_refs}."
        ),
        urgency_level="rotina",
        citations=_serialize_citations(source_chunks, question=question),
        knowledge_loaded=knowledge_loaded,
        knowledge_chunks=knowledge_chunks,
    )


def _headache_chunks(chunks: list[KnowledgeChunk]) -> list[KnowledgeChunk]:
    evidence = {"cefaleia", "cabeca", "preeclampsia", "eclampsia", "desidratacao", "sono", "paracetamol", "acetaminofeno"}
    preferred = []
    selected = []
    for chunk in chunks:
        haystack = f"{chunk.title} {chunk.section} {chunk.content}"
        tokens = _tokenize(haystack)
        if tokens & evidence:
            if "headaches" in chunk.title.lower() or "cefaleia na gestacao" in chunk.section.lower():
                preferred.append(chunk)
            else:
                selected.append(chunk)
    if preferred:
        return preferred[:CHAT_CONTEXT_CHUNKS]
    return selected or chunks[:1]


def _headache_has_red_flags(question: str) -> bool:
    q = question.lower()
    red_flags = {
        "visao embacada",
        "visão embaçada",
        "alteracao visual",
        "alteração visual",
        "luzes",
        "pontos brilhantes",
        "dor forte",
        "muito forte",
        "vomito",
        "vômito",
        "inchaco no rosto",
        "inchaço no rosto",
        "pressao alta",
        "pressão alta",
        "desmaio",
    }
    return any(term in q for term in red_flags)


def _headache_answer(
    chunks: list[KnowledgeChunk],
    *,
    knowledge_loaded: bool,
    knowledge_chunks: int,
    question: str,
) -> GestanteChatAnswer:
    targeted_chunks = retrieve_knowledge_chunks("cefaleia gestacao desidratacao sono pre eclampsia paracetamol", top_k=4)
    source_chunks = _headache_chunks([*targeted_chunks, *chunks])
    source_refs = _format_source_refs(source_chunks)
    if _headache_has_red_flags(question):
        answer = (
            "Resposta direta: com dor de cabeca associada a sinais como alteracao visual, pressao alta, vomitos, dor forte ou inchaco subito, procure avaliacao presencial hoje.\n\n"
            "Por que: as referencias destacam que cefaleia pode ser sinal de pre-eclampsia quando vem com esses sinais.\n\n"
            "Enquanto busca orientacao: evite se automedicar sem falar com sua equipe e, se tiver aparelho, confira a pressao.\n\n"
            f"Fonte usada: {source_refs}."
        )
        urgency = "mesmo_dia"
    else:
        answer = (
            "Resposta direta: para tentar aliviar sem remedio, comece por hidratacao, descanso, sono adequado e relaxamento.\n\n"
            "Por que: as referencias citam desidratacao, falta de sono, baixa glicose e tensao como gatilhos comuns de dor de cabeca na gestacao.\n\n"
            "Quando procurar atendimento: se a dor ficar forte, persistir, piorar, vier com visao embacada, vomitos, pressao alta ou inchaco subito, procure avaliacao. Se pensar em tomar remedio, confirme com seu obstetra.\n\n"
            f"Fonte usada: {source_refs}."
        )
        urgency = "proxima_consulta"
    return GestanteChatAnswer(
        answer=answer,
        urgency_level=urgency,
        citations=_serialize_citations(source_chunks, question=question),
        knowledge_loaded=knowledge_loaded,
        knowledge_chunks=knowledge_chunks,
    )


def _hair_dye_answer(
    chunks: list[KnowledgeChunk],
    *,
    knowledge_loaded: bool,
    knowledge_chunks: int,
    question: str,
) -> GestanteChatAnswer:
    source_chunks = _hair_dye_chunks(chunks)
    source_refs = _format_source_refs(source_chunks)
    return GestanteChatAnswer(
        answer=(
            "Resposta direta: pode ser considerado, mas com cautela e preferindo produtos naturais ou sem amonia.\n\n"
            "Por que: a referencia encontrada diz que os estudos sobre tinturas na gestacao nao foram consistentes para confirmar causalidade de dano fetal, "
            "mas recomenda reduzir exposicao e absorcao pela pele.\n\n"
            "Cuidados: nao deixe a tintura mais tempo que o necessario, enxague bem o couro cabeludo e use luvas. Confirme com seu obstetra, principalmente no primeiro trimestre.\n\n"
            f"Fonte usada: {source_refs}."
        ),
        urgency_level="rotina",
        citations=_serialize_citations(source_chunks, question=question),
        knowledge_loaded=knowledge_loaded,
        knowledge_chunks=knowledge_chunks,
    )


def _brief_excerpt(chunks: list[KnowledgeChunk], question: str) -> str:
    if not chunks:
        return ""
    return _extract_relevant_excerpt(chunks[0], question)[:260].strip()


def _has_supported_context(question: str, chunks: list[KnowledgeChunk]) -> bool:
    if not chunks:
        return False

    question_tokens = _tokenize(question) - WEAK_EVIDENCE_TERMS
    combined = " ".join(f"{chunk.title} {chunk.section} {chunk.content}" for chunk in chunks).lower()
    combined_tokens = _tokenize(combined) - WEAK_EVIDENCE_TERMS

    if _is_hair_dye_question(question):
        dye_evidence = {"tintura", "tinturas", "tinta", "cosmetico", "cosmeticos", "amonia", "quimica", "descolorir", "alisamento"}
        return bool(combined_tokens & dye_evidence)
    if _is_headache_question(question):
        headache_evidence = {"cefaleia", "cabeca", "preeclampsia", "pre", "eclampsia", "desidratacao", "sono", "paracetamol", "acetaminofeno"}
        return bool(combined_tokens & headache_evidence)
    if _is_repellent_question(question):
        repellent_evidence = {"repelente", "deet", "ir3535", "icaridina", "mosquito", "dengue", "arbovirose", "zika"}
        return bool(combined_tokens & repellent_evidence)

    overlap = question_tokens & combined_tokens
    has_specific_match = len(overlap) >= MIN_EVIDENCE_OVERLAP
    has_phrase_match = any(token in combined for token in question_tokens if len(token) >= 6)
    return has_specific_match and has_phrase_match


def _unsupported_context_answer(
    knowledge_loaded: bool,
    knowledge_chunks: int,
    *,
    question: str = "",
) -> GestanteChatAnswer:
    urgency = _infer_urgency_from_question(question) if question else "proxima_consulta"
    if urgency in {"mesmo_dia", "pronto_socorro"}:
        answer = (
            "Nao encontrei nos artigos carregados uma referencia especifica e suficiente para responder essa pergunta com seguranca.\n\n"
            "Como voce citou um possivel sinal de alerta, procure avaliacao presencial ou fale com sua equipe de pre-natal ainda hoje. "
            "Nao vou complementar com informacao fora da base."
        )
    else:
        answer = (
            "Nao encontrei nos artigos carregados uma referencia especifica e suficiente para responder essa pergunta com seguranca.\n\n"
            "Por isso, nao vou afirmar conduta nem completar com informacao fora da base. Leve essa duvida para sua proxima consulta.\n\n"
            f"{PUBLIC_PREGNANCY_SOURCES}"
        )
    return GestanteChatAnswer(
        answer=answer,
        urgency_level=urgency if urgency in {"mesmo_dia", "pronto_socorro"} else "proxima_consulta",
        citations=[],
        knowledge_loaded=knowledge_loaded,
        knowledge_chunks=knowledge_chunks,
    )


def _serialize_citations(chunks: list[KnowledgeChunk], *, question: str) -> list[dict]:
    return [
        {
            "title": chunk.title,
            "page": chunk.page,
            "url": chunk.url,
            "excerpt": _extract_relevant_excerpt(chunk, question),
        }
        for chunk in chunks
    ]


def _history_excerpt(db: Session, gestante_id: str, question: str, limit: int = 4) -> str:
    return _history_excerpt_for_thread(db, gestante_id, gestante_id, question, limit=limit)


def _history_excerpt_for_thread(db: Session, gestante_id: str, thread_id: str, question: str, limit: int = 4) -> str:
    messages = list(
        db.scalars(
            select(ChatGestanteMessage)
            .where(ChatGestanteMessage.gestante_id == gestante_id, ChatGestanteMessage.thread_id == thread_id)
            .order_by(ChatGestanteMessage.created_at.desc())
            .limit(limit)
        )
    )
    if not messages:
        return ""
    ordered = list(reversed(messages))
    query_tokens = _tokenize(question)
    related = []
    for item in ordered:
        message_tokens = _tokenize(item.content)
        if not query_tokens or query_tokens & message_tokens:
            related.append(f"{item.role}: {item.content[:240]}")
    return "\n".join(related[-2:])


def _recent_thread_context(db: Session, gestante_id: str, thread_id: str, limit: int = 4) -> str:
    messages = list(
        db.scalars(
            select(ChatGestanteMessage)
            .where(ChatGestanteMessage.gestante_id == gestante_id, ChatGestanteMessage.thread_id == thread_id)
            .order_by(ChatGestanteMessage.created_at.desc())
            .limit(limit)
        )
    )
    if not messages:
        return ""
    return " ".join(item.content[:240] for item in reversed(messages))


def _resolve_question_for_retrieval(db: Session, gestante: Gestante, thread_id: str, question: str) -> str:
    question_tokens = _tokenize(question)
    vague_terms = {"isso", "essa", "esse", "dessa", "desse", "ajudar", "fazer", "melhorar", "posso"}
    has_specific_terms = len(question_tokens - vague_terms) >= 3
    if has_specific_terms:
        return question
    context = _recent_thread_context(db, gestante.id, thread_id)
    return f"{context} {question}".strip() if context else question


def _infer_urgency_from_question(question: str) -> str:
    q = question.lower()
    pronto_socorro_terms = {"convulsao", "desmaio", "sangramento intenso", "falta de ar", "dor forte no peito"}
    mesmo_dia_terms = {"sangramento", "visao embacada", "pressao alta", "dor de cabeca forte", "perda de liquido", "febre"}
    if any(term in q for term in pronto_socorro_terms):
        return "pronto_socorro"
    if any(term in q for term in mesmo_dia_terms):
        return "mesmo_dia"
    return "proxima_consulta"


def _fallback_answer(
    question: str,
    chunks: list[KnowledgeChunk],
    *,
    knowledge_loaded: bool,
    knowledge_chunks: int,
) -> GestanteChatAnswer:
    if not knowledge_loaded or not chunks:
        return _unsupported_context_answer(knowledge_loaded, knowledge_chunks, question=question)

    first = chunks[0]
    urgency = _infer_urgency_from_question(question)
    excerpt = _extract_relevant_excerpt(first, question)
    urgency_hint = {
        "pronto_socorro": "Pelos sinais que voce descreveu, procure atendimento de urgencia agora.",
        "mesmo_dia": "Pelos sinais descritos, e importante buscar avaliacao presencial ainda hoje.",
        "proxima_consulta": "Parece uma duvida importante para orientar com calma na proxima consulta.",
        "rotina": "Parece uma duvida de rotina e acompanhamento.",
    }.get(urgency, "Essa duvida merece acompanhamento com sua equipe.")
    return GestanteChatAnswer(
        answer=(
            f"Resposta direta: {urgency_hint}\n\n"
            f"Por que: o trecho recuperado nos artigos diz: {excerpt[:220]}.\n\n"
            "Quando procurar atendimento: se o sintoma for intenso, piorar, vier com sangramento, perda de liquido, falta de ar, "
            "desmaio ou mal-estar importante, procure atendimento presencial.\n\n"
            f"Fonte usada: {_format_source_refs(chunks)}."
        ),
        urgency_level=urgency,
        citations=_serialize_citations(chunks, question=question),
        knowledge_loaded=knowledge_loaded,
        knowledge_chunks=knowledge_chunks,
    )


def answer_gestante_question(db: Session, gestante: Gestante, question: str, thread_id: str | None = None) -> GestanteChatAnswer:
    knowledge_loaded, knowledge_chunks = knowledge_stats()
    active_thread_id = thread_id or gestante.id
    retrieval_question = _resolve_question_for_retrieval(db, gestante, active_thread_id, question)
    chunks = retrieve_knowledge_chunks(retrieval_question, top_k=CHAT_CONTEXT_CHUNKS)
    fallback = _fallback_answer(retrieval_question, chunks, knowledge_loaded=knowledge_loaded, knowledge_chunks=knowledge_chunks)
    if not knowledge_loaded or not chunks:
        return _unsupported_context_answer(knowledge_loaded, knowledge_chunks, question=retrieval_question)
    if not _has_supported_context(retrieval_question, chunks):
        return _unsupported_context_answer(knowledge_loaded, knowledge_chunks, question=retrieval_question)
    if _is_headache_question(retrieval_question):
        return _headache_answer(chunks, knowledge_loaded=knowledge_loaded, knowledge_chunks=knowledge_chunks, question=retrieval_question)
    if _is_hair_dye_question(retrieval_question):
        return _hair_dye_answer(chunks, knowledge_loaded=knowledge_loaded, knowledge_chunks=knowledge_chunks, question=retrieval_question)
    if _is_repellent_question(retrieval_question):
        return _repellent_answer(chunks, knowledge_loaded=knowledge_loaded, knowledge_chunks=knowledge_chunks, question=retrieval_question)

    context = _build_context(chunks, retrieval_question)
    source_refs = _format_source_refs(chunks)
    history = _history_excerpt_for_thread(db, gestante.id, active_thread_id, question)
    system_prompt = (
        "Voce e uma assistente virtual de orientacao para gestantes. "
        "Use somente os trechos numerados dos artigos fornecidos. "
        "Se os trechos nao sustentarem a resposta de forma especifica, retorne urgency_level sem_base. "
        "Nao use conhecimento externo, nao invente condutas, nao diagnostique e nao prescreva. "
        "Nao copie frases longas das fontes. Responda como chat, em linguagem simples. "
        "Se a pergunta indicar risco, seja direta e orientada a acao. "
        "Estruture a resposta com: resposta direta, explicacao curta, quando procurar atendimento e fonte usada. "
        "Sua saida deve ser SOMENTE JSON valido no formato "
        '{"answer":"string","urgency_level":"rotina|proxima_consulta|mesmo_dia|pronto_socorro|sem_base"}.'
    )
    user_prompt = (
        f"Historico recente relacionado:\n{history or 'Sem historico relevante.'}\n\n"
        f"Pergunta da gestante: {question}\n\n"
        f"Trechos dos artigos recuperados:\n{context}\n\n"
        f"Referencias disponiveis para citar no fim da resposta: {source_refs}\n\n"
        "Responda em portugues do Brasil, com no maximo 85 palavras. "
        "Inclua a linha final 'Fonte usada: ...' com a referencia mais adequada, pagina e link quando disponiveis."
    )

    try:
        result = get_ai_provider().generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_output_tokens=CHAT_MAX_OUTPUT_TOKENS,
            timeout_seconds=settings.ai_chat_timeout_seconds,
        )
        payload = result.payload
    except AIProviderError:
        return fallback

    answer = str(payload.get("answer", "")).strip() or fallback.answer
    urgency_level = str(payload.get("urgency_level", "")).strip().lower()
    if urgency_level not in SUPPORTED_URGENCY_LEVELS:
        urgency_level = _infer_urgency_from_question(question)
    if urgency_level == "sem_base" or "nao encontrei base" in answer.lower() or "não encontrei base" in answer.lower():
        return _unsupported_context_answer(knowledge_loaded, knowledge_chunks, question=retrieval_question)
    if "fonte usada:" not in answer.lower():
        answer = f"{answer}\n\nFonte usada: {source_refs}."

    return GestanteChatAnswer(
        answer=answer,
        urgency_level=urgency_level,
        citations=_serialize_citations(chunks, question=retrieval_question),
        knowledge_loaded=knowledge_loaded,
        knowledge_chunks=knowledge_chunks,
    )


def list_gestante_chat_messages(db: Session, gestante_id: str, thread_id: str | None = None) -> list[ChatGestanteMessage]:
    target_thread_id = thread_id or gestante_id
    return list(
        db.scalars(
            select(ChatGestanteMessage)
            .where(ChatGestanteMessage.gestante_id == gestante_id, ChatGestanteMessage.thread_id == target_thread_id)
            .order_by(ChatGestanteMessage.created_at.asc())
        )
    )


def list_gestante_chat_threads(db: Session, gestante_id: str) -> list[dict]:
    messages = list(
        db.scalars(
            select(ChatGestanteMessage)
            .where(ChatGestanteMessage.gestante_id == gestante_id)
            .order_by(ChatGestanteMessage.created_at.desc())
        )
    )
    threads: dict[str, dict] = {}
    for message in messages:
        item = threads.setdefault(
            message.thread_id,
            {
                "id": message.thread_id,
                "title": "Nova conversa",
                "updatedAt": message.created_at,
                "messageCount": 0,
            },
        )
        item["messageCount"] += 1
        if message.created_at >= item["updatedAt"]:
            item["updatedAt"] = message.created_at
        if message.role == "user":
            item["title"] = message.content[:48] or "Nova conversa"
    return sorted(threads.values(), key=lambda item: item["updatedAt"], reverse=True)


def create_chat_thread_id() -> str:
    return str(uuid.uuid4())


def create_chat_message(
    db: Session,
    *,
    gestante_id: str,
    thread_id: str | None = None,
    role: str,
    content: str,
    citations: list[dict] | None = None,
    urgency_level: str | None = None,
) -> ChatGestanteMessage:
    message = ChatGestanteMessage(
        gestante_id=gestante_id,
        thread_id=thread_id or gestante_id,
        role=role,
        content=content,
        citations_json=json.dumps(citations or [], ensure_ascii=False),
        urgency_level=urgency_level,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
