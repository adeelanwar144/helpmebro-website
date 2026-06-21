import type { Course } from '@/lib/types';
import { parseAttributeChips } from '@/lib/parseAttributes';

interface DetailRow {
  label: string;
  value: string;
}

export default function CourseDetails({ course }: { course: Course }) {
  const attributeChips = parseAttributeChips(course.attributes);

  const rows: DetailRow[] = [
    { label: 'Meeting days', value: course.meetingDays ?? '' },
    { label: 'Location', value: course.location ?? '' },
    { label: 'Instruction mode', value: course.instructionMode ?? '' },
    { label: 'Section', value: course.section ?? '' },
    { label: 'CRN', value: course.crn ?? '' },
    { label: 'Credits', value: course.credits ?? '' },
  ].filter((r) => r.value.trim());

  if (!rows.length && !attributeChips.length && !course.sourceUrl) return null;

  return (
    <section>
      <h2 className="section-heading">Course Details</h2>
      <p className="section-subheading">Schedule and registration info from the university catalog</p>

      <div className="rounded-xl border border-brand-cream bg-brand-cream/40 p-5 sm:p-6 shadow-sm">
        {rows.length > 0 && (
          <dl className="divide-y divide-brand-cream/80">
            {rows.map(({ label, value }) => (
              <div key={label} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:gap-4">
                <dt className="text-xs font-semibold text-brand-teal uppercase tracking-wide sm:w-40 shrink-0">
                  {label}
                </dt>
                <dd className="text-sm text-brand-navy/80">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {attributeChips.length > 0 && (
          <div className={rows.length ? 'mt-4 pt-4 border-t border-brand-cream/80' : ''}>
            <p className="text-xs font-semibold text-brand-teal uppercase tracking-wide mb-3">
              Attributes
            </p>
            <ul className="flex flex-wrap gap-2">
              {attributeChips.map((chip) => (
                <li
                  key={chip}
                  className="inline-flex max-w-full rounded-full border border-brand-cream bg-white px-3 py-1 text-xs text-brand-navy/80 leading-snug"
                >
                  {chip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {course.sourceUrl && (
          <p className={rows.length || attributeChips.length ? 'mt-4 pt-4 border-t border-brand-cream/80' : ''}>
            <a
              href={course.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-teal hover:text-brand-teal-dark hover:underline transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal rounded-sm"
            >
              View on university website →
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
