import type { CourseSeoSection } from './types';

export function slugifyHeading(heading: string, index: number): string {
  const base = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base ? `section-${base}` : `section-${index}`;
}

export function buildTocItems(sections: CourseSeoSection[]): { id: string; heading: string }[] {
  return sections.map((section, index) => ({
    id: slugifyHeading(section.heading, index),
    heading: section.heading,
  }));
}

/** Detect trust-building / honesty / caveat paragraphs for callout styling — wording unchanged. */
export function isCalloutParagraph(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;

  const patterns = [
    'we want to be transparent',
    'without the published rubric',
    'limit here',
    'important to note',
    'important caveat',
    'we cannot guarantee',
    'we do not have access',
    'we do not have the',
    'honest limit',
    'to be clear about what we',
    'we want to be upfront',
    'we cannot verify',
    'without seeing your actual',
  ];

  return patterns.some((p) => t.includes(p));
}

export function splitParagraphs(body: string): string[] {
  return body.split(/\n\n+/).filter((p) => p.trim().length > 0);
}

export function isFaqSectionHeading(heading: string): boolean {
  return /faq|frequently asked questions/i.test(heading);
}

/** Split "Question? Answer" on one line, or accept a standalone question paragraph. */
export function splitQuestionAnswer(paragraph: string): { question: string; answer: string } | null {
  const trimmed = paragraph.trim();
  const match = trimmed.match(/^(.+\?)\s+([\s\S]+)$/);
  if (!match) return null;
  return { question: match[1].trim(), answer: match[2].trim() };
}

/** Parse FAQ body: supports "Q? A" per paragraph or alternating Q / A paragraphs. */
export function parseFaqItems(body: string): { question: string; answer: string }[] {
  const paragraphs = splitParagraphs(body);
  const items: { question: string; answer: string }[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const combined = splitQuestionAnswer(paragraphs[i]);
    if (combined) {
      items.push(combined);
      continue;
    }

    const question = paragraphs[i].trim();
    if (question.endsWith('?') && i + 1 < paragraphs.length) {
      items.push({ question, answer: paragraphs[i + 1].trim() });
      i += 1;
    }
  }

  return items;
}
