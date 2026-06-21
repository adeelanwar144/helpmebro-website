'use client';

import type { SearchableCourse } from '@/lib/types';
import CourseSearchBar from './CourseSearchBar';

interface Props {
  totalUniqueCourses: number;
  totalDepartments: number;
  totalUniversities: number;
  searchableCourses: SearchableCourse[];
}

export default function HomeHero({
  totalUniqueCourses,
  totalDepartments,
  totalUniversities,
  searchableCourses,
}: Props) {
  return (
    <section className="page-hero py-20">
      <div
        className="absolute inset-0 opacity-50 pointer-events-none hero-dot-grid"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-brand-teal-dark/30 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <p className="text-brand-gold text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-4">
          Summer 2026
        </p>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5 leading-[1.1] tracking-tight text-white">
          Assignment Help for
          <br />
          Top US Universities
        </h1>

        <p className="text-white/85 text-lg sm:text-xl max-w-2xl mx-auto mb-3 leading-relaxed">
          Expert tutoring and guidance for{' '}
          <span className="font-semibold text-white">{totalUniqueCourses}</span> verified courses
          across{' '}
          <span className="font-semibold text-white">{totalDepartments}</span> departments at{' '}
          <span className="font-semibold text-white">{totalUniversities}</span> universities.
        </p>
        <p className="text-white/65 text-sm max-w-xl mx-auto mb-10">
          Real Summer 2026 catalog data — no fabricated courses.
        </p>

        <CourseSearchBar courses={searchableCourses} />

        <a
          href="#universities"
          className="btn-hero-cta inline-flex items-center gap-2"
        >
          Browse Universities →
        </a>
      </div>
    </section>
  );
}
