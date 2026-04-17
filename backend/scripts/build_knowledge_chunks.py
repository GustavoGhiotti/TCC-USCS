from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from pypdf import PdfReader

from app.core.config import settings

RAW_DIR = Path(settings.ai_raw_sources_dir)
OUT_DIR = Path(settings.ai_knowledge_dir)
PAGE_RE = re.compile(r"\[\[\s*PAGE\s*:\s*(\d+)\s*\]\]", re.IGNORECASE)


def parse_metadata(text: str, fallback_title: str) -> tuple[dict[str, str], str]:
    metadata: dict[str, str] = {}
    body_lines: list[str] = []
    in_header = True

    for line in text.splitlines():
        stripped = line.strip()
        if in_header and ":" in stripped:
            key, value = stripped.split(":", 1)
            if key.strip().lower() in {"title", "url", "section"}:
                metadata[key.strip().lower()] = value.strip()
                continue
        in_header = False
        body_lines.append(line)

    metadata.setdefault("title", fallback_title)
    return metadata, "\n".join(body_lines).strip()


def chunk_text(text: str, *, chunk_size: int = 900) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= chunk_size:
            current = candidate
            continue
        if current:
            chunks.append(current)
        if len(paragraph) <= chunk_size:
            current = paragraph
            continue

        start = 0
        while start < len(paragraph):
            end = start + chunk_size
            chunks.append(paragraph[start:end].strip())
            start = end
        current = ""

    if current:
        chunks.append(current)
    return chunks


def build_chunks_from_file(path: Path) -> list[dict]:
    metadata, body = parse_metadata(path.read_text(encoding="utf-8"), path.stem.replace("_", " "))
    if not body:
        return []

    parts = PAGE_RE.split(body)
    current_page: int | None = None
    current_section = metadata.get("section", "")
    chunks: list[dict] = []

    if len(parts) == 1:
        for content in chunk_text(parts[0]):
            chunks.append(
                {
                    "title": metadata["title"],
                    "page": current_page,
                    "url": metadata.get("url") or None,
                    "section": current_section,
                    "content": content,
                }
            )
        return chunks

    first_text = parts[0].strip()
    if first_text:
        for content in chunk_text(first_text):
            chunks.append(
                {
                    "title": metadata["title"],
                    "page": current_page,
                    "url": metadata.get("url") or None,
                    "section": current_section,
                    "content": content,
                }
            )

    index = 1
    while index < len(parts):
        current_page = int(parts[index])
        page_text = parts[index + 1].strip() if index + 1 < len(parts) else ""
        for content in chunk_text(page_text):
            chunks.append(
                {
                    "title": metadata["title"],
                    "page": current_page,
                    "url": metadata.get("url") or None,
                    "section": current_section,
                    "content": content,
                }
            )
        index += 2

    return chunks


def build_chunks_from_pdf(path: Path) -> list[dict]:
    reader = PdfReader(str(path))
    chunks: list[dict] = []
    title = path.stem.replace("_", " ")

    for index, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if not text:
            continue
        for content in chunk_text(text):
            chunks.append(
                {
                    "title": title,
                    "page": index,
                    "url": None,
                    "section": "",
                    "content": content,
                }
            )

    return chunks


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    source_files = sorted([*RAW_DIR.glob("*.txt"), *RAW_DIR.glob("*.md"), *RAW_DIR.glob("*.pdf")])
    if not source_files:
        print(f"Nenhum arquivo encontrado em {RAW_DIR}")
        return

    for source_file in source_files:
        if source_file.suffix.lower() == ".pdf":
            chunks = build_chunks_from_pdf(source_file)
        else:
            chunks = build_chunks_from_file(source_file)
        target = OUT_DIR / f"{source_file.stem}.json"
        target.write_text(
            json.dumps({"chunks": chunks}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        message = f"Gerado: {target} ({len(chunks)} chunks)"
        print(message.encode("cp1252", errors="replace").decode("cp1252"))


if __name__ == "__main__":
    main()
