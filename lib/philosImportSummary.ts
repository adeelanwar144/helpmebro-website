import {
  PHILOS_COURSE_CODES,
  parsePhilosMarkdown,
  countSeoBodyWords,
} from './parsePhilosMarkdown';
import { loadPhilosSeoContentMap, resolvePhilosMarkdownPath } from './philosSeoOverlay';

/**
 * Re-export for import script and tests.
 */
export { parsePhilosMarkdown, countSeoBodyWords, PHILOS_COURSE_CODES };

export function summarizePhilosImport(): void {
  const map = loadPhilosSeoContentMap();
  console.log(`PHILOS markdown sources found: ${map.size}/${PHILOS_COURSE_CODES.length}`);
  for (const code of PHILOS_COURSE_CODES) {
    const path = resolvePhilosMarkdownPath(code);
    const seo = map.get(code);
    if (!seo) {
      console.log(`  ${code}: MISSING (${path ?? 'no file'})`);
      continue;
    }
    console.log(
      `  ${code}: ${seo.sections.length} sections, ${countSeoBodyWords(seo)} words, ${seo.keywords.length} keywords`
    );
    seo.sections.forEach((s, i) => console.log(`    H2 ${i + 1}: ${s.heading}`));
  }
}
