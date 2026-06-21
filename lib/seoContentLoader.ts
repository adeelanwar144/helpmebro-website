import fs from 'fs';
import path from 'path';
import type { AllCoursesFile } from './types';
import {
  buildSeoContentIndex,
  getSeoContentForCourse,
  isCourseExcluded,
} from './seoContentIndex';

export { buildSeoContentIndex, getSeoContentForCourse, isCourseExcluded };

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
