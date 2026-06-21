import type { AllCoursesFile, AllCoursesRecord, CourseSeoContent } from './types';

export function buildSeoContentIndex(
  file: AllCoursesFile | null
): Map<string, AllCoursesRecord> {
  const map = new Map<string, AllCoursesRecord>();
  if (!file?.courses) return map;
  for (const course of file.courses) {
    map.set(course.courseCode.trim(), course);
  }
  return map;
}

export function getSeoContentForCourse(
  courseCode: string,
  index: Map<string, AllCoursesRecord>
): CourseSeoContent | undefined {
  return index.get(courseCode.trim())?.seoContent;
}

export function isCourseExcluded(
  courseCode: string,
  index: Map<string, AllCoursesRecord>
): boolean {
  return Boolean(index.get(courseCode.trim())?.excluded);
}
