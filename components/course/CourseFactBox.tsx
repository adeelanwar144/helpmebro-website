import type { Course } from '@/lib/types';
import { parseAttributeChips } from '@/lib/parseAttributes';

interface FieldRow {
  icon: string;
  label: string;
  value: string;
}

function buildPrimaryFields(course: Course): FieldRow[] {
  const schedule = [course.meetingDays, course.meetingTime].filter(Boolean).join(' · ');

  return [
    { icon: '📋', label: 'Section', value: course.section ?? '' },
    { icon: '🔢', label: 'CRN', value: course.crn ?? '' },
    { icon: '🗓', label: 'Session', value: course.session ?? '' },
    { icon: '👤', label: 'Instructor', value: course.instructor ?? '' },
    { icon: '⏰', label: 'Schedule', value: schedule },
    { icon: '📅', label: 'Meeting days', value: course.meetingDays ?? '' },
    { icon: '📍', label: 'Location', value: course.location ?? '' },
    { icon: '💻', label: 'Instruction mode', value: course.instructionMode ?? '' },
    { icon: '🎓', label: 'Credits', value: course.credits ?? '' },
  ].filter((r) => r.value.trim());
}

function buildSectionFields(section: Course): FieldRow[] {
  const schedule = [section.meetingDays, section.meetingTime].filter(Boolean).join(' · ');

  return [
    { icon: '📋', label: 'Section', value: section.section ?? '—' },
    { icon: '🔢', label: 'CRN', value: section.crn ?? '—' },
    { icon: '🗓', label: 'Session', value: section.session ?? '—' },
    { icon: '👤', label: 'Instructor', value: section.instructor ?? '—' },
    { icon: '⏰', label: 'Schedule', value: schedule || '—' },
  ];
}

