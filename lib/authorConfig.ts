import authorBylineConfig from '@/config/author-byline.json';
import departmentSubjectsConfig from '@/config/department-subjects.json';

interface SubjectAreaConfig {
  bylineText: string;
  authorName: string;
  bioUrl: string;
}

interface AuthorBylineConfig {
  subjectAreas: Record<string, SubjectAreaConfig>;
}

interface DepartmentSubjectsConfig {
  mappings: Record<string, string>;
  universityOverrides?: Record<string, Record<string, string>>;
}

const authorConfig = authorBylineConfig as AuthorBylineConfig;
const deptConfig = departmentSubjectsConfig as DepartmentSubjectsConfig;

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveSubjectArea(
  department: string,
  universitySlug?: string
): string | null {
  const dept = department.trim();
  const upper = dept.toUpperCase();
  const lower = normalizeKey(dept);

  if (universitySlug) {
    const compositeKey = `${universitySlug}.${upper}`;
    const compositeLower = `${universitySlug}.${lower}`;
    if (deptConfig.mappings[compositeKey]) return deptConfig.mappings[compositeKey];
    if (deptConfig.mappings[compositeLower]) return deptConfig.mappings[compositeLower];
  }

  if (universitySlug && deptConfig.universityOverrides?.[universitySlug]) {
    const overrides = deptConfig.universityOverrides[universitySlug];
    if (overrides[upper]) return overrides[upper];
    if (overrides[lower]) return overrides[lower];
    for (const [key, area] of Object.entries(overrides)) {
      if (lower.includes(normalizeKey(key))) return area;
    }
  }

  if (deptConfig.mappings[upper]) return deptConfig.mappings[upper];
  if (deptConfig.mappings[lower]) return deptConfig.mappings[lower];

  for (const [key, area] of Object.entries(deptConfig.mappings)) {
    if (key.includes('.')) continue;
    if (lower.includes(normalizeKey(key))) return area;
  }

  return null;
}

export function getAuthorBylineForDepartment(
  department: string,
  universitySlug?: string
): { bylineText: string; authorName: string; bioUrl: string; subjectArea: string } {
  const subjectArea = resolveSubjectArea(department, universitySlug);
  if (!subjectArea) {
    throw new Error(
      `No author byline configured for department "${department}"` +
        (universitySlug ? ` at ${universitySlug}` : '') +
        `. Add a mapping in config/department-subjects.json and a subject area in config/author-byline.json.`
    );
  }

  const area = authorConfig.subjectAreas[subjectArea];
  if (!area) {
    throw new Error(
      `Subject area "${subjectArea}" is mapped for department "${department}" but missing from config/author-byline.json.`
    );
  }

  return { ...area, subjectArea };
}

export function listConfiguredSubjectAreas(): string[] {
  return Object.keys(authorConfig.subjectAreas);
}
