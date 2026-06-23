"""Import course SEO content from per-course PDF files into all-courses.json."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

from pypdf import PdfReader

STANDARD_BYLINE = (
    "Written and reviewed by Muhammad Ahsan (Sheikh), PhD Scholar at the University of "
    "Sydney, with over 12 years of experience helping students achieve excellent results "
    "across academic subjects"
)

FOOTER_MARKERS = (
    "about the author",
    "course information",
    "university:",
    "department:",
    "course code:",
    "course title:",
    "crn:",
    "instructor:",
    "credits:",
    "session:",
    "instruction mode:",
    "course dates:",
    "last reviewed:",
    "reviewed and structured under",
    "about the reviewer",
    "e-e-a-t",
)


def normalize_text(text: str) -> str:
    text = text.replace("\ufffd", "").replace("—", "–")
    text = re.sub(r"\s+,", ",", text)
    text = re.sub(r",\s+", ", ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def read_pdf_lines(path: Path) -> list[str]:
    reader = PdfReader(str(path))
    raw_lines: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        for raw in text.splitlines():
            line = normalize_text(raw)
            if not line or re.fullmatch(r"\d+", line):
                continue
            raw_lines.append(line)

    merged = merge_wrapped_lines(raw_lines)
    return split_embedded_byline(merged)


def split_embedded_byline(lines: list[str]) -> list[str]:
    expanded: list[str] = []
    for line in lines:
        match = re.search(r"(Written and reviewed by.+)$", line, re.I)
        if match and match.start() > 0:
            expanded.append(line[: match.start()].strip())
            expanded.append(match.group(1).strip())
            continue
        expanded.append(line)
    return expanded


def merge_wrapped_lines(lines: list[str]) -> list[str]:
    merged: list[str] = []
    i = 0
    while i < len(lines):
        current = lines[i]
        while i + 1 < len(lines):
            nxt = lines[i + 1]
            if is_footer_line(nxt):
                break
            if should_merge_lines(current, nxt):
                current = f"{current} {nxt}"
                i += 1
                continue
            if is_section_heading(nxt):
                break
            break
        merged.append(current)
        i += 1
    return merged


def should_merge_lines(current: str, nxt: str) -> bool:
    lower_current = current.lower()
    lower_next = nxt.lower()
    if "written and reviewed by" in lower_current or "written and reviewed by" in lower_next:
        return False
    if is_section_heading(current):
        return False
    if not current.endswith("?") and nxt.endswith("?") and len(nxt.split()) <= 2:
        return True
    if is_section_heading(nxt):
        return False
    if current.endswith("-"):
        return True
    if not re.search(r"[.?!:]$", current) and nxt[:1].islower():
        return True
    if current.endswith(" Ohio") and nxt.startswith("State"):
        return True
    return False


def is_footer_line(line: str) -> bool:
    lower = line.lower()
    return any(lower.startswith(marker) for marker in FOOTER_MARKERS)


def is_section_heading(line: str) -> bool:
    return line.endswith("?") and len(line) < 160


FILENAME_CODE_RE = re.compile(r"^([A-Za-z]+\s+\d+(?:\.\d+)*)", re.I)


def course_code_from_filename(path: Path) -> str | None:
    stem = re.sub(r"\s*\(\d+\)$", "", path.stem.strip())
    match = FILENAME_CODE_RE.match(stem)
    if not match:
        return None
    return match.group(1).strip().upper()


def is_intro_prose(line: str) -> bool:
    if len(line) < 50 or line.endswith("?"):
        return False
    lower = line.lower()
    starters = (
        "many students",
        "statistics is",
        "social problems",
        "looking for",
        "assignments frequently",
        "one of the",
        "the course",
        "whether you're",
        "whether you are",
        "poverty,",
        "climate change",
        "socwork",
        "students enrolled",
        "students often",
        "if you're",
        "if you are",
    )
    if any(lower.startswith(s) for s in starters):
        return True
    return len(line.split()) > 12 and "." in line


def is_title_line(line: str, code: str) -> bool:
    if is_section_heading(line):
        return False
    upper = line.upper()
    dept = code.split()[0].upper()
    if dept in upper or code.upper() in upper:
        return True
    lower = line.lower()
    if any(token in lower for token in ("assignment help", "coursework help", "essay help")):
        return True
    if lower in {"at ohio state", "ohio state"}:
        return True
    return len(line.split()) <= 8 and not line.endswith(".")


def split_header(lines: list[str], code: str) -> tuple[str, list[str]]:
    h1_parts: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if is_section_heading(line):
            break
        if h1_parts and not is_title_line(line, code) and is_intro_prose(line):
            break
        if not h1_parts and not is_title_line(line, code) and is_intro_prose(line):
            break
        h1_parts.append(line)
        i += 1
    h1 = " ".join(h1_parts).strip()
    if not h1:
        h1 = f"{code} Assignment Help at Ohio State"
    return h1, lines[i:]


def parse_sections(content_lines: list[str], code: str) -> list[dict[str, str]]:
    sections: list[dict[str, str]] = []
    preface: list[str] = []
    while content_lines and not is_section_heading(content_lines[0]):
        if is_footer_line(content_lines[0]):
            break
        preface.append(content_lines.pop(0))

    i = 0
    while i < len(content_lines):
        line = content_lines[i]
        if is_footer_line(line):
            break
        if not is_section_heading(line):
            i += 1
            continue

        heading = line
        i += 1
        body_lines: list[str] = []
        while i < len(content_lines):
            nxt = content_lines[i]
            if is_footer_line(nxt) or is_section_heading(nxt):
                break
            body_lines.append(nxt)
            i += 1

        body = format_body(body_lines)
        if body:
            sections.append({"heading": heading, "body": body})

    if preface:
        preface_body = format_body(preface)
        if sections:
            sections[0]["body"] = f"{preface_body}\n\n{sections[0]['body']}".strip()
        elif preface_body:
            sections.append(
                {
                    "heading": f"Need Help With {code} at Ohio State?",
                    "body": preface_body,
                }
            )
    return sections


def parse_pdf_with_byline(lines: list[str], code: str, byline_idx: int) -> tuple[str, list[str]]:
    pre_byline = lines[:byline_idx]
    byline_line = lines[byline_idx]
    if byline_line.lower().startswith("written and reviewed by"):
        h1_parts = pre_byline
    else:
        split_at = re.search(r"written and reviewed by", byline_line, re.I)
        h1_parts = pre_byline + ([byline_line[: split_at.start()].strip()] if split_at else [])

    h1 = " ".join(part for part in h1_parts if part).strip()
    if not h1:
        raise ValueError("missing H1")

    content_lines = lines[byline_idx + 1 :]
    if not byline_line.lower().startswith("written and reviewed by"):
        split_at = re.search(r"(written and reviewed by.+)$", byline_line, re.I)
        if split_at:
            content_lines = [split_at.group(1).strip(), *content_lines]

    while content_lines and not is_section_heading(content_lines[0]):
        if any(
            token in content_lines[0].lower()
            for token in (
                "written and reviewed by",
                "phd scholar",
                "years of experience",
                "disciplines.",
                "coursework performance",
            )
        ):
            content_lines.pop(0)
            continue
        break

    while content_lines and not is_section_heading(content_lines[0]):
        content_lines.pop(0)

    return h1, content_lines


def parse_pdf(path: Path, expected_code: str | None = None) -> dict:
    lines = read_pdf_lines(path)
    if not lines:
        raise ValueError("no text extracted")

    code = expected_code or course_code_from_filename(path)
    if not code:
        raise ValueError("could not determine course code from filename")

    byline_idx = next(
        (
            i
            for i, line in enumerate(lines)
            if line.lower().startswith("written and reviewed by")
            or "written and reviewed by" in line.lower()
        ),
        None,
    )
    if byline_idx is None:
        h1, content_lines = split_header(lines, code)
    else:
        h1, content_lines = parse_pdf_with_byline(lines, code, byline_idx)

    sections = parse_sections(content_lines, code)
    if not sections:
        raise ValueError("no sections parsed")

    last_reviewed = date.today().isoformat()
    for line in lines:
        m = re.search(r"last reviewed:\s*(\d{4}-\d{2}-\d{2})", line, re.I)
        if m:
            last_reviewed = m.group(1)
            break

    word_count = len(re.findall(r"\S+", h1 + " " + " ".join(s["body"] for s in sections)))
    return {
        "code": code,
        "h1": h1,
        "sections": sections,
        "faq": [],
        "lastReviewed": last_reviewed,
        "wordCount": word_count,
        "sourceFile": path.name,
    }


def format_body(lines: list[str]) -> str:
    if not lines:
        return ""

    paragraphs: list[str] = []
    buffer: list[str] = []
    list_items: list[str] = []

    def flush_prose() -> None:
        nonlocal buffer
        if buffer:
            paragraphs.append(" ".join(buffer))
            buffer = []

    def flush_list() -> None:
        nonlocal list_items
        if list_items:
            paragraphs.append("\n".join(f"- {item}" for item in list_items))
            list_items = []

    for line in lines:
        if is_list_item(line):
            flush_prose()
            list_items.append(line)
            continue
        flush_list()
        if line.endswith((".", "!", "?", ":")):
            buffer.append(line)
            flush_prose()
        else:
            buffer.append(line)

    flush_list()
    flush_prose()
    return "\n\n".join(paragraphs)


def is_list_item(line: str) -> bool:
    if len(line) > 80 or line.endswith("."):
        return False
    words = line.split()
    if len(words) > 8:
        return False
    if line.endswith(":"):
        return False
    if is_section_heading(line):
        return False
    title_like = sum(1 for w in words if w[:1].isupper()) >= max(1, len(words) - 1)
    return title_like


def build_meta_description(course: dict) -> str:
    if not course["sections"]:
        return course["h1"] or ""
    first_body = course["sections"][0]["body"]
    first_para = first_body.split("\n\n")[0].strip()
    if len(first_para) <= 160:
        return first_para
    trimmed = first_para[:157].rsplit(" ", 1)[0]
    return f"{trimmed}..."


def build_keywords(course: dict) -> list[str]:
    code = course["code"]
    dept = code.split()[0] if " " in code else code
    base = [
        f"{code} assignment help",
        f"{code} Ohio State assignment help",
        f"{dept} assignment help Ohio State",
        f"{code} coursework help",
        f"{code} essay help",
    ]
    for section in course["sections"][:3]:
        words = section["heading"].lower()
        if "assignment help" in words or "essay" in words:
            phrase = section["heading"].split("?")[0].strip()
            if len(phrase) < 80:
                base.append(phrase)
    seen: set[str] = set()
    out: list[str] = []
    for item in base:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out[:12]


def build_seo_content(course: dict) -> dict:
    code = course["code"]
    sections = [{"heading": s["heading"], "body": s["body"]} for s in course["sections"]]

    if course["faq"]:
        faq_body = "\n\n".join(f"{item['q']}\n\n{item['a']}" for item in course["faq"])
        sections.append(
            {
                "heading": f"Frequently Asked Questions About {code}",
                "body": faq_body,
            }
        )

    h1 = course["h1"] or f"{code} Assignment Help at Ohio State"
    return {
        "metaTitle": h1 if len(h1) <= 70 else f"{code} Assignment Help at Ohio State",
        "metaDescription": build_meta_description(course),
        "h1": h1,
        "byline": STANDARD_BYLINE,
        "bioUrl": "/about-us",
        "sections": sections,
        "keywords": build_keywords(course),
        "lastReviewed": course.get("lastReviewed") or date.today().isoformat(),
        "generationAttempts": 1,
    }


def index_pdfs(pdf_dir: Path) -> dict[str, Path]:
    indexed: dict[str, Path] = {}
    for path in sorted(pdf_dir.glob("*.pdf")):
        code = course_code_from_filename(path)
        if not code:
            continue
        existing = indexed.get(code)
        if existing is None or _pdf_preferred(path, existing):
            indexed[code] = path
    return indexed


def _pdf_preferred(candidate: Path, current: Path) -> bool:
    candidate_copy = bool(re.search(r"\(\d+\)$", candidate.stem))
    current_copy = bool(re.search(r"\(\d+\)$", current.stem))
    if current_copy and not candidate_copy:
        return True
    if candidate_copy and not current_copy:
        return False
    return candidate.stat().st_mtime >= current.stat().st_mtime


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--pdf-dir",
        type=Path,
        default=Path(r"C:\Users\adeel\Downloads"),
        help="Directory containing one PDF per course",
    )
    parser.add_argument(
        "--catalog",
        type=Path,
        default=Path("data/ohio-state/all-courses.json"),
        help="Path to all-courses.json",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and report without writing catalog changes",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace existing seoContent when a PDF is present",
    )
    args = parser.parse_args()

    if not args.pdf_dir.is_dir():
        raise SystemExit(f"PDF directory not found: {args.pdf_dir}")
    if not args.catalog.exists():
        raise SystemExit(f"Catalog not found: {args.catalog}")

    pdf_index = index_pdfs(args.pdf_dir)
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    catalog_codes = {c["courseCode"].strip().upper(): c for c in catalog["courses"]}

    updated: list[str] = []
    skipped_existing: list[str] = []
    parse_errors: list[str] = []
    warnings: list[str] = []
    missing_pdfs: list[str] = []

    for code, record in sorted(catalog_codes.items()):
        needs_content = not record.get("seoContent")
        if record.get("excluded"):
            continue
        if not needs_content and not args.overwrite:
            continue
        pdf_path = pdf_index.get(code)
        if not pdf_path:
            if needs_content:
                missing_pdfs.append(code)
            continue
        if record.get("seoContent") and not args.overwrite:
            skipped_existing.append(code)
            continue
        try:
            parsed = parse_pdf(pdf_path, expected_code=code)
        except Exception as exc:  # noqa: BLE001
            parse_errors.append(f"{code}: {exc}")
            continue

        if len(parsed["sections"]) < 5:
            warnings.append(f"{code}: only {len(parsed['sections'])} sections parsed")

        if not args.dry_run:
            record["seoContent"] = build_seo_content(parsed)
        updated.append(code)

    if not args.dry_run and updated:
        args.catalog.write_text(
            json.dumps(catalog, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    unmatched_pdfs = sorted(set(pdf_index) - set(catalog_codes))

    print(f"PDF directory: {args.pdf_dir}")
    print(f"PDFs matched by filename: {len(pdf_index)}")
    print(f"{'Would update' if args.dry_run else 'Updated'}: {len(updated)}")
    for code in updated:
        print(f"  + {code}")
    if skipped_existing:
        print(f"Skipped (already had seoContent): {', '.join(skipped_existing)}")
    if missing_pdfs:
        print(f"\nCatalog courses still missing PDFs: {len(missing_pdfs)}")
        print("  " + ", ".join(missing_pdfs[:30]))
        if len(missing_pdfs) > 30:
            print(f"  ... and {len(missing_pdfs) - 30} more")
    if unmatched_pdfs:
        print(f"\nPDFs not in catalog: {len(unmatched_pdfs)}")
        print("  " + ", ".join(unmatched_pdfs[:30]))
    if parse_errors:
        print(f"\nParse errors ({len(parse_errors)}):")
        for err in parse_errors:
            print(f"  - {err}")
    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for warning in warnings[:40]:
            print(f"  - {warning}")
        if len(warnings) > 40:
            print(f"  ... and {len(warnings) - 40} more")

    if parse_errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
