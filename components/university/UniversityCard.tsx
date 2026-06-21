import Link from 'next/link';
import type { UniversityData } from '@/lib/types';
import { universityHref } from '@/lib/subdomain';

interface Props {
  uni: UniversityData;
}

export default function UniversityCard({ uni }: Props) {
  const activeDepts = uni.departments.filter((d) => (d.uniqueCourseCount ?? 0) > 0 || d.count > 0);
  const href = universityHref(uni.slug);
  const courseCount = uni.totalUniqueCourses ?? 0;

  return (
    <Link href={href} className="card-interactive p-5 group block">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-display font-bold text-lg text-brand-navy group-hover:text-brand-teal-dark transition-colors duration-200 ease-out">
          {uni.university}
        </h3>
        <span className="shrink-0 text-xs font-semibold bg-brand-teal/10 text-brand-teal px-2.5 py-1 rounded-full">
          {courseCount} {courseCount === 1 ? 'course' : 'courses'} available
        </span>
      </div>
      <p className="text-sm text-brand-navy/55">{uni.location}</p>
      <p className="text-sm text-brand-navy/55 mt-1">
        {activeDepts.length} department{activeDepts.length !== 1 ? 's' : ''} · {uni.term}
      </p>
      <p className="text-sm text-brand-teal mt-3 font-medium group-hover:underline">
        Browse courses →
      </p>
    </Link>
  );
}
