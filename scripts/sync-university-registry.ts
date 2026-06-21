/**
 * Reads meta.json from each folder under data/ and writes lib/generated/universityRegistry.json
 * for Edge-safe imports (middleware) and as the build-time registry snapshot.
 *
 * Run: npx tsx scripts/sync-university-registry.ts
 */
import fs from 'fs';
import path from 'path';
import type { UniversityMeta } from '../lib/universityMeta';

const DATA_DIR = path.join(process.cwd(), 'data');
const OUT_PATH = path.join(process.cwd(), 'lib', 'generated', 'universityRegistry.json');

function loadMetaFromDisk(): UniversityMeta[] {
  if (!fs.existsSync(DATA_DIR)) return [];

  const entries: UniversityMeta[] = [];

  for (const dir of fs.readdirSync(DATA_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const metaPath = path.join(DATA_DIR, dir.name, 'meta.json');
    if (!fs.existsSync(metaPath)) continue;

    const text = fs.readFileSync(metaPath, 'utf8').replace(/^\uFEFF/, '');
    const raw = JSON.parse(text) as UniversityMeta;
    if (raw.shortKey !== dir.name) {
      console.warn(
        `Warning: data/${dir.name}/meta.json shortKey "${raw.shortKey}" does not match folder name.`
      );
    }
    entries.push(raw);
  }

  return entries.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

function main() {
  const registry = loadMetaFromDisk();
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${registry.length} universities to ${OUT_PATH}`);
}

main();
