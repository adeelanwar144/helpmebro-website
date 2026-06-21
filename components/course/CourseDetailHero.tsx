import type { Course, CourseSeoContent as CourseSeoContentType } from '@/lib/types';
import Breadcrumb from '@/components/layout/Breadcrumb';
import CourseFactBox from '@/components/course/CourseFactBox';
import { whatsAppLink } from '@/lib/whatsapp';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  breadcrumbItems: BreadcrumbItem[];
  seoContent: CourseSeoContentType;
  courseCode: string;
  primarySection: Course;
  courseSections: Course[];
}

const whatsappButtonStyle = {
  backgroundColor: '#25D366',
  color: '#ffffff',
  fontWeight: 'bold',
  padding: '12px 24px',
  borderRadius: '0.5rem',
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
} as const;

export default function CourseDetailHero({
  breadcrumbItems,
  seoContent,
  courseCode,
  primarySection,
  courseSections,
}: Props) {
  return (
    <section aria-label="Course overview" className="mb-8 lg:mb-10">
      <Breadcrumb items={breadcrumbItems} />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-8 items-start">
        <div className="min-w-0">
          <header className="max-w-2xl">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy mb-5 leading-tight">
              {seoContent.h1}
            </h1>

            <div className="space-y-2">
              <p className="text-sm text-brand-teal leading-relaxed">{seoContent.byline}</p>
              {seoContent.lastReviewed && (
                <p className="text-xs text-brand-navy/45">Last reviewed: {seoContent.lastReviewed}</p>
              )}
            </div>
          </header>

          <div className="mt-6 max-w-xl">
            <p className="text-sm text-brand-navy/75 leading-relaxed mb-4">
              Original work with Turnitin reports included — get a fast, free quote for {courseCode}.
            </p>
            <a
              href={whatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              style={whatsappButtonStyle}
            >
              Talk on WhatsApp
            </a>
          </div>
        </div>

        <div className="min-w-0 w-full max-w-full">
          <CourseFactBox primary={primarySection} sections={courseSections} variant="hero" />
        </div>
      </div>
    </section>
  );
}
