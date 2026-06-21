import type { CourseSeoContent } from './types';

const BYLINE_PREFIX = 'Written and reviewed by Muhammad Ahsan (Sheikh)';

export const PHILOS_COURSE_CODES = [
  'PHILOS 1100',
  'PHILOS 1300',
  'PHILOS 1500',
  'PHILOS 2340',
  'PHILOS 2390',
  'PHILOS 2465',
] as const;

export const PHILOS_FILE_NAMES: Record<string, string> = {
  'PHILOS 1100': 'PHILOS-1100-final-page-copy.md',
  'PHILOS 1300': 'PHILOS-1300-final-page-copy.md',
  'PHILOS 1500': 'PHILOS-1500-final-page-copy.md',
  'PHILOS 2340': 'PHILOS-2340-final-page-copy.md',
  'PHILOS 2390': 'PHILOS-2390-final-page-copy.md',
  'PHILOS 2465': 'PHILOS-2465-final-page-copy.md',
};

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.endsWith('?')) return false;
  if (trimmed.length > 280) return false;
  return /^(Where|Why|What|How|Is|Does|Can|Should|If|Are)\b/.test(trimmed);
}

function extractKeywords(body: string, courseCode: string): string[] {
  const lower = body.toLowerCase();
  const num = courseCode.replace(/PHILOS\s/i, '').trim();
  const candidates = [
    'philosophy essay writing help',
    'philosophy assignment help online',
    `${courseCode.toLowerCase()} ohio state assignment help`,
    `philos ${num} ohio state assignment help`,
    `what does philos ${num} cover at ohio state`,
    'pay someone to write my philosophy essay',
    'professional essay writing service for philosophy class',
    'philosophy homework help',
    'custom philosophy essay writing service',
    'online philosophy tutor for college students',
    'philosophy paper editing service',
    'international student philosophy essay grading help',
    `philos ${num} ohio state international student help`,
    'how to make a philosophy argument logically valid not just well written',
    'well written philosophy essay and a logically valid one',
    'help write your philosophy essay',
    'help write your logic essay',
  ];
  return [...new Set(candidates.filter((phrase) => lower.includes(phrase.toLowerCase())))];
}

export function parsePhilosMarkdown(content: string, courseCode: string): CourseSeoContent {
  const lines = content.split(/\r?\n/);
  const h1 = lines[0]?.trim() ?? courseCode;

  const bylineIdx = lines.findIndex((l) => l.trim().startsWith(BYLINE_PREFIX));
  const byline = bylineIdx >= 0 ? lines[bylineIdx].trim() : '';

  const sections: { heading: string; body: string }[] = [];
  let idx = bylineIdx >= 0 ? bylineIdx + 1 : 1;

  while (idx < lines.length) {
    while (idx < lines.length && !lines[idx].trim()) idx++;
    if (idx >= lines.length) break;

    const line = lines[idx].trim();
    if (!isHeadingLine(line)) {
      idx++;
      continue;
    }

    const heading = line;
    idx++;
    const bodyParts: string[] = [];

    while (idx < lines.length) {
      while (idx < lines.length && !lines[idx].trim()) {
        const next = lines[idx + 1]?.trim() ?? '';
        if (next && isHeadingLine(next)) break;
        idx++;
      }
      if (idx >= lines.length) break;
      const candidate = lines[idx].trim();
      if (isHeadingLine(candidate)) break;
      bodyParts.push(candidate);
      idx++;
    }

    if (bodyParts.length) {
      sections.push({ heading, body: bodyParts.join('\n\n') });
    }
  }

  const bodyText = sections.map((s) => s.body).join('\n\n');
  const keywords = extractKeywords(bodyText, courseCode);
  const metaDescription =
    sections[0]?.body.split(/[.!?]/)[0]?.trim().slice(0, 155) ??
    `${courseCode} assignment help at The Ohio State University.`;

  return {
    metaTitle: h1,
    metaDescription: metaDescription.length > 155 ? `${metaDescription}…` : metaDescription,
    h1,
    byline,
    bioUrl: '/about-us',
    sections,
    keywords,
    lastReviewed: '2026-06-19',
    generationAttempts: 1,
  };
}

export function countSeoBodyWords(content: CourseSeoContent): number {
  return content.sections
    .map((s) => s.body)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}
