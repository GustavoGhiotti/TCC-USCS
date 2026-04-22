import json
import math
import re
import unicodedata
from functools import lru_cache
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings


TOKEN_RE = re.compile(r"[a-z0-9]{3,}")
REF_NOISE_RE = re.compile(r"\b(et al|v\.|n\.|p\.|doi|isbn|issn)\b", re.IGNORECASE)

STOPWORDS = {
    "para",
    "com",
    "sem",
    "uma",
    "uns",
    "umas",
    "nos",
    "nas",
    "dos",
    "das",
    "que",
    "como",
    "onde",
    "quando",
    "qual",
    "quais",
    "porque",
    "sobre",
    "mais",
    "muito",
    "muita",
    "pouco",
    "pouca",
    "isso",
    "essa",
    "esse",
    "estas",
    "esses",
    "esta",
    "estou",
    "tenho",
    "sinto",
    "queria",
    "gostaria",
    "posso",
    "pode",
    "devo",
    "seria",
    "nao",
    "sim",
    "hoje",
    "ontem",
    "amanha",
    "gestacao",
    "gestante",
    "gravidez",
    "gravida",
    "bebê",
    "bebe",
}

QUERY_EXPANSIONS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("repelente", ("mosquito", "dengue", "arbovirose")),
    ("pintar cabelo", ("cabelo", "tintura", "cosmetico")),
    ("cabelo", ("tintura", "cosmetico")),
    ("cafe", ("cafeina",)),
    ("dor de cabeca", ("cefaleia",)),
    ("cabeca", ("cefaleia",)),
    ("visao embacada", ("escotoma", "fotofobia", "visao")),
    ("pressao alta", ("hipertensao", "pre-eclampsia", "preeclampsia")),
    ("sangramento", ("hemorragia",)),
    ("perda de liquido", ("amniorrexe", "liquido", "amnio")),
)


@dataclass
class KnowledgeChunk:
    title: str
    page: int | None
    url: str | None
    section: str
    content: str

    @property
    def searchable_text(self) -> str:
        return f"{self.title} {self.section} {self.content}".lower()


def _tokenize(text: str) -> set[str]:
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii").lower()
    return {
        token
        for token in (match.group(0) for match in TOKEN_RE.finditer(normalized))
        if token not in STOPWORDS and not token.isdigit()
    }


def _expand_query_tokens(question: str) -> set[str]:
    question_tokens = _tokenize(question)
    normalized_question = unicodedata.normalize("NFKD", question).encode("ascii", "ignore").decode("ascii").lower()
    for trigger, expansions in QUERY_EXPANSIONS:
        if trigger in normalized_question:
            question_tokens.update(expansions)
    return question_tokens


def _is_reference_noise(chunk: KnowledgeChunk) -> bool:
    haystack = f"{chunk.title} {chunk.section} {chunk.content}".lower()
    if "referenc" in haystack or "bibliograf" in haystack:
        return True
    years = len(re.findall(r"\b(19|20)\d{2}\b", chunk.content))
    punctuation = chunk.content.count(";") + chunk.content.count(",")
    return years >= 4 and punctuation >= 10 and REF_NOISE_RE.search(chunk.content) is not None


def _knowledge_dir() -> Path:
    return Path(settings.ai_knowledge_dir)


def _parse_file(path: Path) -> list[KnowledgeChunk]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, dict):
        items = raw.get("chunks", [])
    elif isinstance(raw, list):
        items = raw
    else:
        items = []

    chunks: list[KnowledgeChunk] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        content = str(item.get("content", "")).strip()
        title = str(item.get("title", "")).strip()
        if not content or not title:
            continue
        page_value = item.get("page")
        page = int(page_value) if isinstance(page_value, int) else None
        url_value = item.get("url")
        url = str(url_value).strip() if url_value is not None else ""
        chunks.append(
            KnowledgeChunk(
                title=title,
                page=page,
                url=url or None,
                section=str(item.get("section", "")).strip(),
                content=content,
            )
        )
    return chunks


def load_knowledge_chunks() -> list[KnowledgeChunk]:
    directory = _knowledge_dir()
    snapshot = _directory_snapshot(directory)
    return list(_load_knowledge_chunks_cached(str(directory), snapshot))


def _directory_snapshot(directory: Path) -> tuple[tuple[str, int, int], ...]:
    if not directory.exists():
        return ()
    snapshot: list[tuple[str, int, int]] = []
    for path in sorted(directory.rglob("*.json")):
        stat = path.stat()
        snapshot.append((str(path), stat.st_mtime_ns, stat.st_size))
    return tuple(snapshot)


@lru_cache(maxsize=4)
def _load_knowledge_chunks_cached(directory_str: str, snapshot: tuple[tuple[str, int, int], ...]) -> tuple[KnowledgeChunk, ...]:
    directory = Path(directory_str)
    if not directory.exists():
        return ()

    chunks: list[KnowledgeChunk] = []
    for path_str, _, _ in snapshot:
        chunks.extend(_parse_file(Path(path_str)))
    return tuple(chunks)


def retrieve_knowledge_chunks(question: str, *, top_k: int = 4) -> list[KnowledgeChunk]:
    query_tokens = _expand_query_tokens(question)
    if not query_tokens:
        return []

    scored: list[tuple[float, int, KnowledgeChunk]] = []
    directory = _knowledge_dir()
    snapshot = _directory_snapshot(directory)
    index, idf_map = _load_search_index_cached(str(directory), snapshot)
    question_lc = question.lower()

    for chunk, chunk_tokens in index:
        overlap_tokens = query_tokens & chunk_tokens
        if not overlap_tokens:
            continue
        score = sum(idf_map.get(token, 1.0) for token in overlap_tokens)
        if len(overlap_tokens) >= 2:
            score += 0.6
        score += 0.3 * sum(1 for token in overlap_tokens if token in chunk.title.lower())
        if question_lc in chunk.searchable_text:
            score += 0.8
        if _is_reference_noise(chunk):
            score -= 2.2

        if score >= 1.2:
            scored.append((score, len(chunk.content), chunk))

    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [item[2] for item in scored[:top_k]]


def knowledge_stats() -> tuple[bool, int]:
    chunks = load_knowledge_chunks()
    return (len(chunks) > 0, len(chunks))


@lru_cache(maxsize=4)
def _load_search_index_cached(
    directory_str: str,
    snapshot: tuple[tuple[str, int, int], ...],
) -> tuple[tuple[tuple[KnowledgeChunk, frozenset[str]], ...], dict[str, float]]:
    chunks = _load_knowledge_chunks_cached(directory_str, snapshot)
    index = tuple((chunk, frozenset(_tokenize(chunk.searchable_text))) for chunk in chunks)
    total_docs = max(len(index), 1)
    doc_freq: dict[str, int] = {}
    for _, tokens in index:
        for token in tokens:
            doc_freq[token] = doc_freq.get(token, 0) + 1
    idf_map = {token: math.log((1 + total_docs) / (1 + freq)) + 1 for token, freq in doc_freq.items()}
    return index, idf_map
