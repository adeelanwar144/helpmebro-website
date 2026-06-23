import 'server-only';

import { headers } from 'next/headers';

import {
  DATA_BASE_URL,
  INDEX_URL,
  NESTED_INDEX_FALLBACK_URL,
  SITE_SEO_CONTENT_BASE_URL,
  SITE_SEO_CONTENT_CDN_BASE_URL,
  type AllCoursesFile,
  type Course,
  type DataIndex,
  type Department,
  type SiteData,
  type SiteStats,
  type UniversityData,
  type UniversityIndex,
  type UniversitySummaryFile,
  type DepartmentFileRaw,
} from './types';
import { getLiveUniversityShortKeys, isLiveSlug } from './universities';
import {
  universityToSlug,
  nameToDepartmentSlug,
  courseCodeToSlug,
  buildSearchableCourses,
  findCourse,
  findDepartmentBySlug,
} from './courseUtils';
import { processUniversityData, findUniqueCourse } from './processUniversity';
import { getDepartmentSlug } from './departmentSlugs';
import {
  buildSeoContentIndex,
  getSeoContentForCourse,
  isCourseExcluded,
} from './seoContentIndex';
import { getBundledAllCoursesFile, mergeAllCoursesFiles } from './bundledAllCourses';

export {
  universityToSlug,
  nameToDepartmentSlug,
  courseCodeToSlug,
  getDepartmentSlug,
  findCourse,
  findDepartmentBySlug,
  findUniqueCourse,
  buildSearchableCourses,
};

const FETCH_OPTIONS = { next: { revalidate: 3600 } } as const;
const EXTERNAL_FETCH_OPTIONS: RequestInit = { cache: 'no-store' };

async function fetchExternalJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, EXTERNAL_FETCH_OPTIONS);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function fetchStaticSeoFromRequestHost(universitySlug: string): Promise<AllCoursesFile | null> {
  try {
    const requestHeaders = headers();
    const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
    if (!host) return null;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return fetchExternalJson<AllCoursesFile>(
      `${protocol}://${host}/data/${universitySlug}/all-courses.json`
    );
  } catch {
    return null;
  }
}

async function fetchPublishedSeoContentFile(universitySlug: string): Promise<AllCoursesFile | null> {
  const sources = [
    `${SITE_SEO_CONTENT_CDN_BASE_URL}/${universitySlug}/all-courses.json`,
    `${SITE_SEO_CONTENT_BASE_URL}/${universitySlug}/all-courses.json`,
    `https://helpmebro.org/data/${universitySlug}/all-courses.json`,
  ];

  for (const url of sources) {
    const file = await fetchExternalJson<AllCoursesFile>(url);
    if (file?.courses?.length) return file;
  }

  return fetchStaticSeoFromRequestHost(universitySlug);
}

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
    const res = await fetch(url, FETCH_OPTIONS);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function resolveNestedIndex(): Promise<DataIndex | null> {
  const main = await fetchJson<unknown>(INDEX_URL);

  if (isValidNestedIndex(main)) return main;

  const fallback = await fetchJson<unknown>(NESTED_INDEX_FALLBACK_URL);
  if (isValidNestedIndex(fallback)) return fallback;

  return null;
}

async function mergeSeoContent(university: UniversityData): Promise<UniversityData> {
  const remoteFile = await fetchJson<AllCoursesFile>(
    `${DATA_BASE_URL}/${university.slug}/all-courses.json`
  );
  const publishedSeoFile = await fetchPublishedSeoContentFile(university.slug);
  const mergedFile = mergeAllCoursesFiles(
    remoteFile,
    getBundledAllCoursesFile(university.slug),
    publishedSeoFile
  );
  const index = buildSeoContentIndex(mergedFile);

  const departments = university.departments.map((dept) => {
    if (!dept.uniqueCourses) return dept;

    const uniqueCourses = dept.uniqueCourses.map((course) => {
      const code = course.courseCode.trim();
      const seoContent = getSeoContentForCourse(code, index);
      const excluded = isCourseExcluded(code, index);
      return {
        ...course,
        ...(seoContent ? { seoContent } : {}),
        ...(excluded ? { excluded: true } : {}),
      };
    });

    return { ...dept, uniqueCourses };
  });

  return { ...university, departments };
}

