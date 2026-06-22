import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

DOCX = Path(r"C:\Users\adeel\Downloads\content.docx")
CATALOG = Path("data/ohio-state/all-courses.json")


def read_docx(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    paras: list[str] = []
    for p in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
        texts = [
            t.text or ""
            for t in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t")
        ]
        line = "".join(texts).strip()
        if line:
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
                    if nxt.endswith("?") and not ans:
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
            current_course["sections"].append(
                {"heading": heading, "body_paragraphs": len(body), "body_words": sum(len(x.split()) for x in body)}
            )
            continue

        i += 1

    if current_course and current_uni:
        current_uni["courses"].append(current_course)
    if current_uni:
        universities.append(current_uni)
    return universities


def main() -> None:
    paras = read_docx(DOCX)
    unis = parse_doc(paras)
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    cat_codes = {c["courseCode"].strip().upper(): c for c in catalog["courses"]}
    existing_seo = {
        c["courseCode"].strip().upper() for c in catalog["courses"] if c.get("seoContent")
    }

    print("=== DOC SUMMARY ===")
    doc_codes: set[str] = set()
    warnings: list[str] = []

    for u in unis:
        print(f"University: {u['name']} ({u['shortKey']}) — {len(u['courses'])} courses")
        for c in u["courses"]:
            code = c["code"].upper()
            doc_codes.add(code)
            in_cat = code in cat_codes
            has_seo = code in existing_seo
            print(
                f"  {c['code']}: sections={len(c['sections'])}, faq={len(c['faq'])}, "
                f"in_catalog={in_cat}, existing_seo={has_seo}"
            )
            if not c["h1"]:
                warnings.append(f"{c['code']}: missing H1")
            if len(c["sections"]) < 5:
                warnings.append(f"{c['code']}: only {len(c['sections'])} sections parsed (expected ~10+)")
            if not in_cat:
                warnings.append(f"{c['code']}: not in ohio-state catalog")

    missing_in_catalog = sorted(doc_codes - set(cat_codes.keys()))
    overlap_seo = sorted(doc_codes & existing_seo)
    new_in_doc = sorted((doc_codes & set(cat_codes.keys())) - existing_seo)
    seo_not_in_doc = sorted(existing_seo - doc_codes)

    print("\n=== VALIDATION ===")
    print(f"Total paragraphs in doc: {len(paras)}")
    print(f"Universities in doc: {len(unis)}")
    print(f"Courses in doc: {len(doc_codes)}")
    print(f"Courses in ohio-state catalog: {len(cat_codes)}")
    print(f"Catalog courses with existing seoContent: {len(existing_seo)}")
    print(f"Doc courses that will OVERWRITE existing seo: {len(overlap_seo)}")
    print(f"Doc courses new seo (in catalog, no prior seo): {len(new_in_doc)}")
    print(f"Doc courses NOT in catalog: {len(missing_in_catalog)}")
    if missing_in_catalog:
        print("  " + ", ".join(missing_in_catalog))
    print(f"Existing seo in catalog but NOT in doc: {len(seo_not_in_doc)}")
    if seo_not_in_doc:
        print("  " + ", ".join(seo_not_in_doc))

    if overlap_seo:
        print("\nWill overwrite existing seoContent for:")
        print("  " + ", ".join(overlap_seo))

    if warnings:
        print(f"\n=== WARNINGS ({len(warnings)}) ===")
        for w in warnings[:40]:
            print(f"  - {w}")
        if len(warnings) > 40:
            print(f"  ... and {len(warnings) - 40} more")

    print("\n=== SAMPLE: first course section headings ===")
    if unis and unis[0]["courses"]:
        c0 = unis[0]["courses"][0]
        print(f"{c0['code']} — {c0['h1'][:80] if c0['h1'] else 'NO H1'}...")
        for s in c0["sections"][:5]:
            print(f"  H2: {s['heading'][:70]} ({s['body_paragraphs']} paras)")


if __name__ == "__main__":
    main()
