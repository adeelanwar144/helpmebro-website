#!/usr/bin/env npx tsx
/**
 * Apply PHILOS markdown seoContent to existing all-courses.json (no GitHub fetch).
 * Use when import-philos merge previously dropped records.
 *
 * Usage: npx tsx scripts/repair-philos-on-disk.ts
 */
import { PHILOS_COURSE_CODES, countSeoBodyWords } from '../lib/parsePhilosMarkdown';
import { loadPhilosSeoContentMap } from '../lib/philosSeoOverlay';
import { loadAllCoursesFile, saveAllCoursesFile } from '../lib/seoContentLoader';

function main(): void {
  const seoByCode = loadPhilosSeoContentMap();
  if (seoByCode.size !== PHILOS_COURSE_CODES.length) {
    const missing = PHILOS_COURSE_CODES.filter((c) => !seoByCode.has(c));
    throw new Error(`Missing PHILOS markdown for: ${missing.join(', ')}`);
  }

  const file = loadAllCoursesFile('ohio-state');
  if (!file) throw new Error('data/ohio-state/all-courses.json not found');

  let ok = true;
  for (const code of PHILOS_COURSE_CODES) {
    const course = file.courses.find((c) => c.courseCode.trim() === code);
    if (!course) {
      console.error(`✗ ${code}: course record not found`);
      ok = false;
      continue;
    }
    const seo = seoByCode.get(code)!;
    course.seoContent = seo;
    console.log(
      `✓ ${code}: applied seoContent (${countSeoBodyWords(seo)} words, ${seo.sections.length} sections)`
    );
  }

  saveAllCoursesFile('ohio-state', file);
  console.log('\nSaved data/ohio-state/all-courses.json');

  if (!ok) process.exit(1);
}

main();