async function enrichFromNested(university: UniversityIndex): Promise<UniversityData> {
  const slug = universityToSlug(university.university);
  const departments: Department[] = university.departments.map((dept) => ({
    name: dept.name,
    count: dept.courses?.length ?? dept.count ?? 0,
    courses: (dept.courses ?? []).map((c) => normalizeCourse(c as unknown as Record<string, unknown>)),
  }));

  return mergeSeoContent(
    processUniversityData({
      ...university,
      slug,
      departments,
      totalCourses: departments.reduce((sum, d) => sum + d.courses.length, 0),
      courses: departments.flatMap((d) => d.courses),
    })
  );
}

async function loadUniversityFromFolders(slug: string): Promise<UniversityData | null> {
  const summary = await fetchJson<UniversitySummaryFile>(`${DATA_BASE_URL}/${slug}/summer2026.json`);
  if (!summary?.departments) return null;

  const activeDepts = summary.departments.filter((d) => d.count > 0);
  const departmentResults = await Promise.all(
    activeDepts.map(async (dept) => {
      const deptSlug = nameToDepartmentSlug(dept.name);
      const file = await fetchJson<DepartmentFileRaw>(`${DATA_BASE_URL}/${slug}/${deptSlug}.json`);
      if (!file?.courses?.length) return null;
      const courses = file.courses.map((c) => normalizeCourse(c));
      return { name: file.department ?? dept.name, count: courses.length, courses };
    })
  );

  const departments = departmentResults.filter(Boolean) as Department[];
  if (!departments.length) return null;

  return mergeSeoContent(
    processUniversityData({
      slug: summary.id ?? slug,
      university: summary.fullName,
      location: summary.city,
      term: summary.term,
      totalCourses: departments.reduce((sum, d) => sum + d.courses.length, 0),
      departments,
      courses: departments.flatMap((d) => d.courses),
    })
  );
}

async function loadFromNestedIndex(): Promise<UniversityData[]> {
  const index = await resolveNestedIndex();
  if (!index) return [];

  const universities = await Promise.all(
    index.universities.filter(isNestedUniversity).map(enrichFromNested)
  );
  return universities.filter((u) => isLiveSlug(u.slug));
}

async function loadFromFolders(): Promise<UniversityData[]> {
  const results = await Promise.all(
    getLiveUniversityShortKeys().map((slug) => loadUniversityFromFolders(slug))
  );
  return results.filter(Boolean) as UniversityData[];
}

export function computeIndexStats(universities: UniversityData[]): SiteStats {
  return {
    totalSections: universities.reduce((sum, u) => sum + (u.totalSections ?? u.courses.length), 0),
    totalUniqueCourses: universities.reduce(
      (sum, u) => sum + (u.totalUniqueCourses ?? 0),
      0
    ),
    totalDepartments: universities.reduce(
      (sum, u) => sum + (u.totalDepartments ?? u.departments.length),
      0
    ),
    totalUniversities: universities.length,
  };
}

/** Single source of truth for homepage stats, search, and university cards */
export async function getSiteData(): Promise<SiteData> {
  let universities = await loadFromNestedIndex();

  if (!universities.length) {
    universities = await loadFromFolders();
  }

  universities = universities
    .filter((u) => isLiveSlug(u.slug))
    .sort((a, b) => a.university.localeCompare(b.university));

  const stats = computeIndexStats(universities);
  const searchableCourses = buildSearchableCourses(universities);

  return { universities, stats, searchableCourses };
}

export async function fetchAllUniversities(): Promise<UniversityData[]> {
  return (await getSiteData()).universities;
}

export async function fetchUniversityData(slug: string): Promise<UniversityData | null> {
  if (!isLiveSlug(slug)) return null;
  let uni = (await getSiteData()).universities.find((u) => u.slug === slug) ?? null;
  if (!uni) {
    uni = await loadUniversityFromFolders(slug);
  }
  if (!uni) return null;
  return mergeSeoContent(uni);
}

/** All route URLs for a live university subdomain sitemap */
export function getUniversityRoutePaths(university: UniversityData): string[] {
  const paths = ['/'];

  for (const dept of university.departments) {
    if (!dept.slug) continue;
    paths.push(`/${dept.slug}`);
    for (const course of dept.uniqueCourses ?? []) {
      if (course.excluded) continue;
      paths.push(`/${dept.slug}/${course.slug}`);
    }
  }

  return paths;
}
