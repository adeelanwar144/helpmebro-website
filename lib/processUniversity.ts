import { courseCodeToSlug } from './courseUtils';
import { getDepartmentDisplayName, getDepartmentSlug } from './departmentSlugs';
import type { Course, Department, UniqueCourse, UniversityData } from './types';

export function groupSectionsByCourseCode(sections: Course[]): UniqueCourse[] {
  const map = new Map<string, Course[]>();

  for (const section of sections) {
    const key = section.courseCode.trim();
    if (!key) continue;
    const existing = map.get(key) ?? [];
    existing.push(section);
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([courseCode, sectionRows]) => ({
      courseCode,
      courseTitle: sectionRows[0]?.courseTitle ?? courseCode,
      department: sectionRows[0]?.department ?? '',
      slug: courseCodeToSlug(courseCode),
      sections: sectionRows,
    }))
    .sort((a, b) => a.courseCode.localeCompare(b.courseCode));
}

export function processDepartment(dept: Department, universitySlug: string): Department {
  const displayName = getDepartmentDisplayName(dept.name, universitySlug);
  const slug = getDepartmentSlug(dept.name, universitySlug);
  const sections = dept.courses ?? [];
  const uniqueCourses = groupSectionsByCourseCode(sections);
  const uniqueCourseCount = uniqueCourses.length;

  return {
    name: dept.name,
    displayName,
    slug,
    count: sections.length,
    sectionCount: sections.length,
    uniqueCourseCount,
    uniqueCourses,
    isThinDepartment: uniqueCourseCount < 3,
    courses: sections,
  };
}

export function processUniversityData(university: UniversityData): UniversityData {
  const departments = university.departments
    .map((dept) => processDepartment(dept, university.slug))
    .filter((dept) => (dept.sectionCount ?? 0) > 0 || dept.courses.length > 0)
    .sort((a, b) => (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name));

  const courses = departments.flatMap((d) => d.courses);
  const totalUniqueCourses = departments.reduce((sum, d) => sum + (d.uniqueCourseCount ?? 0), 0);
  const totalSections = courses.length;

  return {
    ...university,
    departments,
    courses,
    totalCourses: totalSections,
    totalSections,
    totalUniqueCourses,
    totalDepartments: departments.length,
  };
}

export function findUniqueCourse(
  university: UniversityData,
  departmentSlug: string,
  courseSlug: string
): { department: Department; course: UniqueCourse } | null {
  const department = university.departments.find((d) => d.slug === departmentSlug);
  if (!department?.uniqueCourses) return null;

  const target = courseSlug.toLowerCase();
  const course = department.uniqueCourses.find((c) => c.slug === target);
  if (!course) return null;

  return { department, course };
}
