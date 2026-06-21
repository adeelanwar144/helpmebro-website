import fs from 'fs';
import path from 'path';
import type { CourseSeoContent } from './types';
import {
  PHILOS_COURSE_CODES,
  PHILOS_FILE_NAMES,
  parsePhilosMarkdown,
} from './parsePhilosMarkdown';

function candidateDirs(): string[] {
  const home = process.env.USERPROFILE ?? process.env.HOME ?? '';
  return [
    path.join(process.cwd(), 'content', 'philos-import'),
    path.join(home, 'Downloads', 'files (3)'),
  ];
}

export function resolvePhilosMarkdownPath(courseCode: string): string | null {
  const fileName = PHILOS_FILE_NAMES[courseCode];
  if (!fileName) return null;

  for (const dir of candidateDirs()) {
    const filePath = path.join(dir, fileName);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

export function loadPhilosSeoContentMap(): Map<string, CourseSeoContent> {
  const map = new Map<string, CourseSeoContent>();

  for (const courseCode of PHILOS_COURSE_CODES) {
    const filePath = resolvePhilosMarkdownPath(courseCode);
    if (!filePath) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    map.set(courseCode, parsePhilosMarkdown(content, courseCode));
  }

  return map;
}

export function loadPhilosHeadingList(): string[] {
  const headings: string[] = [];
  for (const seo of loadPhilosSeoContentMap().values()) {
    for (const section of seo.sections) {
      headings.push(section.heading);
    }
  }
  return headings;
}
