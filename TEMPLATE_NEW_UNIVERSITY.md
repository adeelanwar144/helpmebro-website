# Adding a New University

Use this checklist when onboarding a new university to the site. **Do not skip steps or invent data.**

## 1. Create the data folder

Create a directory under `data/` named exactly after the internal key (short, URL-safe):

```
data/{shortKey}/
├── meta.json          ← required
└── all-courses.json   ← required for live universities (see step 3)
```

Example:

```
data/ohio-state/
├── meta.json
└── all-courses.json
```

## 2. Write `meta.json` (required fields)

Copy this template and fill in **verified** values only:

```json
{
  "fullName": "The Ohio State University",
  "displaySlug": "ohio-state-university-assignment-help",
  "shortKey": "ohio-state",
  "status": "live",
  "assignmentHelpName": "Ohio State University",
  "theme": {
    "accentColor": null,
    "accentColorSource": null
  }
}
```

| Field | Description |
|-------|-------------|
| `fullName` | Official university name from the catalog or institution website |
| `displaySlug` | Production subdomain label (before `.helpmebro.com`). Must be unique. |
| `shortKey` | Internal identifier; **must match the folder name** and `?uni=` query param in dev |
| `status` | `"live"` (course data published) or `"coming_soon"` (placeholder page only) |
| `assignmentHelpName` | Optional. Used in `{Name} Assignment Help` title/H1. Defaults to `fullName` without a leading "The ". |
| `theme.accentColor` | Optional CSS color (e.g. `"#bb0000"`). **Leave `null` until you have an official, verifiable source.** |
| `theme.accentColorSource` | URL or citation for the accent color. Required when `accentColor` is set. |

### Rules

- **Never fabricate course data.** Every course must come from the university's official Summer catalog or equivalent primary source.
- **Never invent accent colors.** Use `null` until an official brand/style guide URL is documented in `accentColorSource`.
- **Never guess subdomain slugs** without confirming DNS/hosting plans.

## 3. Add course data (`all-courses.json`)

For `status: "live"` universities, add `all-courses.json` following the existing schema used by Fordham and Ohio State. The file must include:

- `university`, `universitySlug`, `term`, `location`
- `courses[]` with verified catalog fields (`courseCode`, `courseTitle`, `department`, `description`, `sourceUrl`, etc.)

Run the screening pipeline before content generation:

```bash
npx tsx scripts/generate-course-content.ts --university={shortKey}
```

Review `output/screening-report-{shortKey}.json` before approving generation.

### Screening / exclusion rules (automatic)

Courses are **excluded** (never given assignment-help pages) when descriptions match:

| Category | Examples |
|----------|----------|
| **Study abroad / foreign credit** | study abroad, foreign institution, international exchange, education abroad, overseas study |
| **Internships / practicum** | internship, practicum, co-op, cooperative education, field placement, clinical placement |
| **Supervised S/U experience** | S/U or pass/fail grading combined with supervised external work |
| **Individual studies (no syllabus)** | independent study, individual studies — unless the description defines a real syllabus/topics |
| **Credit containers** | transfer-credit arrangements with no academic subject content |
| **No academic subject content** | empty, generic, or non-substantive descriptions |

Implementation: `scripts/lib/screening.ts`

## 4. Sync the university registry

After adding or editing any `meta.json`, regenerate the build-time registry:

```bash
npm run sync:universities
```

This writes `lib/generated/universityRegistry.json`, which powers:

- Subdomain middleware (`displaySlug` → `shortKey`)
- Sitemap and robots.txt
- Footer / navigation links
- Theme accent lookup

`npm run dev` and `npm run build` run this automatically.

## 5. DNS / hosting

Point the descriptive subdomain to the app:

```
{displaySlug}.helpmebro.com  →  your deployment
```

Confirm the mapping in `lib/generated/universityRegistry.json` after sync.

## 6. Local development testing

- **Query param (always works):** `http://localhost:3000/?uni={shortKey}`
- **Subdomain (optional):** `http://{displaySlug}.localhost:3000/`

## 7. Verify before going live

- [ ] `meta.json` `shortKey` matches folder name
- [ ] `displaySlug` is unique across all universities
- [ ] Screening report reviewed; excluded courses are intentional
- [ ] No fabricated courses or colors
- [ ] `npm run sync:universities` committed (if registry changed)
- [ ] Homepage, department, and sample course pages load for `?uni={shortKey}`
- [ ] `/sitemap.xml` on subdomain lists only that university's URLs
- [ ] Title/H1 shows `{assignmentHelpName or fullName} Assignment Help`

## 8. Theme accent (when ready)

When you have an official color and source:

1. Set `theme.accentColor` and `theme.accentColorSource` in `meta.json`
2. Run `npm run sync:universities`
3. Accent applies only to **secondary** UI (badges, subtle borders) via `--university-accent`
4. Primary Help Me Bro identity (navy, gold, WhatsApp green) is unchanged

---

**Reminder:** Scaling to 50–100+ universities means repeating this folder + meta + screened course data pattern — not hardcoding names or slugs in application code.
