import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchUniversityData, findDepartmentBySlug } from '@/lib/fetchCourses';
import { slugToName } from '@/lib/subdomain';
import { generateDepartmentMetadata } from '@/lib/seo';
import { hrefOnUniversity, coursePagePath } from '@/lib/routing';
import UniversityThemeProvider from '@/components/theme/UniversityThemeProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';

export const runtime = 'edge';

interface Props {
  params: { department: string };
  searchParams: { uni?: string };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = searchParams.uni || '';
  const data = slug ? await fetchUniversityData(slug) : null;
  const dept = data ? findDepartmentBySlug(data.departments, params.department, slug) : null;
  const deptName = dept?.displayName ?? dept?.name ?? params.department.replace(/-/g, ' ');
  const uniName = data?.university || slugToName(slug);
  const deptSlug = dept?.slug ?? params.department;

  return generateDepartmentMetadata(deptName, uniName, slug, deptSlug);
}

export const revalidate = 3600;

export default async function DepartmentPage({ params, searchParams }: Props) {
  const slug = searchParams.uni || '';
  if (!slug) notFound();

  const data = await fetchUniversityData(slug);
  if (!data) notFound();

  const dept = findDepartmentBySlug(data.departments, params.department, slug);
  if (!dept?.uniqueCourses?.length) notFound();

  const uniName = data.university || slugToName(slug);
  const deptSlug = dept.slug ?? params.department;
  const deptLabel = dept.displayName ?? dept.name;

  return (
    <UniversityThemeProvider shortKey={slug}>
      <Header uniName={uniName} uniSlug={slug} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10">
        <Breadcrumb
          items={[
            { label: uniName, href: hrefOnUniversity('/', slug) },
            { label: deptLabel },
          ]}
        />

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy mt-6 mb-4">
          {deptLabel}
        </h1>

        <div className="flex flex-wrap items-center gap-2 mb-10">
          <span className="inline-flex items-center rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-teal-dark">
            {dept.uniqueCourseCount} course{dept.uniqueCourseCount !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-navy/70">
            {dept.sectionCount} section{dept.sectionCount !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--university-accent)_10%,transparent)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--university-accent)]">
            {data.term}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {dept.uniqueCourses.map((course) => (
            <Link
              key={course.slug}
              href={hrefOnUniversity(coursePagePath(deptSlug, course.slug), slug)}
              className="card-interactive group flex items-center justify-between p-6 border-l-4 border-l-brand-teal hover:scale-[1.01] hover:bg-brand-cream/20 transition-all duration-200 ease-out"
            >
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-white bg-brand-teal-dark px-2.5 py-1 rounded-md">
                    {course.courseCode}
                  </span>
                  {course.sections.length > 1 && (
                    <span className="inline-flex items-center rounded-full bg-brand-teal/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-teal-dark">
                      {course.sections.length} sections
                    </span>
                  )}
                </div>
                <p className="font-display font-bold text-lg text-brand-navy group-hover:text-brand-teal-dark transition-colors duration-200 ease-out">
                  {course.courseTitle}
                </p>
              </div>
              <span
                className="text-brand-teal shrink-0 text-xl font-bold transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-brand-teal-dark"
                aria-hidden
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </UniversityThemeProvider>
  );
}
