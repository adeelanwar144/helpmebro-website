/**
 * Pure JS PHILOS markdown parser + disk repair (no tsx required).
 * Usage: node scripts/apply-philos-repair.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const PHILOS_COURSE_CODES = [
  'PHILOS 1100',
  'PHILOS 1300',
  'PHILOS 1500',
  'PHILOS 2340',
  'PHILOS 2390',
  'PHILOS 2465',
];

const PHILOS_FILE_NAMES = {
  'PHILOS 1100': 'PHILOS-1100-final-page-copy.md',
  'PHILOS 1300': 'PHILOS-1300-final-page-copy.md',
  'PHILOS 1500': 'PHILOS-1500-final-page-copy.md',
  'PHILOS 2340': 'PHILOS-2340-final-page-copy.md',
  'PHILOS 2390': 'PHILOS-2390-final-page-copy.md',
  'PHILOS 2465': 'PHILOS-2465-final-page-copy.md',
};

const BYLINE_PREFIX = 'Written and reviewed by Muhammad Ahsan (Sheikh)';

function candidateDirs() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  return [
    path.join(root, 'content', 'philos-import'),
    path.join(home, 'Downloads', 'files (3)'),
  ];
}

function resolvePhilosMarkdownPath(courseCode) {
  const fileName = PHILOS_FILE_NAMES[courseCode];
  for (const dir of candidateDirs()) {
    const filePath = path.join(dir, fileName);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

function isHeadingLine(line) {
  const trimmed = line.trim();
  if (!trimmed.endsWith('?')) return false;
  if (trimmed.length > 280) return false;
  return /^(Where|Why|What|How|Is|Does|Can|Should|If|Are)\b/.test(trimmed);
}

function extractKeywords(body, courseCode) {
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

function parsePhilosMarkdown(content, courseCode) {
  const lines = content.split(/\r?\n/);
  const h1 = lines[0]?.trim() ?? courseCode;
  const bylineIdx = lines.findIndex((l) => l.trim().startsWith(BYLINE_PREFIX));
  const byline = bylineIdx >= 0 ? lines[bylineIdx].trim() : '';
  const sections = [];
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
    const bodyParts = [];
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

function countWords(seo) {
  return seo.sections
    .map((s) => s.body)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

const dataPath = path.join(root, 'data', 'ohio-state', 'all-courses.json');
const file = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let ok = true;
for (const code of PHILOS_COURSE_CODES) {
  const mdPath = resolvePhilosMarkdownPath(code);
  if (!mdPath) {
    console.error(`✗ ${code}: markdown file not found`);
    ok = false;
    continue;
  }
  const course = file.courses.find((c) => c.courseCode.trim() === code);
  if (!course) {
    console.error(`✗ ${code}: course record not found in all-courses.json`);
    ok = false;
    continue;
  }
  const seo = parsePhilosMarkdown(fs.readFileSync(mdPath, 'utf8'), code);
  course.seoContent = seo;
  console.log(
    `✓ ${code}: applied seoContent (${countWords(seo)} words, ${seo.sections.length} sections, metaTitle set)`
  );
}

fs.writeFileSync(dataPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
console.log(`\nSaved ${dataPath}`);

if (!ok) process.exit(1);

// Verify all 8 target courses
const verifyCodes = [...PHILOS_COURSE_CODES, 'CLAS 1101', 'CLAS 2220'];
console.log('\n--- On-disk verification ---');
for (const code of verifyCodes) {
  const course = file.courses.find((c) => c.courseCode.trim() === code);
  if (!course?.seoContent?.sections?.length) {
    console.error(`✗ ${code}: seoContent MISSING`);
    ok = false;
  } else {
    const s = course.seoContent;
    console.log(
      `✓ ${code}: seoContent OK (${s.sections.length} sections, generationAttempts=${s.generationAttempts})`
    );
  }
}

process.exit(ok ? 0 : 1);
