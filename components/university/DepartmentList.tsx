import Link from 'next/link';
import type { Department } from '@/lib/types';
import { hrefOnUniversity, departmentPagePath } from '@/lib/routing';

interface Props {
  departments: Department[];
  uniSlug: string;
}

export default function DepartmentList({ departments, uniSlug }: Props) {
  const active = departments
    .filter((d) => (d.uniqueCourseCount ?? 0) > 0 || d.courses.length > 0 || d.count > 0)
    .sort((a, b) => (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-8">
      {active.map((dept) => {
        const deptSlug = dept.slug!;
        const label = dept.displayName ?? dept.name;
        const courseCount = dept.uniqueCourseCount ?? dept.courses.length;
        const sectionCount = dept.sectionCount ?? 0;

        return (
          <Link
            key={dept.name}
            href={hrefOnUniversity(departmentPagePath(deptSlug), uniSlug)}
            className="card-interactive group block p-6 border-l-4 border-l-brand-teal hover:scale-[1.02] transition-all duration-200 ease-out"
          >
            <h3 className="font-display font-bold text-lg text-brand-navy group-hover:text-brand-teal-dark transition-colors duration-200 ease-out">
              {label}
            </h3>

            <div className="mt-3 inline-flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-brand-cream px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-teal-dark">
                {courseCount} course{courseCount !== 1 ? 's' : ''}
              </span>
              {sectionCount > courseCount && (
                <span className="inline-flex items-center rounded-full bg-brand-navy/5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-navy/70">
                  {sectionCount} sections
                </span>
              )}
            </div>

            <p className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-teal group-hover:text-brand-teal-dark transition-colors duration-200 ease-out">
              View courses
              <span
                className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1"
                aria-hidden
              >
                →
              </span>
            </p>
          </Link>
        );
      })}
    </div>
  );
}