function FieldGrid({
  fields,
  singleColumn,
  compact,
}: {
  fields: FieldRow[];
  singleColumn?: boolean;
  compact?: boolean;
}) {
  return (
    <dl
      className={`grid gap-x-6 gap-y-4 ${singleColumn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} ${
        compact ? 'p-4' : 'p-6 sm:p-8'
      }`}
    >
      {fields.map(({ icon, label, value }) => (
        <div key={label} className="flex gap-3 min-w-0">
          <span className="text-lg shrink-0 mt-0.5" aria-hidden>
            {icon}
          </span>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-brand-teal uppercase tracking-wide">{label}</dt>
            <dd className="text-sm text-brand-navy/85 mt-0.5 leading-relaxed break-words">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

function AttributesBlock({ chips }: { chips: string[] }) {
  return (
    <div className="w-full min-w-0 rounded-xl border border-brand-cream bg-white shadow-md px-6 py-5">
      <p className="text-xs font-semibold text-brand-teal uppercase tracking-wide mb-3 flex items-center gap-2">
        <span aria-hidden>🏷</span> Attributes
      </p>
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li
            key={chip}
            className="inline-flex max-w-full rounded-full border border-brand-cream bg-brand-cream/40 px-3 py-1 text-xs text-brand-navy/80 leading-snug"
          >
            {chip}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllSectionsBlock({ sections }: { sections: Course[] }) {
  return (
    <div className="w-full min-w-0 rounded-xl border border-brand-cream bg-white shadow-md px-4 sm:px-6 py-4">
      <p className="text-xs font-semibold text-brand-teal uppercase tracking-wide mb-3 px-2">
        All sections ({sections.length})
      </p>
      <ul className="space-y-3">
        {sections.map((section, i) => (
          <li
            key={`${section.crn ?? section.section ?? i}`}
            className="rounded-lg border border-brand-cream bg-brand-cream/20"
          >
            <FieldGrid fields={buildSectionFields(section)} singleColumn compact />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Props {
  primary: Course;
  sections: Course[];
  /** Hero placement uses tighter outer spacing; vivid uses high-contrast course-page styling. */
  variant?: 'inline' | 'hero' | 'vivid';
  /** Hide the default section heading when wrapped by a parent section title. */
  hideSectionHeading?: boolean;
}

export default function CourseFactBox({
  primary,
  sections,
  variant = 'inline',
  hideSectionHeading = false,
}: Props) {
  const isVivid = variant === 'vivid';
  const fields = buildPrimaryFields(primary);
  const attributeChips = parseAttributeChips(primary.attributes);
  const showSections = sections.length > 0;

  if (!fields.length && !attributeChips.length && !showSections && !primary.sourceUrl) return null;

  if (variant === 'hero') {
    if (!fields.length && !attributeChips.length && !showSections) return null;

    return (
      <div
        className="w-full min-w-0 max-w-full flex flex-col gap-4 scroll-mt-24"
        aria-labelledby="course-fact-box-heading"
      >
        <div className="min-w-0">
          <h2 id="course-fact-box-heading" className="section-heading">
            Course Details &amp; Sections
          </h2>
          <p className="section-subheading">Schedule and registration info from the university catalog</p>
        </div>

        {fields.length > 0 && (
          <div className="w-full min-w-0 rounded-xl border border-brand-cream bg-white shadow-md">
            <FieldGrid fields={fields} singleColumn />
          </div>
        )}

        {attributeChips.length > 0 && <AttributesBlock chips={attributeChips} />}

        {showSections && <AllSectionsBlock sections={sections} />}
      </div>
    );
  }

  const cardShell = isVivid
    ? 'rounded-xl border-2 border-brand-teal/35 bg-white shadow-lg shadow-brand-teal/10'
    : 'rounded-xl border border-brand-cream bg-white shadow-md';
  const chipClass = isVivid
    ? 'inline-flex max-w-full rounded-full border border-brand-teal/35 bg-brand-teal/15 px-3 py-1 text-xs font-medium text-brand-navy leading-snug'
    : 'inline-flex max-w-full rounded-full border border-brand-cream bg-brand-cream/40 px-3 py-1 text-xs text-brand-navy/80 leading-snug';
  const sectionsWrapClass = isVivid
    ? 'border-t border-brand-teal/25 bg-gradient-to-b from-brand-teal/10 to-brand-teal/5 px-4 sm:px-6 py-4'
    : 'border-t border-brand-cream bg-brand-cream/20 px-4 sm:px-6 py-4';
  const sectionItemClass = isVivid
    ? 'rounded-lg border border-brand-teal/25 bg-white shadow-sm'
    : 'rounded-lg border border-brand-cream bg-white';
  const tableWrapClass = isVivid
    ? 'hidden lg:block overflow-x-auto rounded-lg border border-brand-teal/25 bg-white shadow-sm'
    : 'hidden lg:block overflow-x-auto rounded-lg border border-brand-cream bg-white';
  const theadClass = isVivid ? 'bg-brand-navy text-left text-white' : 'bg-brand-cream/60 text-left';

  return (
    <section className="my-12 scroll-mt-24" aria-labelledby="course-fact-box-heading">
      {!hideSectionHeading && (
        <>
          <h2 id="course-fact-box-heading" className="section-heading">
            Course Details &amp; Sections
          </h2>
          <p className="section-subheading">Schedule and registration info from the university catalog</p>
        </>
      )}

      <div className={cardShell}>
        {fields.length > 0 && <FieldGrid fields={fields} />}

        {attributeChips.length > 0 && (
          <div
            className={`px-6 sm:px-8 pb-6 ${fields.length ? `border-t ${isVivid ? 'border-brand-teal/25' : 'border-brand-cream'} pt-6` : 'pt-6 sm:pt-8'}`}
          >
            <p className="text-xs font-semibold text-brand-teal uppercase tracking-wide mb-3 flex items-center gap-2">
              <span aria-hidden>🏷</span> Attributes
            </p>
            <ul className="flex flex-wrap gap-2">
              {attributeChips.map((chip) => (
                <li key={chip} className={chipClass}>
                  {chip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showSections && (
          <div className={sectionsWrapClass}>
            <p className="text-xs font-semibold text-brand-teal uppercase tracking-wide mb-3 px-2">
              All sections ({sections.length})
            </p>

            <ul className="space-y-3 lg:hidden">
              {sections.map((section, i) => (
                <li
                  key={`${section.crn ?? section.section ?? i}-card`}
                  className={sectionItemClass}
                >
                  <FieldGrid fields={buildSectionFields(section)} singleColumn compact />
                </li>
              ))}
            </ul>

            <div className={tableWrapClass}>
              <table className="w-full min-w-[640px] text-sm">
                <thead className={theadClass}>
                  <tr>
                    <th className={`px-4 py-2.5 font-semibold whitespace-nowrap ${isVivid ? 'text-white' : 'text-brand-navy'}`}>Section</th>
                    <th className={`px-4 py-2.5 font-semibold whitespace-nowrap ${isVivid ? 'text-white' : 'text-brand-navy'}`}>CRN</th>
                    <th className={`px-4 py-2.5 font-semibold whitespace-nowrap ${isVivid ? 'text-white' : 'text-brand-navy'}`}>Session</th>
                    <th className={`px-4 py-2.5 font-semibold whitespace-nowrap ${isVivid ? 'text-white' : 'text-brand-navy'}`}>Instructor</th>
                    <th className={`px-4 py-2.5 font-semibold whitespace-nowrap ${isVivid ? 'text-white' : 'text-brand-navy'}`}>Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section, i) => (
                    <tr key={`${section.crn ?? section.section ?? i}`} className={`border-t ${isVivid ? 'border-brand-teal/15' : 'border-brand-cream'}`}>
                      <td className="px-4 py-3 text-brand-navy whitespace-nowrap">{section.section ?? '—'}</td>
                      <td className="px-4 py-3 text-brand-navy/70 whitespace-nowrap">{section.crn ?? '—'}</td>
                      <td className="px-4 py-3 text-brand-navy/70 whitespace-nowrap">{section.session ?? '—'}</td>
                      <td className="px-4 py-3 text-brand-navy/70">{section.instructor ?? '—'}</td>
                      <td className="px-4 py-3 text-brand-navy/70">
                        {[section.meetingDays, section.meetingTime].filter(Boolean).join(' · ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {primary.sourceUrl && (
          <div className={`border-t px-6 sm:px-8 py-4 bg-white rounded-b-xl ${isVivid ? 'border-brand-teal/25' : 'border-brand-cream'}`}>
            <a
              href={primary.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-teal hover:text-brand-teal-dark hover:underline transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal rounded-sm"
            >
              View on university website →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
