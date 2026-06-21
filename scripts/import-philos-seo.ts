#!/usr/bin/env npx tsx
/**
 * Import completed PHILOS page copy into data/ohio-state/all-courses.json.
 * Reads markdown from content/philos-import/ or Downloads/files (3)/.
 *
 * Usage: npm run import-philos
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchUniversityFromIndex, mergeExistingCourseData } from './lib/dataLoader';
import { allCoursesPath, loadAllCoursesFile, saveAllCoursesFile } from '../lib/seoContentLoader';
import type { AllCoursesFile } from '../lib/types';
import { PHILOS_COURSE_CODES, countSeoBodyWords } from '../lib/parsePhilosMarkdown';
import { loadPhilosSeoContentMap } from '../lib/philosSeoOverlay';
import { summarizePhilosImport } from '../lib/philosImportSummary';

async function importPhilosSeo(): Promise<void> {
  summarizePhilosImport();

  const seoByCode = loadPhilosSeoContentMap();
  if (seoByCode.size !== PHILOS_COURSE_CODES.length) {
    const missing = PHILOS_COURSE_CODES.filter((c) => !seoByCode.has(c));
    throw new Error(
      `Missing PHILOS markdown for: ${missing.join(', ')}. Copy files to content/philos-import/`
    );
  }

  const fetched = await fetchUniversityFromIndex('ohio-state');
  if (!fetched) throw new Error('Could not fetch Ohio State course index');

  const freshFile: AllCoursesFile = {
    university: fetched.university,
    universitySlug: 'ohio-state',
    term: fetched.term,
    location: fetched.location,
    generatedAt: new Date().toISOString(),
    courses: fetched.courses.map((course) => {
      const seo = seoByCode.get(course.courseCode.trim());
      return seo ? { ...course, seoContent: seo } : course;
    }),
  };

  const existing = loadAllCoursesFile('ohio-state');
  let file = mergeExistingCourseData(freshFile, existing);

  // PHILOS markdown import always wins for these six codes (never rely on merge alone).
  for (const course of file.courses) {
    const seo = seoByCode.get(course.courseCode.trim());
    if (seo) {
      course.seoContent = seo;
    }
  }

  if (!file.screeningApprovedAt && existing?.screeningApprovedAt) {
    file.screeningApprovedAt = existing.screeningApprovedAt;
  }

  saveAllCoursesFile('ohio-state', file);

  console.log(`\nWrote ${allCoursesPath('ohio-state')}`);
  console.log(`  Total courses: ${file.courses.length}`);
  console.log(`  With seoContent: ${file.courses.filter((c) => c.seoContent).length}`);
  console.log(`  Excluded: ${file.courses.filter((c) => c.excluded).length}`);
  console.log('\nPer-course PHILOS import status:');
  for (const code of PHILOS_COURSE_CODES) {
    const seo = seoByCode.get(code)!;
    const onDisk = file.courses.find((c) => c.courseCode.trim() === code);
    const hasContent = Boolean(onDisk?.seoContent?.sections?.length);
    const words = countSeoBodyWords(seo);
    if (hasContent) {
      console.log(`  ✓ ${code}: imported (${words} words, ${onDisk!.seoContent!.sections.length} sections on disk)`);
    } else {
      console.error(`  ✗ ${code}: FAILED — parsed ${words} words but not written to all-courses.json`);
    }
  }
}

export { importPhilosSeo };

async function main(): Promise<void> {
  await importPhilosSeo();
}

const isDirectRun =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
