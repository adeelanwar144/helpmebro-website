/** One-off audit: list Ohio State departments and author byline mapping status */
import { fetchUniversityFromIndex } from './lib/dataLoader';
import { screenAllCourses } from './lib/screening';
import { resolveSubjectArea } from '../lib/authorConfig';

async function main() {
  const fetched = await fetchUniversityFromIndex('ohio-state');
  if (!fetched) {
    console.error('Could not fetch ohio-state courses');
    process.exit(1);
  }

  const { approved, exclusions } = screenAllCourses(fetched.courses);

  const deptMap = new Map<string, { approved: number; excluded: number; courses: string[] }>();
  for (const c of fetched.courses) {
    const entry = deptMap.get(c.department) ?? { approved: 0, excluded: 0, courses: [] };
    entry.courses.push(c.courseCode);
    deptMap.set(c.department, entry);
  }
  for (const c of approved) {
    const entry = deptMap.get(c.department)!;
    entry.approved += 1;
  }
  for (const e of exclusions) {
    const entry = deptMap.get(e.department)!;
    entry.excluded += 1;
  }

  const smallDepts = approved
    .reduce((acc, c) => {
      if (!acc.has(c.department)) acc.set(c.department, new Set<string>());
      acc.get(c.department)!.add(c.courseCode);
      return acc;
    }, new Map<string, Set<string>>());

  console.log('=== OHIO STATE SCREENING SUMMARY ===');
  console.log(`Total unique courses: ${fetched.courses.length}`);
  console.log(`Approved: ${approved.length}`);
  console.log(`Excluded: ${exclusions.length}`);
  console.log(`Departments: ${deptMap.size}`);

  console.log('\n=== SMALL APPROVED DEPARTMENTS (1-2 courses) ===');
  const small: { dept: string; count: number; mapped: boolean; courses: string[] }[] = [];
  for (const [dept, codes] of smallDepts) {
    if (dept === 'PHILOS') continue;
    const count = codes.size;
    if (count <= 2) {
      const mapped = Boolean(resolveSubjectArea(dept, 'ohio-state'));
      small.push({ dept, count, mapped, courses: [...codes].sort() });
    }
  }
  small.sort((a, b) => a.count - b.count || a.dept.localeCompare(b.dept));
  for (const s of small) {
    console.log(`${s.dept}: ${s.count} course(s), byline mapped: ${s.mapped} — ${s.courses.join(', ')}`);
  }

  console.log('\n=== DEPARTMENTS WITHOUT BYLINE MAPPING (excluding PHILOS) ===');
  const unmapped: string[] = [];
  for (const dept of [...deptMap.keys()].sort()) {
    if (dept === 'PHILOS') continue;
    if (!resolveSubjectArea(dept, 'ohio-state')) unmapped.push(dept);
  }
  console.log(unmapped.join(', ') || '(none)');
  console.log(`Total unmapped: ${unmapped.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
