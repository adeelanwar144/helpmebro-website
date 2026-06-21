import fs from 'fs';
import path from 'path';
import {
  DATA_BASE_URL,
  NESTED_INDEX_FALLBACK_URL,
  type AllCoursesFile,
  type AllCoursesRecord,
  type Course,
  type DataIndex,
  type UniversityIndex,
} from '../../lib/types';
import { getDepartmentDisplayName, getDepartmentSlug } from '../../lib/departmentSlugs';
import { universityToSlug } from '../../lib/courseUtils';

function normalizeCourse(raw: Record<string, unknown>): Course {
  return {
    department: String(raw.department ?? ''),
    courseCode: String(raw.courseCode ?? ''),
    courseTitle: String(raw.courseTitle ?? raw.title ?? ''),
    section: (raw.section as string | null) ?? null,
    crn: (raw.crn as string | null) ?? null,
    session: ((raw.session ?? raw.sessionName) as string | null) ?? null,
    sessionStart: ((raw.sessionStart ?? raw.instructionStart) as string | null) ?? null,
    sessionEnd: ((raw.sessionEnd ?? raw.instructionEnd) as string | null) ?? null,
    location: (raw.location as string | null) ?? null,
    meetingDays: (raw.meetingDays as string | null) ?? null,
    meetingTime: (raw.meetingTime as string | null) ?? null,
    instructionMode: ((raw.instructionMode ?? raw.format) as string | null) ?? null,
    instructor: (raw.instructor as string | null) ?? null,
    credits: raw.credits != null ? String(raw.credits) : null,
    description: (raw.description as string | null) ?? null,
    attributes: (raw.attributes as string | null) ?? null,
    sourceUrl: ((raw.sourceUrl ?? raw.syllabusUrl ?? raw.dataSource) as string | null) ?? null,
  };
}

function isNestedUniversity(university: unknown): university is UniversityIndex {
  if (!university || typeof university !== 'object') return false;
  const u = university as UniversityIndex;
  return (
    typeof u.university === 'string' &&
    Array.isArray(u.departments) &&
    u.departments.some((d) => Array.isArray(d.courses))
  );
}

function isValidNestedIndex(data: unknown): data is DataIndex {
  if (!data || typeof data !== 'object') return false;
  const index = data as DataIndex;
  return Array.isArray(index.universities) && index.universities.some(isNestedUniversity);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function resolveNestedIndex(): Promise<DataIndex | null> {
  const localPath = path.join(process.cwd(), 'data', 'index.json');
  if (fs.existsSync(localPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(localPath, 'utf8')) as unknown;
      if (isValidNestedIndex(raw)) return raw;
    } catch {
      /* fall through */
    }
  }

  const fallback = await fetchJson<unknown>(NESTED_INDEX_FALLBACK_URL);
  if (isValidNestedIndex(fallback)) return fallback;

  const main = await fetchJson<unknown>(`${DATA_BASE_URL}/index.json`);
  if (isValidNestedIndex(main)) return main;

  return null;
}

function pickPrimarySection(sections: Course[]): Course {
  return (
    sections.find((s) => s.description && s.description.trim()) ??
    sections.find((s) => s.sourceUrl) ??
    sections[0]
  );
}

function buildRecordFromSections(
  sections: Course[],
  university: string,
  universitySlug: string
): AllCoursesRecord {
  const primary = pickPrimarySection(sections);
  const department = primary.department;
  const displayName = getDepartmentDisplayName(department, universitySlug);
  const departmentSlug = getDepartmentSlug(department, universitySlug);

  return {
    courseCode: primary.courseCode,
    courseTitle: primary.courseTitle,
    department,
    departmentSlug,
    departmentDisplayName: displayName,
    university,
    instructor: primary.instructor,
    credits: primary.credits,
    session: primary.session,
    sessionStart: primary.sessionStart,
    sessionEnd: primary.sessionEnd,
    location: primary.location,
    meetingDays: primary.meetingDays,
    meetingTime: primary.meetingTime,
    instructionMode: primary.instructionMode,
    attributes: primary.attributes,
    description: primary.description,
    sourceUrl: primary.sourceUrl,
  };
}

