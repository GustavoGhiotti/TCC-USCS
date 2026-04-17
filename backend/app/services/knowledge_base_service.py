import json
import re
from functools import lru_cache
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings


TOKEN_RE = re.compile(r"[a-zA-ZÀ-ÿ0-9]{3,}")


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
    return {match.group(0).lower() for match in TOKEN_RE.finditer(text)}


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
        chunks.append(
            KnowledgeChunk(
                title=title,
                page=page,
                url=str(item.get("url", "")).strip() or None,
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
    query_tokens = _tokenize(question)
    if not query_tokens:
        return []

    scored: list[tuple[int, int, KnowledgeChunk]] = []
    directory = _knowledge_dir()
    snapshot = _directory_snapshot(directory)
    for chunk, chunk_tokens in _load_search_index_cached(str(directory), snapshot):
        overlap = len(query_tokens & chunk_tokens)
        if overlap == 0:
            continue
        scored.append((overlap, len(chunk.content), chunk))

    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [item[2] for item in scored[:top_k]]


def knowledge_stats() -> tuple[bool, int]:
    chunks = load_knowledge_chunks()
    return (len(chunks) > 0, len(chunks))


@lru_cache(maxsize=4)
def _load_search_index_cached(
    directory_str: str,
    snapshot: tuple[tuple[str, int, int], ...],
) -> tuple[tuple[KnowledgeChunk, frozenset[str]], ...]:
    chunks = _load_knowledge_chunks_cached(directory_str, snapshot)
    return tuple((chunk, frozenset(_tokenize(chunk.searchable_text))) for chunk in chunks)
