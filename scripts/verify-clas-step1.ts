#!/usr/bin/env npx tsx
/**
 * Verify Step 1 CLAS generation results (checks 1–6 and 8).
 * Check 7 (browser) must be done manually at localhost:3000.
 *
 * Usage: npx tsx scripts/verify-clas-step1.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuthorBylineForDepartment } from '../lib/authorConfig';
import { loadPhilosHeadingList } from '../lib/philosSeoOverlay';
import { loadAllCoursesFile } from '../lib/seoContentLoader';
import type { AllCoursesRecord, CourseSeoContent } from '../lib/types';
import {
  containsDashes,
  countWords,
  getPageBodyText,
  keywordPresent,
  MIN_BODY_WORD_COUNT,
} from './lib/verification';

const UNI = 'ohio-state';
const CLAS_CODES = ['CLAS 1101', 'CLAS 2220'];

export interface Step1CourseVerification {
  courseCode: string;
  check1_attempts: number | undefined;
  check2_wordCount: number;
  check2_pass: boolean;
  check3_dashesFound: boolean;
  check3_pass: boolean;
  check4_missingKeywords: string[];
  check4_pass: boolean;
  check5_sections: { heading: string; firstSentence: string; pass: boolean }[];
  check5_pass: boolean;
  check6_duplicatePhilosHeadings: string[];
  check6_pass: boolean;
  check8_byline: string;
  check8_pass: boolean;
}

export interface Step1VerificationReport {
  generatedAt: string;
  clasConfirmed: string[];
  philosHeadingCount: number;
  results: Step1CourseVerification[];
  allMechanicalChecksPassed: boolean;
  proceedToStep2: boolean;
  check7_browserNote: string;
}

function collectHeadings(seo: CourseSeoContent): string[] {
  return seo.sections.map((s) => s.heading);
}

function firstSentence(body: string): string {
  const trimmed = body.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  return (match?.[0] ?? trimmed.split(/\n/)[0] ?? '').trim();
}

function headingQuestionWords(heading: string): string[] {
  return heading
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        !['what', 'where', 'when', 'does', 'will', 'that', 'this', 'with', 'from', 'your', 'have'].includes(w)
    );
}

function firstSentenceAnswersHeading(heading: string, body: string): boolean {
  const sentence = firstSentence(body).toLowerCase();
  if (!sentence) return false;
  const keywords = headingQuestionWords(heading);
  if (!keywords.length) return sentence.length >= 15;
  const hits = keywords.filter((w) => sentence.includes(w));
  return hits.length >= Math.min(2, keywords.length);
}

function exactPhilosDuplicate(heading: string, philosHeadings: string[]): boolean {
  const h = heading.trim().toLowerCase();
  return philosHeadings.some((p) => p.trim().toLowerCase() === h);
}

function verifyCourse(
  course: AllCoursesRecord,
  philosHeadings: string[],
  attempts: number | undefined
): Step1CourseVerification {
  const seo = course.seoContent!;
  const body = getPageBodyText(seo);
  const wordCount = countWords(body);

  return {
    courseCode: course.courseCode,
    check1_attempts: attempts,
    check2_wordCount: wordCount,
    check2_pass: wordCount >= MIN_BODY_WORD_COUNT,
    check3_dashesFound: containsDashes(body),
    check3_pass: !containsDashes(body),
    check4_missingKeywords: (seo.keywords ?? []).filter((k) => !keywordPresent(k, body)),
    check4_pass: (seo.keywords ?? []).every((k) => !k.trim() || keywordPresent(k, body)),
    check5_sections: seo.sections.map((s) => ({
      heading: s.heading,
      firstSentence: firstSentence(s.body),
      pass: firstSentenceAnswersHeading(s.heading, s.body),
    })),
    check5_pass: seo.sections.every((s) => firstSentenceAnswersHeading(s.heading, s.body)),
    check6_duplicatePhilosHeadings: collectHeadings(seo).filter((h) =>
      exactPhilosDuplicate(h, philosHeadings)
    ),
    check6_pass: collectHeadings(seo).every((h) => !exactPhilosDuplicate(h, philosHeadings)),
    check8_byline: getAuthorBylineForDepartment(course.department, UNI).bylineText,
    check8_pass: (() => {
      const byline = getAuthorBylineForDepartment(course.department, UNI).bylineText;
      return (
        byline.includes('across academic subjects') &&
        !byline.includes('philosophy and humanities coursework')
      );
    })(),
  };
}

export function verifyClasStep1(): Step1VerificationReport {
  const logPath = path.join(process.cwd(), 'output', `generation-log-${UNI}.json`);
  if (fs.existsSync(logPath)) {
    const log = JSON.parse(fs.readFileSync(logPath, 'utf8')) as {
      entries: { courseCode: string; status: string; attempts: number; reason?: string }[];
    };
    for (const code of CLAS_CODES) {
      const entry = log.entries.find((e) => e.courseCode.trim() === code);
      if (!entry) {
        throw new Error(
          `${code} missing from generation log. Generation did not run for this course.`
        );
      }
      if (entry.status !== 'passed') {
        throw new Error(
          `${code} generation status is "${entry.status}" (not "passed")` +
            `${entry.reason ? `: ${entry.reason}` : ''}. ` +
            `Fix generation before running verification.`
        );
      }
      console.log(`  ✓ generation log: ${code} passed in ${entry.attempts} attempt(s)`);
    }
  } else {
    console.warn(`Warning: ${logPath} not found; skipping generation log pre-check.`);
  }

  const allCourses = loadAllCoursesFile(UNI);
  if (!allCourses) {
    throw new Error('data/ohio-state/all-courses.json not found. Run CLAS generation first.');
  }

  const log = fs.existsSync(logPath)
    ? (JSON.parse(fs.readFileSync(logPath, 'utf8')) as {
        entries: { courseCode: string; attempts: number; status: string }[];
      })
    : { entries: [] };

  const philosFromFile = allCourses.courses
    .filter((c) => c.courseCode.startsWith('PHILOS') && c.seoContent)
    .flatMap((c) => collectHeadings(c.seoContent!));
  const philosHeadings = [...new Set([...loadPhilosHeadingList(), ...philosFromFile])];

  const results = CLAS_CODES.map((code) => {
    const course = allCourses.courses.find((c) => c.courseCode.trim() === code);
    if (!course?.seoContent) throw new Error(`Missing seoContent for ${code}`);
    const logEntry = log.entries.find((e) => e.courseCode.trim() === code && e.status === 'passed');
    return verifyCourse(course, philosHeadings, logEntry?.attempts);
  });

  const allPass = results.every(
    (r) =>
      r.check2_pass &&
      r.check3_pass &&
      r.check4_pass &&
      r.check5_pass &&
      r.check6_pass &&
      r.check8_pass &&
      r.check1_attempts != null
  );

  const report: Step1VerificationReport = {
    generatedAt: new Date().toISOString(),
    clasConfirmed: CLAS_CODES,
    philosHeadingCount: philosHeadings.length,
    results,
    allMechanicalChecksPassed: allPass,
    proceedToStep2: allPass,
    check7_browserNote:
      'Manually visit http://localhost:3000/clas/clas-1101?uni=ohio-state and clas-2220; confirm hero/byline, first 2 SEO sections, Sections + Course Details, remaining sections, source link.',
  };

  const outPath = path.join(process.cwd(), 'output', 'step1-clas-verification.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify(report, null, 2));
  return report;
}

function main(): void {
  const report = verifyClasStep1();
  if (!report.allMechanicalChecksPassed) process.exit(1);
}

const isDirectRun =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main();
}
