import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const universities = ['ohio-state', 'fordham'];

for (const slug of universities) {
  const source = path.join(ROOT, 'data', slug, 'all-courses.json');
  if (!fs.existsSync(source)) continue;

  const targetDir = path.join(ROOT, 'public', 'data', slug);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(source, path.join(targetDir, 'all-courses.json'));
  console.log(`Synced ${source} -> public/data/${slug}/all-courses.json`);
}
