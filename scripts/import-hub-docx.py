"""Import college essay hub/service pages from structured docx files."""

from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB_DOCX_DIR = ROOT / "content-hubs"
OUT_DIR = ROOT / "data" / "hub-pages"
INDEX_PATH = OUT_DIR / "index.json"

SEO_FIELD_PREFIXES = (
    "Title Tag",
    "Meta Description",
    "Primary Keyword",
    "Secondary Keywords",
    "URL Slug",
    "Canonical",
    "Schema Types",
    "H1",
    "Word Count Target",
    "Internal Links",
    "Outbound Links",
    "Citations",
)

CTA_RE = re.compile(r"^\[\s*CTA BUTTON:\s*(.+?)\s*\]$", re.I)


def normalize_text(text: str) -> str:
    return (
        text.replace("\ufffd", "–")
        .replace("—", "–")
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .strip()
    )


def read_docx(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    paras: list[str] = []
    for p in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
        texts = [
            t.text or ""
            for t in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t")
        ]
        line = normalize_text("".join(texts))
        if line:
            paras.append(line)
    return paras


def parse_seo_block(paras: list[str]) -> tuple[dict[str, str], int]:
    meta: dict[str, str] = {}
    i = 0
    while i < len(paras) and "SEO SETUP BLOCK" not in paras[i].upper():
        i += 1
    if i >= len(paras):
        return meta, 0
    i += 1

    while i < len(paras):
        line = paras[i]
        matched = False
        for prefix in SEO_FIELD_PREFIXES:
            if line.startswith(f"{prefix}:"):
                meta[prefix] = line.split(":", 1)[1].strip()
                i += 1
                matched = True
                break
        if matched:
            continue
        if meta.get("Citations") and not any(line.startswith(f"{p}:") for p in SEO_FIELD_PREFIXES):
            break
        if not meta:
            i += 1
            continue
        break
    return meta, i


def slug_from_meta(meta: dict[str, str]) -> str:
    raw = meta.get("URL Slug", "").strip().lstrip("/")
    if not raw:
        raise ValueError("Missing URL Slug in SEO block")
    return raw


def split_keywords(raw: str) -> list[str]:
    if not raw:
        return []
    return [part.strip() for part in re.split(r",\s*", raw) if part.strip()]


def parse_internal_links(raw: str) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    if not raw:
        return links
    for chunk in re.split(r"\s*\|\s*", raw):
        chunk = chunk.strip()
        if not chunk:
            continue
        path_match = re.search(r"(/[\w-]+)", chunk)
        if not path_match:
            continue
        path = path_match.group(1).lstrip("/")
        label = re.sub(r"^(P\d+|Hub\s+[\d.]+)\s*", "", chunk).strip()
        label = label.replace(path_match.group(1), "").strip(" -|")
        links.append({"slug": path, "label": label or path.replace("-", " ").title()})
    return links


def is_cta(line: str) -> bool:
    return bool(CTA_RE.match(line))


def extract_cta(line: str) -> str:
    match = CTA_RE.match(line)
    return match.group(1).strip() if match else line.strip()


def is_badges_line(line: str) -> bool:
    if "|" not in line or line.startswith("[ CTA"):
        return False
    parts = [p.strip() for p in line.split("|") if p.strip()]
    return len(parts) >= 3 and all(len(p) < 120 for p in parts)


def is_faq_heading(line: str) -> bool:
    return line.strip().lower() in {"faq", "frequently asked questions"}


def is_section_heading(line: str, next_line: str | None, *, in_faq: bool) -> bool:
    if in_faq or is_cta(line) or is_badges_line(line) or is_faq_heading(line):
        return False
    if line.endswith(":"):
        return False
    if not next_line or is_cta(next_line) or is_faq_heading(next_line):
        return False
    if is_badges_line(next_line):
        return False
    words = line.split()
    if len(words) > 18:
        return False
    if next_line.endswith("?") and len(next_line.split()) <= 14:
        return False
    if len(next_line) < 30 and not next_line.endswith(":"):
        return False
    if line.endswith(".") and len(words) > 14:
        return False
    return True


def should_break_content(line: str, *, in_faq: bool) -> bool:
    if is_cta(line) or is_faq_heading(line):
        return True
    if not in_faq and is_badges_line(line):
        return True
    return False


def parse_faq_items(paras: list[str], start: int) -> tuple[list[dict[str, str]], int]:
    items: list[dict[str, str]] = []
    i = start
    while i < len(paras):
        line = paras[i]
        if should_break_content(line, in_faq=True):
            break
        if is_section_heading(line, paras[i + 1] if i + 1 < len(paras) else None, in_faq=True):
            break
        if not line.endswith("?"):
            break
        question = line
        i += 1
        answer = paras[i].strip() if i < len(paras) else ""
        if answer and not answer.endswith("?") and not should_break_content(answer, in_faq=True):
            i += 1
        items.append({"question": question, "answer": answer})
    return items, i


def parse_content_blocks(paras: list[str], start: int, meta: dict[str, str]) -> list[dict]:
    blocks: list[dict] = []
    i = start
    if i >= len(paras):
        return blocks

    h1_meta = meta.get("H1", "").strip()
    if paras[i].strip() == h1_meta or len(paras[i].split()) <= 16:
        i += 1

    if i < len(paras) and not should_break_content(paras[i], in_faq=False) and not is_section_heading(
        paras[i], paras[i + 1] if i + 1 < len(paras) else None, in_faq=False
    ):
        blocks.append({"type": "intro", "text": paras[i]})
        i += 1

    while i < len(paras):
        line = paras[i]

        if is_cta(line):
            blocks.append({"type": "cta", "label": extract_cta(line)})
            i += 1
            continue

        if is_badges_line(line):
            blocks.append(
                {"type": "badges", "items": [part.strip() for part in line.split("|") if part.strip()]}
            )
            i += 1
            continue

        if is_faq_heading(line):
            i += 1
            faq_items, i = parse_faq_items(paras, i)
            blocks.append({"type": "faq", "items": faq_items})
            continue

        next_line = paras[i + 1] if i + 1 < len(paras) else None
        if is_section_heading(line, next_line, in_faq=False):
            heading = line
            i += 1
            paragraphs: list[str] = []
            while i < len(paras):
                nxt = paras[i]
                if should_break_content(nxt, in_faq=False):
                    break
                nxt_next = paras[i + 1] if i + 1 < len(paras) else None
                if is_section_heading(nxt, nxt_next, in_faq=False):
                    break
                paragraphs.append(nxt)
                i += 1
            blocks.append({"type": "section", "heading": heading, "paragraphs": paragraphs})
            continue

        i += 1

    return blocks


def build_hub_page(path: Path) -> dict:
    paras = read_docx(path)
    meta, content_start = parse_seo_block(paras)
    slug = slug_from_meta(meta)
    blocks = parse_content_blocks(paras, content_start, meta)

    intro = next((b["text"] for b in blocks if b["type"] == "intro"), "")
    sections = [
        {"heading": b["heading"], "body": "\n\n".join(b["paragraphs"])}
        for b in blocks
        if b["type"] == "section"
    ]
    faq = next((b["items"] for b in blocks if b["type"] == "faq"), [])
    ctas = [b["label"] for b in blocks if b["type"] == "cta"]
    badges = next((b["items"] for b in blocks if b["type"] == "badges"), [])

    return {
        "slug": slug,
        "sourceFile": path.name,
        "metaTitle": meta.get("Title Tag", ""),
        "metaDescription": meta.get("Meta Description", ""),
        "primaryKeyword": meta.get("Primary Keyword", ""),
        "secondaryKeywords": split_keywords(meta.get("Secondary Keywords", "")),
        "schemaTypes": split_keywords(meta.get("Schema Types", "").replace(" ", ", ")),
        "h1": meta.get("H1", ""),
        "intro": intro,
        "badges": badges,
        "sections": sections,
        "faq": faq,
        "ctas": ctas,
        "blocks": blocks,
        "internalLinks": parse_internal_links(meta.get("Internal Links", "")),
        "lastReviewed": date.today().isoformat(),
    }


def main() -> None:
    if not HUB_DOCX_DIR.exists():
        raise SystemExit(f"Missing folder: {HUB_DOCX_DIR}")

    docx_files = sorted(p for p in HUB_DOCX_DIR.glob("*.docx") if " (1)" not in p.stem)
    if not docx_files:
        raise SystemExit(f"No docx files in {HUB_DOCX_DIR}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    index: list[dict[str, str]] = []
    for path in docx_files:
        page = build_hub_page(path)
        slug = page["slug"]
        out_path = OUT_DIR / f"{slug}.json"
        out_path.write_text(json.dumps(page, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        index.append(
            {
                "slug": slug,
                "metaTitle": page["metaTitle"],
                "h1": page["h1"],
                "sourceFile": page["sourceFile"],
            }
        )
        print(f"  + {slug} ({len(page['sections'])} sections, {len(page['faq'])} FAQ, {len(page['ctas'])} CTAs)")

    INDEX_PATH.write_text(json.dumps({"pages": index}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nWrote {len(index)} hub pages to {OUT_DIR}")


if __name__ == "__main__":
    main()
