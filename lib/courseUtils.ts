import type { Course, Department, SearchableCourse, UniqueCourse, UniversityData } from './types';
import { getDepartmentSlug } from './departmentSlugs';
import { coursePagePath, hrefOnUniversity } from './routing';
import { getUniversityRegistry } from './universities';

function buildSlugOverrides(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const u of getUniversityRegistry()) {
    map[u.fullName.toLowerCase()] = u.shortKey;
    const withoutThe = u.fullName.replace(/^The\s+/i, '').trim().toLowerCase();
    if (withoutThe) map[withoutThe] = u.shortKey;
  }
  return map;
}

let slugOverridesCache: Record<string, string> | null = null;

function getSlugOverrides(): Record<string, string> {
  if (!slugOverridesCache) slugOverridesCache = buildSlugOverrides();
  return slugOverridesCache;
}

export function universityToSlug(name: string): string {
  const key = name.trim().toLowerCase();
  const overrides = getSlugOverrides();
  if (overrides[key]) return overrides[key];
  return key
    .replace(/^the\s+/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function nameToDepartmentSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Single slugification utility for course codes — used everywhere. */
export function courseCodeToSlug(code: string): string {
  return code
    .toLowerCase()
    .trim()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findCourse(courses: Course[], courseCodeSlug: string): Course | undefined {
  const target = courseCodeSlug.toLowerCase();
  return courses.find((c) => courseCodeToSlug(c.courseCode) === target);
}

export function findUniqueCourseBySlug(
  uniqueCourses: UniqueCourse[] | undefined,
  courseSlug: string
): UniqueCourse | undefined {
  if (!uniqueCourses) return undefined;
  const target = courseSlug.toLowerCase();
  return uniqueCourses.find((c) => c.slug === target);
}

export function findDepartmentBySlug(
  departments: Pick<Department, 'name' | 'slug'>[],
  slug: string,
  universitySlug?: string
): Department | undefined {
  const target = slug.toLowerCase();
  return departments.find((d) => {
    if (d.slug && d.slug === target) return true;
    if (universitySlug) {
      return getDepartmentSlug(d.name, universitySlug) === target;
    }
    return nameToDepartmentSlug(d.name) === target;
  }) as Department | undefined;
}

export function buildSearchableCourses(universities: UniversityData[]): SearchableCourse[] {
  const seen = new Set<string>();

  return universities.flatMap((uni) =>
    uni.departments.flatMap((dept) => {
      const deptSlug = dept.slug ?? getDepartmentSlug(dept.name, uni.slug);
      const uniqueCourses = dept.uniqueCourses ?? [];

      return uniqueCourses
        .map((course) => {
          const dedupeKey = `${uni.slug}:${deptSlug}:${course.slug}`;
          if (seen.has(dedupeKey)) return null;
          seen.add(dedupeKey);

          const path = coursePagePath(deptSlug, course.slug);
          return {
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            university: uni.university,
            universitySlug: uni.slug,
            departmentSlug: deptSlug,
            courseSlug: course.slug,
            href: hrefOnUniversity(path, uni.slug),
          };
        })
        .filter(Boolean) as SearchableCourse[];
    })
  );
}

export function filterSearchableCourses(
  courses: SearchableCourse[],
  query: string
): SearchableCourse[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return courses.filter(
    (c) =>
      c.courseCode.toLowerCase().includes(q) ||
      c.courseTitle.toLowerCase().includes(q) ||
      c.university.toLowerCase().includes(q)
  );
}
