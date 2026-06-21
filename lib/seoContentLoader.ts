import fs from 'fs';
import path from 'path';
import type { AllCoursesFile, AllCoursesRecord, CourseSeoContent } from './types';

export function allCoursesPath(universitySlug: string): string {
  return path.join(process.cwd(), 'data', universitySlug, 'all-courses.json');
}

export function loadAllCoursesFile(universitySlug: string): AllCoursesFile | null {
  const filePath = allCoursesPath(universitySlug);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as AllCoursesFile;
  } catch {
    return null;
  }
}

export function saveAllCoursesFile(universitySlug: string, data: AllCoursesFile): void {
  const filePath = allCoursesPath(universitySlug);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

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
