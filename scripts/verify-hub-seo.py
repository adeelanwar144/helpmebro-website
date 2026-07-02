"""Validate SEO fields for all imported hub pages."""

from __future__ import annotations

import json
import sys
from pathlib import Path

HUB_DIR = Path("data/hub-pages")
MONEY_PAGE_SLUG = "college-essay-writing-services"


def main() -> None:
    index = json.loads((HUB_DIR / "index.json").read_text(encoding="utf-8"))
    slugs = [p["slug"] for p in index["pages"]]
    warnings: list[str] = []
    errors: list[str] = []

    for slug in slugs:
        page = json.loads((HUB_DIR / f"{slug}.json").read_text(encoding="utf-8"))
        title = page.get("metaTitle", "")
        desc = page.get("metaDescription", "")

        if not title:
            errors.append(f"{slug}: missing metaTitle")
        elif len(title) > 60:
            warnings.append(f"{slug}: title {len(title)} chars (target <=60)")

        if not desc:
            errors.append(f"{slug}: missing metaDescription")
        elif len(desc) > 160:
            warnings.append(f"{slug}: meta description {len(desc)} chars (target <=160)")

        if not page.get("h1"):
            errors.append(f"{slug}: missing h1")
        if not page.get("primaryKeyword"):
            errors.append(f"{slug}: missing primaryKeyword")
        if len(page.get("faq", [])) < 5:
            warnings.append(f"{slug}: only {len(page.get('faq', []))} FAQ items")
        if len(page.get("ctas", [])) < 1:
            errors.append(f"{slug}: no CTAs")
        if len(page.get("sections", [])) < 3:
            warnings.append(f"{slug}: only {len(page.get('sections', []))} sections")

    print(f"Hub pages checked: {len(slugs)}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")

    for msg in errors:
        print(f"  ERROR  {msg}")
    for msg in warnings:
        print(f"  WARN   {msg}")

    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
