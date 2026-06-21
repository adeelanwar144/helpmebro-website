import type { ReactNode } from 'react';
import type { CourseSeoContent as CourseSeoContentType } from '@/lib/types';
import { COURSE_IMAGE_SLOTS } from '@/lib/coursePageImages';
import {
  buildTocItems,
  isCalloutParagraph,
  slugifyHeading,
  splitParagraphs,
} from '@/lib/courseContentUtils';
import ContentCallout from '@/components/course/ContentCallout';
import CourseContentCTA from '@/components/course/CourseContentCTA';
import CourseHowItWorksMini from '@/components/course/CourseHowItWorksMini';
import ArticleSectionImage from '@/components/course/ArticleSectionImage';

interface Props {
  seoContent: CourseSeoContentType;
  courseCode: string;
  /** Rendered after the first H2 section, before the second H2 begins. */
  scheduleDetailsSlot?: ReactNode;
}

/** Insert How It Works after this section index (between H2 blocks). */
function howItWorksAfterSectionIndex(sectionCount: number): number | null {
  if (sectionCount < 2) return null;
  if (sectionCount <= 3) return 1;
  return 2;
}

function renderParagraphs(body: string) {
  return splitParagraphs(body).map((paragraph, pIndex) => {
    if (isCalloutParagraph(paragraph)) {
      return (
        <ContentCallout key={pIndex}>
          <p>{paragraph}</p>
        </ContentCallout>
      );
    }
    return (
      <p key={pIndex} className="leading-relaxed">
        {paragraph}
      </p>
    );
  });
}

/** Mid-article image slot: after this section index (between H2 blocks). */
function midArticleImageIndex(sectionCount: number): number | null {
  if (sectionCount > 2) return 1;
  return null;
}

export default function CourseSeoContent({ seoContent, courseCode, scheduleDetailsSlot }: Props) {
  const sections = seoContent.sections;
  const tocItems = buildTocItems(sections);
  const midPointIndex = Math.max(0, Math.floor(sections.length / 2) - 1);
  const midImageAfterIndex = midArticleImageIndex(sections.length);
  const howItWorksAfterIndex = howItWorksAfterSectionIndex(sections.length);
  const midImage = COURSE_IMAGE_SLOTS.midArticle;
  const endImage = COURSE_IMAGE_SLOTS.beforeFinalCta;

  function renderSectionBlock(section: (typeof sections)[number], index: number) {
    const sectionId = tocItems[index]?.id ?? slugifyHeading(section.heading, index);
    const insertMidCta = index === midPointIndex && sections.length > 2;
    const insertMidImage = midImageAfterIndex !== null && index === midImageAfterIndex;
    const insertHowItWorks = howItWorksAfterIndex !== null && index === howItWorksAfterIndex;

    return (
      <div key={`${section.heading}-${index}`}>
        <section
          id={sectionId}
          className={`scroll-mt-28 ${index > 0 ? 'border-t border-brand-teal/20 pt-10 mt-10' : ''}`}
          aria-labelledby={`${sectionId}-heading`}
        >
          <h2
            id={`${sectionId}-heading`}
            className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-5 leading-snug"
          >
            {section.heading}
          </h2>
          <div className="text-brand-navy/80 text-base leading-relaxed space-y-5">
            {renderParagraphs(section.body)}
          </div>
        </section>

        {insertMidImage && <ArticleSectionImage src={midImage.src} alt={midImage.alt} />}

        {insertHowItWorks && (
          <div className="border-t border-brand-teal/20 pt-10 mt-10">
            <CourseHowItWorksMini variant="embedded" />
          </div>
        )}

        {insertMidCta && <CourseContentCTA courseCode={courseCode} />}
      </div>
    );
  }

  const firstSection = sections[0];
  const remainingSections = sections.slice(1);

  return (
    <article className="animate-fade-in">
      <div className="max-w-2xl">
        {seoContent.metaDescription && (
          <aside
            className="mb-10 rounded-xl border-l-4 border-brand-gold bg-gradient-to-r from-brand-teal-dark/15 via-brand-teal/10 to-brand-teal/5 px-5 py-4 shadow-md"
            role="note"
            aria-label="Quick Answer"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-brand-teal-dark mb-2">Quick Answer</p>
            <p className="text-brand-navy leading-relaxed font-medium">{seoContent.metaDescription}</p>
          </aside>
        )}

        {firstSection && renderSectionBlock(firstSection, 0)}
      </div>

      {scheduleDetailsSlot}

      <div className="max-w-2xl">
        {remainingSections.map((section, i) => renderSectionBlock(section, i + 1))}

        <ArticleSectionImage src={endImage.src} alt={endImage.alt} />

        <CourseContentCTA
          courseCode={courseCode}
          heading={`Ready to get help with ${courseCode}?`}
          subline="Send us your assignment details on WhatsApp and we will respond with a free quote."
        />
      </div>
    </article>
  );
}
