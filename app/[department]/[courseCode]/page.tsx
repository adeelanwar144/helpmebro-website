import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { CourseSeoContent as CourseSeoContentData } from '@/lib/types';
import { fetchUniversityData, findUniqueCourse } from '@/lib/fetchCourses';
import { fetchCourseSeoContent } from '@/lib/publishedSeoContent';
import { slugToName } from '@/lib/subdomain';
import { generateCourseMetadata } from '@/lib/seo';
import { hrefOnUniversity, departmentPagePath } from '@/lib/routing';
import { buildTocItems } from '@/lib/courseContentUtils';
import UniversityThemeProvider from '@/components/theme/UniversityThemeProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';
import TrustBadges from '@/components/home/TrustBadges';
import CoursePageHero from '@/components/course/CoursePageHero';
import CourseHero from '@/components/course/CourseHero';
import CourseDetails from '@/components/course/CourseDetails';
import CourseSections from '@/components/course/CourseSections';
import CourseSeoContent from '@/components/course/CourseSeoContent';
import CourseFactBox from '@/components/course/CourseFactBox';
import CourseTableOfContents from '@/components/course/CourseTableOfContents';
import FloatingWhatsAppFab from '@/components/course/FloatingWhatsAppFab';
import OrderForm from '@/components/course/OrderForm';

export const runtime = 'edge';

interface Props {
  params: { department: string; courseCode: string };
  searchParams: { uni?: string };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = searchParams.uni || '';
  const data = slug ? await fetchUniversityData(slug) : null;
  if (!data) return {};

  const match = findUniqueCourse(data, params.department, params.courseCode);
  if (!match) return {};

  const deptSlug = match.department.slug ?? params.department;
  const seoContent = await resolveCourseSeoContent(
    slug,
    deptSlug,
    match.course.courseCode,
    match.course.seoContent
  );

  const primary = match.course.sections[0];
  return generateCourseMetadata(
    primary,
    data.university || slugToName(slug),
    slug,
    params.department,
    params.courseCode,
    seoContent
  );
}

export const revalidate = 0;

async function resolveCourseSeoContent(
  universitySlug: string,
  departmentSlug: string,
  courseCode: string,
  existing?: CourseSeoContentData
): Promise<CourseSeoContentData | undefined> {
  if (existing) return existing;
  return fetchCourseSeoContent(universitySlug, departmentSlug, courseCode);
}

export default async function CoursePage({ params, searchParams }: Props) {
  const slug = searchParams.uni || '';
  if (!slug) notFound();

  const data = await fetchUniversityData(slug);
  if (!data) notFound();

  const match = findUniqueCourse(data, params.department, params.courseCode);
  if (!match) notFound();

  const { department, course } = match;
  const primary = course.sections[0];
  const uniName = data.university || slugToName(slug);
  const deptLabel = department.displayName ?? department.name;
  const deptSlug = department.slug ?? params.department;
  const seoContent = await resolveCourseSeoContent(
    slug,
    deptSlug,
    course.courseCode,
    course.seoContent
  );
  const tocItems = seoContent ? buildTocItems(seoContent.sections) : [];

  const breadcrumbItems = [
    { label: uniName, href: hrefOnUniversity('/', slug) },
    { label: deptLabel, href: hrefOnUniversity(departmentPagePath(deptSlug), slug) },
    { label: course.courseCode },
  ];

  return (
    <UniversityThemeProvider shortKey={slug}>
      <Header uniName={uniName} uniSlug={slug} />
      <main className="flex-1 pb-20 lg:pb-16">
        {seoContent ? (
          <>
            <CoursePageHero
              breadcrumbItems={breadcrumbItems}
              seoContent={seoContent}
              primarySection={primary}
            />

            <TrustBadges variant="vivid" />

            <div className="max-w-6xl mx-auto px-4 pb-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                <div className="lg:col-span-2 min-w-0">
                  {tocItems.length > 0 && (
                    <CourseTableOfContents items={tocItems} variant="mobile" />
                  )}
                  <CourseSeoContent
                    seoContent={seoContent}
                    courseCode={course.courseCode}
                    scheduleDetailsSlot={
                      <section
                        className="mt-12 scroll-mt-24"
                        aria-labelledby="course-schedule-registration-heading"
                      >
                        <h2 id="course-schedule-registration-heading" className="section-heading">
                          Course Schedule &amp; Registration Details
                        </h2>
                        <p className="section-subheading">
                          Schedule and registration info from the university catalog
                        </p>
                        <CourseFactBox
                          primary={primary}
                          sections={course.sections}
                          hideSectionHeading
                          variant="vivid"
                        />
                      </section>
                    }
                  />

                </div>

                <aside className="lg:col-span-1">
                  <div className="sticky top-20 space-y-8">
                    <OrderForm
                      courseCode={course.courseCode}
                      courseTitle={course.courseTitle}
                      university={uniName}
                    />
                    {tocItems.length > 0 && (
                      <CourseTableOfContents items={tocItems} variant="desktop" />
                    )}
                  </div>
                </aside>
              </div>
            </div>

            <FloatingWhatsAppFab />
          </>
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-10 pb-16">
            <Breadcrumb items={breadcrumbItems} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 mt-4">
              <div className="lg:col-span-2 min-w-0">
                <div className="space-y-8">
                  <CourseHero course={primary} uniName={uniName} term={data.term} />
                  <CourseDetails course={primary} />
                  <CourseSections sections={course.sections} />
                </div>
              </div>
              <aside className="lg:col-span-1">
                <div className="sticky top-20 space-y-8">
                  <OrderForm
                    courseCode={course.courseCode}
                    courseTitle={course.courseTitle}
                    university={uniName}
                  />
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </UniversityThemeProvider>
  );
}
