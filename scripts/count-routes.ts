import { getSiteData } from '../lib/fetchCourses';

async function main() {
  const { universities, stats } = await getSiteData();

  let totalCoursePages = 0;
  const thinDepartments: string[] = [];

  for (const uni of universities) {
    for (const dept of uni.departments) {
      totalCoursePages += dept.uniqueCourseCount ?? 0;
      if (dept.isThinDepartment) {
        thinDepartments.push(`${uni.slug}/${dept.slug} (${dept.name})`);
      }
    }
  }

  console.log('Site stats:', JSON.stringify(stats, null, 2));
  console.log('Total unique course pages:', totalCoursePages);
  console.log('Thin departments:', thinDepartments.length);
  thinDepartments.forEach((d) => console.log('  -', d));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
