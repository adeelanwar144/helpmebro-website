#!/usr/bin/env npx tsx
/**
 * Re-run Ohio State screening and report audit of prior incorrect exclusions.
 *
 * Usage: npx tsx scripts/rerun-screening-audit.ts
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { prepareUniversityCourses, runScreening } from './generate-course-content';
import { screenCourse } from './lib/screening';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const UNI = 'ohio-state';
const OLD_FALSE_POSITIVE_PATTERN =
  'No indication of written assignments, essays, exams, or graded academic work product in description';

async function main(): Promise<void> {
  const oldReportPath = path.join(process.cwd(), 'output', `screening-report-${UNI}.json`);
  let oldFalsePositives: string[] = [];
  if (fs.existsSync(oldReportPath)) {
    const oldReport = JSON.parse(fs.readFileSync(oldReportPath, 'utf8')) as {
      exclusions: { courseCode: string; pattern: string }[];
    };
    oldFalsePositives = oldReport.exclusions
      .filter((e) => e.pattern === OLD_FALSE_POSITIVE_PATTERN)
      .map((e) => e.courseCode);
  }

  const allCourses = await prepareUniversityCourses(UNI);
  await runScreening(UNI, allCourses);

  const newReport = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'output', `screening-report-${UNI}.json`), 'utf8')
  ) as {
    excludedCount: number;
    approvedCount: number;
    exclusions: { courseCode: string; pattern: string; department: string }[];
    approvedCourses: { courseCode: string; department: string }[];
  };

  const clas1101 = newReport.approvedCourses.find((c) => c.courseCode === 'CLAS 1101');
  const clas2220 = newReport.approvedCourses.find((c) => c.courseCode === 'CLAS 2220');

  const newlyApproved = oldFalsePositives.filter((code) =>
    newReport.approvedCourses.some((c) => c.courseCode === code)
  );

  const stillExcludedFormerFalsePositives = oldFalsePositives.filter((code) =>
    newReport.exclusions.some((e) => e.courseCode === code)
  );

  const audit = {
    generatedAt: new Date().toISOString(),
    priorFalsePositiveExclusionCount: oldFalsePositives.length,
    newlyApprovedFromThatGroup: newlyApproved.length,
    newlyApprovedCourses: newlyApproved.sort(),
    stillExcludedFromThatGroup: stillExcludedFormerFalsePositives,
    clas1101Approved: Boolean(clas1101),
    clas2220Approved: Boolean(clas2220),
    newExcludedCount: newReport.excludedCount,
    newApprovedCount: newReport.approvedCount,
    sampleChecks: {
      PHILOS_1100: screenCourse(
        allCourses.courses.find((c) => c.courseCode === 'PHILOS 1100')!
      ).excluded,
      PHILOS_2390: screenCourse(
        allCourses.courses.find((c) => c.courseCode === 'PHILOS 2390')!
      ).excluded,
      BUSADM_5797: screenCourse(
        allCourses.courses.find((c) => c.courseCode === 'BUSADM 5797')!
      ).excluded,
      CLAS_1101: screenCourse(
        allCourses.courses.find((c) => c.courseCode === 'CLAS 1101')!
      ).excluded,
      CLAS_2220: screenCourse(
        allCourses.courses.find((c) => c.courseCode === 'CLAS 2220')!
      ).excluded,
    },
  };

  const outPath = path.join(process.cwd(), 'output', `screening-audit-${UNI}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(audit, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
