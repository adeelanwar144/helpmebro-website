"""Import course SEO content from a structured content.docx into all-courses.json."""

from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

DOCX = Path(r"C:\Users\adeel\Downloads\content.docx")
CATALOG = Path("data/ohio-state/all-courses.json")
STANDARD_BYLINE = (
    "Written and reviewed by Muhammad Ahsan (Sheikh), PhD Scholar at the University of "
    "Sydney, with over 12 years of experience helping students achieve excellent results "
    "across academic subjects"
)


def normalize_text(text: str) -> str:
    return text.replace("\ufffd", "–").replace("—", "–").strip()


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
        if line and line != "...":
            paras.append(line)
    return paras


def is_course_boundary(line: str) -> bool:
    return bool(re.match(r"^=== UNIVERSITY:", line) or re.match(r"^--- COURSE:", line))


def parse_doc(paras: list[str]) -> list[dict]:
    universities: list[dict] = []
    current_uni: dict | None = None
    current_course: dict | None = None
    i = 0

    while i < len(paras):
        line = paras[i]

        m_uni = re.match(r"^=== UNIVERSITY:\s*(.+?)\s*===$", line)
        if m_uni:
            if current_course and current_uni:
                current_uni["courses"].append(current_course)
                current_course = None
            if current_uni:
                universities.append(current_uni)
            current_uni = {"name": m_uni.group(1).strip(), "shortKey": None, "courses": []}
            i += 1
            continue

        if current_uni and line.lower().startswith("short key:"):
            current_uni["shortKey"] = line.split(":", 1)[1].strip()
            i += 1
            continue

        m_course = re.match(r"^--- COURSE:\s*(.+?)\s*---$", line)
        if m_course:
            if current_course and current_uni:
                current_uni["courses"].append(current_course)
            current_course = {
                "code": m_course.group(1).strip(),
                "h1": None,
                "sections": [],
                "faq": [],
            }
            i += 1
            if i < len(paras) and not is_course_boundary(paras[i]) and paras[i] != "---":
                current_course["h1"] = paras[i]
                i += 1
            continue

        if line == "---":
            i += 1
            continue

        if line.upper() == "FAQ" and current_course:
            i += 1
            while i < len(paras) and not is_course_boundary(paras[i]):
                if paras[i] == "---":
                    i += 1
                    continue
                q = paras[i]
                i += 1
                ans: list[str] = []
                while i < len(paras):
                    nxt = paras[i]
                    if nxt == "---" or is_course_boundary(nxt) or nxt.upper() == "FAQ":
                        break
                    if nxt.endswith("?") and ans:
                        break
                    ans.append(nxt)
                    i += 1
                current_course["faq"].append({"q": q, "a": " ".join(ans)})
            continue

        if current_course:
            heading = line
            i += 1
            body: list[str] = []
            while i < len(paras):
                nxt = paras[i]
                if nxt == "---" or nxt.upper() == "FAQ" or is_course_boundary(nxt):
                    break
                if nxt.endswith("?") and body:
                    break
                body.append(nxt)
                i += 1
            current_course["sections"].append({"heading": heading, "body": "\n\n".join(body)})
            continue

        i += 1

    if current_course and current_uni:
        current_uni["courses"].append(current_course)
    if current_uni:
        universities.append(current_uni)
    return universities


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
        if "assignment help" in words:
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
        "lastReviewed": date.today().isoformat(),
        "generationAttempts": 1,
    }


def main() -> None:
    if not DOCX.exists():
        raise SystemExit(f"Docx not found: {DOCX}")

    unis = parse_doc(read_docx(DOCX))
    doc_courses: dict[str, dict] = {}
    for uni in unis:
        for course in uni["courses"]:
            doc_courses[course["code"].strip().upper()] = course

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    updated: list[str] = []
    skipped_existing: list[str] = []

    for record in catalog["courses"]:
        code = record["courseCode"].strip().upper()
        if code not in doc_courses:
            continue
        if record.get("seoContent"):
            skipped_existing.append(code)
            continue
        record["seoContent"] = build_seo_content(doc_courses[code])
        updated.append(code)

    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Updated {len(updated)} courses:")
    for code in updated:
        print(f"  + {code}")
    if skipped_existing:
        print(f"Skipped (already had seoContent): {', '.join(skipped_existing)}")


if __name__ == "__main__":
    main()
