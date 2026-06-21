#!/usr/bin/env npx tsx
/**
 * Print per-course seoContent presence in data/ohio-state/all-courses.json
 *
 * Usage: npx tsx scripts/verify-seo-on-disk.ts [course codes...]
 */
import { loadAllCoursesFile } from '../lib/seoContentLoader';

const DEFAULT_CODES = [
  'PHILOS 1100',
  'PHILOS 1300',
  'PHILOS 1500',
  'PHILOS 2340',
  'PHILOS 2390',
  'PHILOS 2465',
  'CLAS 1101',
  'CLAS 2220',
];

function main(): void {
  const codes = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_CODES;
  const file = loadAllCoursesFile('ohio-state');
  if (!file) {
    console.error('✗ data/ohio-state/all-courses.json not found');
    process.exit(1);
  }

  let allOk = true;
  for (const code of codes) {
    const course = file.courses.find((c) => c.courseCode.trim() === code.trim());
    if (!course) {
      console.error(`✗ ${code}: course record not found`);
      allOk = false;
      continue;
    }
    const seo = course.seoContent;
    if (!seo?.sections?.length) {
      console.error(`✗ ${code}: seoContent MISSING`);
      allOk = false;
      continue;
    }
    const fields = [
      seo.metaTitle && 'metaTitle',
      seo.h1 && 'h1',
      seo.byline && 'byline',
      seo.sections.length && `${seo.sections.length} sections`,
      seo.keywords?.length && `${seo.keywords.length} keywords`,
      seo.lastReviewed && 'lastReviewed',
      seo.generationAttempts != null && `generationAttempts=${seo.generationAttempts}`,
    ].filter(Boolean);
    console.log(`✓ ${code}: seoContent OK (${fields.join(', ')})`);
  }

  if (!allOk) process.exit(1);
}

main();
