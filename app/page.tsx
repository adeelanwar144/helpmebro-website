import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSiteData, fetchUniversityData } from '@/lib/fetchCourses';
import { buildSearchableCourses } from '@/lib/courseUtils';
import { slugToName } from '@/lib/subdomain';
import { getUniversityAssignmentHelpName } from '@/lib/universities';
import { generateUniversityMetadata } from '@/lib/seo';
import { isComingSoonSlug } from '@/lib/universities';
import { DEFAULT_OG_DESCRIPTION, DEFAULT_OG_TITLE, SITE_NAME, SITE_URL } from '@/lib/site';
import { organizationJsonLd, faqJsonLd } from '@/lib/structuredData';
import UniversityThemeProvider from '@/components/theme/UniversityThemeProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DepartmentList from '@/components/university/DepartmentList';
import UniversityHero from '@/components/university/UniversityHero';
import ComingSoonUniversityHome from '@/components/university/ComingSoonUniversityHome';
import HomeHero from '@/components/home/HomeHero';
import TrustBadges from '@/components/home/TrustBadges';
import HowItWorks from '@/components/home/HowItWorks';
import UniversityGrid from '@/components/university/UniversityGrid';
import Testimonials from '@/components/home/Testimonials';
import FAQ from '@/components/home/FAQ';
import JsonLd from '@/components/seo/JsonLd';

export const revalidate = 3600;

interface Props {
  searchParams: { uni?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const slug = searchParams.uni;
  if (slug) {
    if (isComingSoonSlug(slug)) {
      const name = slugToName(slug);
      return {
        title: `${name} — Coming Soon`,
        description: `Verified Summer 2026 course catalog for ${name} — coming soon.`,
      };
    }

    const data = await fetchUniversityData(slug);
    if (data) {
      return generateUniversityMetadata(
        data.university,
        data.totalUniqueCourses ?? 0,
        data.totalDepartments ?? data.departments.length,
        slug
      );
    }
  }

  return {
    title: DEFAULT_OG_TITLE,
    description: DEFAULT_OG_DESCRIPTION,
    openGraph: {
      title: DEFAULT_OG_TITLE,
      description: DEFAULT_OG_DESCRIPTION,
      type: 'website',
      url: SITE_URL,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_OG_TITLE,
      description: DEFAULT_OG_DESCRIPTION,
    },
  };
}

export default async function HomePage({ searchParams }: Props) {
  const slug = searchParams.uni;

  if (slug) {
    if (isComingSoonSlug(slug)) {
      return <ComingSoonUniversityHome slug={slug} />;
    }

    const data = await fetchUniversityData(slug);
    if (!data) notFound();

    const uniName = data.university || slugToName(slug);
    const assignmentHelpName = getUniversityAssignmentHelpName(slug, uniName);
    const uniqueCourses = data.totalUniqueCourses ?? 0;
    const deptCount = data.totalDepartments ?? data.departments.length;
    const totalSections = data.totalSections ?? data.courses.length;
    const searchableCourses = buildSearchableCourses([data]);

    return (
      <>
        <UniversityThemeProvider shortKey={slug}>
          <Header uniName={uniName} uniSlug={slug} />
          <main className="flex-1">
            <UniversityHero
              uniName={assignmentHelpName}
              term={data.term}
              uniqueCourses={uniqueCourses}
              deptCount={deptCount}
              totalSections={totalSections}
              searchableCourses={searchableCourses}
            />

            <section className="max-w-6xl mx-auto px-4 py-12">
              <h2 className="section-heading">Departments</h2>
              <p className="section-subheading">Select a department to browse courses</p>
              <DepartmentList departments={data.departments} uniSlug={slug} />
            </section>
          </main>
          <Footer />
        </UniversityThemeProvider>
      </>
    );
  }

  const { universities, stats, searchableCourses } = await getSiteData();

  return (
    <>
      <JsonLd data={[organizationJsonLd(), faqJsonLd()]} />
      <Header />
      <main className="flex-1">
        <HomeHero
          totalUniqueCourses={stats.totalUniqueCourses}
          totalDepartments={stats.totalDepartments}
          totalUniversities={stats.totalUniversities}
          searchableCourses={searchableCourses}
        />

        <TrustBadges />
        <HowItWorks />
        <UniversityGrid universities={universities} />

        <Testimonials />

        <section className="stats-section" aria-labelledby="stats-heading">
          <div className="absolute inset-0 opacity-40 pointer-events-none hero-dot-grid" aria-hidden />
          <div
            className="absolute inset-0 bg-gradient-to-t from-brand-teal-dark/30 to-transparent pointer-events-none"
            aria-hidden
          />
          <h2 id="stats-heading" className="sr-only">
            AssignHelp at a glance
          </h2>
          <div className="relative max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-y-10 sm:gap-y-0 sm:divide-x sm:divide-white/15 text-center">
            {[
              { value: String(stats.totalUniqueCourses), label: 'Unique courses' },
              { value: String(stats.totalDepartments), label: 'Departments' },
              { value: String(stats.totalUniversities), label: 'Universities' },
              { value: String(stats.totalSections), label: 'Sections' },
            ].map(({ value, label }) => (
              <div key={label} className="px-4">
                <div className="stats-value">{value}</div>
                <div className="stats-label">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <FAQ />
      </main>
      <Footer />
    </>
  );
}
