import type { Course } from '@/lib/types';

interface Props {
  course: Course;
  uniName: string;
  term: string;
}

export default function CourseHero({ course, uniName, term }: Props) {
  return (
    <section className="animate-fade-in">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="font-mono text-sm font-bold text-brand-navy bg-brand-cream px-3 py-1 rounded-lg">
          {course.courseCode}
        </span>
        <span className="text-sm text-brand-navy/55">{uniName}</span>
        {course.crn && (
          <span className="text-xs text-brand-navy/40">CRN {course.crn}</span>
        )}
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy mb-2">
        {course.courseTitle}
      </h1>
      {course.instructor && (
        <p className="text-brand-navy/70 mb-4">
          Taught by <span className="font-semibold text-brand-navy">{course.instructor}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-4 text-sm text-brand-navy/55">
        {course.sessionStart && course.sessionEnd && (
          <span>📅 {course.sessionStart} – {course.sessionEnd}</span>
        )}
        {course.session && <span>🗓 {course.session}</span>}
        <span>🏛 {course.department}</span>
        {course.credits && <span>🎓 {course.credits} credits</span>}
        <span>📆 {term}</span>
      </div>
      {course.description && (
        <p className="mt-4 text-brand-navy/70 leading-relaxed">{course.description}</p>
      )}
    </section>
  );
}
