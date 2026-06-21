import type { Course } from '@/lib/types';

export default function CourseSections({ sections }: { sections: Course[] }) {
  if (!sections.length) return null;

  return (
    <section>
      <h2 className="section-heading">Sections</h2>
      <p className="section-subheading">
        {sections.length} section{sections.length !== 1 ? 's' : ''} for this course
      </p>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/60 text-left">
            <tr>
              <th className="px-4 py-2 font-semibold text-brand-navy">Section</th>
              <th className="px-4 py-2 font-semibold text-brand-navy">CRN</th>
              <th className="px-4 py-2 font-semibold text-brand-navy">Session</th>
              <th className="px-4 py-2 font-semibold text-brand-navy hidden sm:table-cell">Instructor</th>
              <th className="px-4 py-2 font-semibold text-brand-navy hidden md:table-cell">Schedule</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section, i) => (
              <tr key={`${section.crn ?? section.section ?? i}`} className="border-t border-brand-cream">
                <td className="px-4 py-3 text-brand-navy">{section.section ?? '—'}</td>
                <td className="px-4 py-3 text-brand-navy/70">{section.crn ?? '—'}</td>
                <td className="px-4 py-3 text-brand-navy/70">{section.session ?? '—'}</td>
                <td className="px-4 py-3 text-brand-navy/70 hidden sm:table-cell">{section.instructor ?? '—'}</td>
                <td className="px-4 py-3 text-brand-navy/70 hidden md:table-cell">
                  {[section.meetingDays, section.meetingTime].filter(Boolean).join(' · ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
