/**
 * Parse PHILOS markdown, patch all-courses.json, print per-course status.
 * Run: node scripts/_patch-and-verify.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const PHILOS_CODES = [
  'PHILOS 1100',
  'PHILOS 1300',
  'PHILOS 1500',
  'PHILOS 2340',
  'PHILOS 2390',
  'PHILOS 2465',
];

const PHILOS_FILES = {
  'PHILOS 1100': 'PHILOS-1100-final-page-copy.md',
  'PHILOS 1300': 'PHILOS-1300-final-page-copy.md',
  'PHILOS 1500': 'PHILOS-1500-final-page-copy.md',
  'PHILOS 2340': 'PHILOS-2340-final-page-copy.md',
  'PHILOS 2390': 'PHILOS-2390-final-page-copy.md',
  'PHILOS 2465': 'PHILOS-2465-final-page-copy.md',
};

const BYLINE = 'Written and reviewed by Muhammad Ahsan (Sheikh)';

function mdDirs() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  return [
    path.join(root, 'content', 'philos-import'),
    path.join(home, 'Downloads', 'files (3)'),
  ];
}

function resolveMd(code) {
  for (const dir of mdDirs()) {
    const p = path.join(dir, PHILOS_FILES[code]);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function isHeading(line) {
  const t = line.trim();
  if (!t.endsWith('?') || t.length > 280) return false;
  return /^(Where|Why|What|How|Is|Does|Can|Should|If|Are)\b/.test(t);
}

function extractKeywords(body, code) {
  const lower = body.toLowerCase();
  const num = code.replace(/PHILOS\s/i, '').trim();
  const candidates = [
    'philosophy essay writing help',
    'philosophy assignment help online',
    `${code.toLowerCase()} ohio state assignment help`,
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
  return [...new Set(candidates.filter((p) => lower.includes(p.toLowerCase())))];
}

function parseMd(content, code) {
  const lines = content.split(/\r?\n/);
  const h1 = lines[0]?.trim() ?? code;
  const byIdx = lines.findIndex((l) => l.trim().startsWith(BYLINE));
  const byline = byIdx >= 0 ? lines[byIdx].trim() : '';
  const sections = [];
  let i = byIdx >= 0 ? byIdx + 1 : 1;

  while (i < lines.length) {
    while (i < lines.length && !lines[i].trim()) i++;
    if (i >= lines.length) break;
    const line = lines[i].trim();
    if (!isHeading(line)) {
      i++;
      continue;
    }
    const heading = line;
    i++;
    const parts = [];
    while (i < lines.length) {
      while (i < lines.length && !lines[i].trim()) {
        const next = lines[i + 1]?.trim() ?? '';
        if (next && isHeading(next)) break;
        i++;
      }
      if (i >= lines.length) break;
      const c = lines[i].trim();
      if (isHeading(c)) break;
      parts.push(c);
      i++;
    }
    if (parts.length) sections.push({ heading, body: parts.join('\n\n') });
  }

  const bodyText = sections.map((s) => s.body).join('\n\n');
  const metaDescription =
    sections[0]?.body.split(/[.!?]/)[0]?.trim().slice(0, 155) ??
    `${code} assignment help at The Ohio State University.`;

  return {
    metaTitle: h1,
    metaDescription: metaDescription.length > 155 ? `${metaDescription}…` : metaDescription,
    h1,
    byline,
    bioUrl: '/about-us',
    sections,
    keywords: extractKeywords(bodyText, code),
    lastReviewed: '2026-06-19',
    generationAttempts: 1,
  };
}

function verifyCourse(code, file) {
  const course = file.courses.find((c) => c.courseCode.trim() === code);
  if (!course) return { ok: false, msg: 'course record not found' };
  const seo = course.seoContent;
  if (!seo?.sections?.length) return { ok: false, msg: 'seoContent MISSING' };
  const words = seo.sections.map((s) => s.body).join(' ').split(/\s+/).filter(Boolean).length;
  return {
    ok: true,
    msg: `seoContent OK (${seo.sections.length} sections, ${words} words, metaTitle="${seo.metaTitle?.slice(0, 50)}…")`,
  };
}

const dataPath = path.join(root, 'data', 'ohio-state', 'all-courses.json');
const logPath = path.join(root, 'output', 'patch-verify-log.txt');
fs.mkdirSync(path.dirname(logPath), { recursive: true });

const log = [];
function emit(line) {
  log.push(line);
  console.log(line);
}

emit(`=== PHILOS patch run ${new Date().toISOString()} ===`);

const file = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

for (const code of PHILOS_CODES) {
  const mdPath = resolveMd(code);
  if (!mdPath) {
    emit(`✗ ${code}: markdown not found`);
    continue;
  }
  const seo = parseMd(fs.readFileSync(mdPath, 'utf8'), code);
  const course = file.courses.find((c) => c.courseCode.trim() === code);
  if (!course) {
    emit(`✗ ${code}: course record not found`);
    continue;
  }
  course.seoContent = seo;
  emit(`✓ ${code}: patched (${seo.sections.length} sections)`);
}

fs.writeFileSync(dataPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
emit(`\nSaved ${dataPath}\n`);

emit('--- PHILOS verification ---');
for (const code of PHILOS_CODES) {
  const v = verifyCourse(code, file);
  emit(v.ok ? `✓ ${code}: ${v.msg}` : `✗ ${code}: ${v.msg}`);
}

fs.writeFileSync(logPath, log.join('\n') + '\n', 'utf8');
emit(`\nLog: ${logPath}`);