export async function fetchUniversityFromIndex(
  universitySlug: string
): Promise<{ university: string; term: string; location: string; courses: AllCoursesRecord[] } | null> {
  const index = await resolveNestedIndex();
  if (!index) return null;

  const uni = index.universities.find(
    (u) => isNestedUniversity(u) && universityToSlug(u.university) === universitySlug
  );
  if (!uni || !isNestedUniversity(uni)) return null;

  const slug = universityToSlug(uni.university);
  const courseMap = new Map<string, Course[]>();

  for (const dept of uni.departments) {
    for (const raw of dept.courses ?? []) {
      const course = normalizeCourse(raw as unknown as Record<string, unknown>);
      const key = course.courseCode.trim();
      if (!key) continue;
      const existing = courseMap.get(key) ?? [];
      existing.push(course);
      courseMap.set(key, existing);
    }
  }

  const courses = Array.from(courseMap.values()).map((sections) =>
    buildRecordFromSections(sections, uni.university, slug)
  );

  courses.sort((a, b) => a.courseCode.localeCompare(b.courseCode));

  return {
    university: uni.university,
    term: uni.term,
    location: uni.location,
    courses,
  };
}

export async function loadOrBootstrapAllCourses(
  universitySlug: string,
  filePath: string
): Promise<AllCoursesFile> {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as AllCoursesFile;
  }

  const fetched = await fetchUniversityFromIndex(universitySlug);
  if (!fetched) {
    throw new Error(
      `Could not load course data for "${universitySlug}". Ensure data/index.json exists or the GitHub index is reachable.`
    );
  }

  const file: AllCoursesFile = {
    university: fetched.university,
    universitySlug,
    term: fetched.term,
    location: fetched.location,
    generatedAt: new Date().toISOString(),
    courses: fetched.courses,
  };

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
  return file;
}

export function mergeExistingCourseData(
  bootstrapped: AllCoursesFile,
  existing: AllCoursesFile | null
): AllCoursesFile {
  if (!existing) return bootstrapped;

  const existingByCode = new Map(existing.courses.map((c) => [c.courseCode.trim(), c]));

  const mergedCourses = bootstrapped.courses.map((course) => {
    const prev = existingByCode.get(course.courseCode.trim());
    if (!prev) return course;
    return {
      ...course,
      excluded: prev.excluded,
      exclusionReason: prev.exclusionReason,
      exclusionPhrase: prev.exclusionPhrase,
      exclusionPattern: prev.exclusionPattern,
      // Prefer incoming seoContent (e.g. PHILOS import) when present; otherwise keep generated content.
      seoContent: course.seoContent ?? prev.seoContent,
    };
  });

  return {
    ...bootstrapped,
    screeningApprovedAt: existing.screeningApprovedAt,
    courses: mergedCourses,
  };
}

export function outputPath(filename: string): string {
  const dir = path.join(process.cwd(), 'output');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, filename);
}

export function writeJsonOutput(filename: string, data: unknown): string {
  const filePath = outputPath(filename);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return filePath;
}

export function appendJsonArrayOutput<T>(filename: string, entry: T): string {
  const filePath = outputPath(filename);
  let existing: T[] = [];
  if (fs.existsSync(filePath)) {
    existing = JSON.parse(fs.readFileSync(filePath, 'utf8')) as T[];
  }
  existing.push(entry);
  fs.writeFileSync(filePath, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
  return filePath;
}

export function departmentMatchesFilter(
  course: AllCoursesRecord,
  departmentFilter: string | null
): boolean {
  if (!departmentFilter) return true;
  const target = departmentFilter.trim().toLowerCase();
  return (
    course.department.toLowerCase() === target ||
    course.departmentSlug.toLowerCase() === target ||
    (course.departmentDisplayName?.toLowerCase().includes(target) ?? false) ||
    course.departmentSlug.toLowerCase().includes(target)
  );
}

export function isSkippedDepartment(
  course: AllCoursesRecord,
  skipDepartments: string[]
): boolean {
  if (!skipDepartments.length) return false;
  const deptUpper = course.department.toUpperCase();
  const deptSlug = course.departmentSlug.toLowerCase();
  const display = (course.departmentDisplayName ?? '').toLowerCase();

  return skipDepartments.some((skip) => {
    const s = skip.trim();
    const sLower = s.toLowerCase();
    return (
      deptUpper === s.toUpperCase() ||
      deptSlug === sLower ||
      deptSlug.includes(sLower) ||
      display.includes(sLower)
    );
  });
}
