import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const universities = ['ohio-state', 'fordham'];

for (const slug of universities) {
  const source = path.join(ROOT, 'data', slug, 'all-courses.json');
  if (!fs.existsSync(source)) continue;

  const allCourses = JSON.parse(fs.readFileSync(source, 'utf8'));
  const byDept = new Map();

  for (const course of allCourses.courses ?? []) {
    if (!course.seoContent && !course.excluded) continue;
    const deptSlug = course.departmentSlug || course.department.toLowerCase();
    if (!byDept.has(deptSlug)) byDept.set(deptSlug, []);
    byDept.get(deptSlug).push({
      courseCode: course.courseCode,
      excluded: course.excluded,
      seoContent: course.seoContent,
    });
  }

  for (const [deptSlug, courses] of byDept) {
    const chunk = {
      universitySlug: slug,
      departmentSlug: deptSlug,
      courses,
    };
    const json = `${JSON.stringify(chunk, null, 2)}\n`;

    for (const base of ['data', path.join('public', 'data')]) {
      const dir = path.join(ROOT, base, slug, 'seo');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${deptSlug}.json`), json, 'utf8');
    }
  }

  console.log(`Synced ${byDept.size} SEO chunks for ${slug}`);
}
