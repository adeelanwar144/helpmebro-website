#!/usr/bin/env npx tsx
/**
 * Final report after full Ohio State batch.
 * Usage: npx tsx scripts/final-report-ohio-state.ts
 */
import fs from 'fs';
import path from 'path';
import { loadAllCoursesFile } from '../lib/seoContentLoader';
import type { CourseSeoContent } from '../lib/types';
import { normalizeHeadingPattern } from './lib/verification';

const UNI = 'ohio-state';

function allHeadings(seo: CourseSeoContent): string[] {
  return seo.sections.map((s) => s.heading);
}

function main(): void {
  const allCourses = loadAllCoursesFile(UNI);
  if (!allCourses) throw new Error('data/ohio-state/all-courses.json not found');

  const logPath = path.join(process.cwd(), 'output', `generation-log-${UNI}.json`);
  const log = fs.existsSync(logPath)
    ? (JSON.parse(fs.readFileSync(logPath, 'utf8')) as {
        entries: {
          courseCode: string;
          department: string;
          status: string;
          attempts: number;
          reason?: string;
          failures?: string[];
        }[];
        summary: Record<string, number>;
      })
    : null;

  const needsReviewPath = path.join(process.cwd(), 'output', `needs-review-${UNI}.json`);
  const failedPath = path.join(process.cwd(), 'output', `failed-verification-${UNI}.json`);
  const needsReview = fs.existsSync(needsReviewPath)
    ? (JSON.parse(fs.readFileSync(needsReviewPath, 'utf8')) as unknown[])
    : [];
  const failed = fs.existsSync(failedPath)
    ? (JSON.parse(fs.readFileSync(failedPath, 'utf8')) as unknown[])
    : [];

  const withContent = allCourses.courses.filter((c) => c.seoContent?.sections?.length);
  const patterns = new Map<string, string>();
  const duplicateHeadings: { heading: string; courses: string[] }[] = [];

  for (const course of withContent) {
    for (const section of course.seoContent!.sections) {
      const pattern = normalizeHeadingPattern(
        section.heading,
        course.courseCode,
        course.university,
        [course.department, course.departmentDisplayName ?? '', course.courseTitle]
      );
      if (!pattern) continue;
      const existing = patterns.get(pattern);
      if (existing && existing !== course.courseCode) {
        duplicateHeadings.push({
          heading: section.heading,
          courses: [existing, course.courseCode],
        });
      } else {
        patterns.set(pattern, course.courseCode);
      }
    }
  }

  const passedThisRun =
    log?.entries.filter((e) => e.status === 'passed').map((e) => e.courseCode) ?? [];

  const report = {
    generatedAt: new Date().toISOString(),
    totalWithSeoContent: withContent.length,
    passedThisRun: passedThisRun.length,
    passedThisRunCourses: passedThisRun,
    needsReview,
    failedVerification: failed,
    duplicateHeadingPatterns: duplicateHeadings,
    zeroDuplicateHeadings: duplicateHeadings.length === 0,
    logSummary: log?.summary ?? null,
    spotCheckNote:
      'Pick 3 courses from 3 different departments generated this run; visit at localhost:3000 with ?uni=ohio-state and confirm full page layout including Sections + Course Details.',
  };

  const outPath = path.join(process.cwd(), 'output', `final-report-${UNI}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report, null, 2));
}

main();
