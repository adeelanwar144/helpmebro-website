import type { CourseSeoContent } from '../../lib/types';

export interface VerificationFailure {
  check: string;
  detail: string;
}

export interface VerificationResult {
  passed: boolean;
  failures: VerificationFailure[];
  wordCount: number;
}

const DASH_RE = /[-–—]/;

export const MIN_BODY_WORD_COUNT = 1500;

export function getPageBodyText(content: CourseSeoContent): string {
  return content.sections.map((s) => s.body).join('\n\n');
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function containsDashes(text: string): boolean {
  return DASH_RE.test(text);
}

/** Replace dash characters in section bodies so mechanical verification can pass. */
export function sanitizeDashesInSeoContent(content: CourseSeoContent): CourseSeoContent {
  const clean = (text: string) => text.replace(/[-–—]/g, ' ').replace(/  +/g, ' ');
  return {
    ...content,
    sections: content.sections.map((section) => ({
      ...section,
      body: clean(section.body),
    })),
  };
}

export function keywordPresent(keyword: string, body: string): boolean {
  return body.toLowerCase().includes(keyword.toLowerCase().trim());
}

export function normalizeHeadingPattern(
  heading: string,
  courseCode: string,
  university: string,
  subjectTerms: string[] = []
): string {
  let normalized = heading.toLowerCase();
  normalized = normalized.replace(new RegExp(courseCode.replace(/\./g, '\\.'), 'gi'), '');
  normalized = normalized.replace(new RegExp(university.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');

  for (const term of subjectTerms) {
    if (term.length > 2) {
      normalized = normalized.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
    }
  }

  return normalized
    .replace(/\b[a-z]{0,2}\d{3,4}[a-z]?\b/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isDuplicateHeadingPattern(
  heading: string,
  runningPatterns: Set<string>,
  courseCode: string,
  university: string,
  subjectTerms: string[] = []
): boolean {
  const pattern = normalizeHeadingPattern(heading, courseCode, university, subjectTerms);
  if (!pattern) return false;
  return runningPatterns.has(pattern);
}

export function verifySeoContent(
  content: CourseSeoContent,
  runningHeadingPatterns: Set<string>,
  courseCode: string,
  university: string,
  subjectTerms: string[] = []
): VerificationResult {
  const failures: VerificationFailure[] = [];
  const body = getPageBodyText(content);
  const wordCount = countWords(body);

  if (wordCount < MIN_BODY_WORD_COUNT) {
    failures.push({
      check: 'word_count',
      detail: `word count was ${wordCount}, needs to be ${MIN_BODY_WORD_COUNT} or more`,
    });
  }

  if (containsDashes(body)) {
    const match = body.match(DASH_RE);
    failures.push({
      check: 'no_dashes',
      detail: `body contains dash or hyphen character "${match?.[0] ?? '-'}"; rewrite without dashes or hyphens of any kind`,
    });
  }

  for (const keyword of content.keywords) {
    if (!keyword.trim()) continue;
    if (!keywordPresent(keyword, body)) {
      failures.push({
        check: 'keyword_presence',
        detail: `the phrase "${keyword}" does not appear anywhere in the text`,
      });
    }
  }

  for (const section of content.sections) {
    if (
      isDuplicateHeadingPattern(
        section.heading,
        runningHeadingPatterns,
        courseCode,
        university,
        subjectTerms
      )
    ) {
      failures.push({
        check: 'heading_uniqueness',
        detail: `this heading duplicates an existing heading elsewhere in the batch: "${section.heading}", rewrite it using this course's actual subject matter`,
      });
    }
  }

  if (!content.h1?.trim()) {
    failures.push({ check: 'h1_present', detail: 'h1 is missing' });
  }

  if (!content.byline?.trim()) {
    failures.push({ check: 'byline_present', detail: 'byline is missing' });
  }

  if (!content.sections.length) {
    failures.push({ check: 'sections_present', detail: 'sections array is empty' });
  }

  return {
    passed: failures.length === 0,
    failures,
    wordCount,
  };
}

export function formatFailuresForRetry(failures: VerificationFailure[]): string {
  return failures.map((f) => f.detail).join('\n');
}

export function registerHeadingPatterns(
  content: CourseSeoContent,
  runningPatterns: Set<string>,
  courseCode: string,
  university: string,
  subjectTerms: string[] = []
): void {
  for (const section of content.sections) {
    const pattern = normalizeHeadingPattern(
      section.heading,
      courseCode,
      university,
      subjectTerms
    );
    if (pattern) runningPatterns.add(pattern);
  }
}
