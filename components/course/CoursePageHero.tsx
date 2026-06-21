import Link from 'next/link';
import type { Course, CourseSeoContent as CourseSeoContentType } from '@/lib/types';
import { COURSE_IMAGE_SLOTS } from '@/lib/coursePageImages';
import Breadcrumb from '@/components/layout/Breadcrumb';
import WhatsAppLinkButton from '@/components/course/WhatsAppLinkButton';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  breadcrumbItems: BreadcrumbItem[];
  seoContent: CourseSeoContentType;
  primarySection: Course;
}

function buildQuickFactBadges(course: Course): { label: string; value: string }[] {
  return [
    { label: 'Session', value: course.session ?? '' },
    { label: 'Credits', value: course.credits ?? '' },
    { label: 'Instruction mode', value: course.instructionMode ?? '' },
  ].filter((item) => item.value.trim());
}

export default function CoursePageHero({ breadcrumbItems, seoContent, primarySection }: Props) {
  const bioUrl = seoContent.bioUrl ?? '/about-us';
  const quickFacts = buildQuickFactBadges(primarySection);
  const heroImage = COURSE_IMAGE_SLOTS.hero;

  return (
    <section
      aria-label="Course overview"
      className="relative overflow-hidden border-b border-brand-teal/20 bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark"
    >
      <div className="absolute inset-0 opacity-40 pointer-events-none hero-dot-grid" aria-hidden />
      <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-10">
        <Breadcrumb items={breadcrumbItems} tone="inverse" />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)] gap-8 lg:gap-10 items-start">
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
              {seoContent.h1}
            </h1>

            <div className="space-y-2 mb-6">
              <p className="text-sm text-white/80 leading-relaxed">
                <Link href={bioUrl} className="text-brand-gold hover:text-brand-yellow hover:underline font-medium">
                  {seoContent.byline}
                </Link>
              </p>
              {seoContent.lastReviewed && (
                <p className="text-xs text-white/55">Last reviewed: {seoContent.lastReviewed}</p>
              )}
            </div>

            {quickFacts.length > 0 && (
              <ul className="flex flex-wrap items-center gap-2 mb-6">
                {quickFacts.map(({ label, value }) => (
                  <li
                    key={label}
                    className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/25"
                  >
                    <span className="text-brand-gold mr-1.5 normal-case tracking-normal">{label}:</span>
                    {value}
                  </li>
                ))}
              </ul>
            )}

            <WhatsAppLinkButton className="text-base px-8 py-3 shadow-lg hover:shadow-xl" />
          </div>

          <div className="hidden lg:block min-w-0">
            <div className="overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl shadow-brand-navy/40">
              <img
                src={heroImage.src}
                alt={heroImage.alt}
                className="w-full h-full min-h-[240px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
