'use client';

import type { SearchableCourse } from '@/lib/types';
import CourseSearchBar from '@/components/home/CourseSearchBar';
import { whatsAppLink } from '@/lib/whatsapp';

interface Props {
  uniName: string;
  term: string;
  uniqueCourses: number;
  deptCount: number;
  totalSections: number;
  searchableCourses: SearchableCourse[];
}

export default function UniversityHero({
  uniName,
  term,
  uniqueCourses,
  deptCount,
  totalSections,
  searchableCourses,
}: Props) {
  return (
    <section className="page-hero py-16 sm:py-20">
      <div
        className="absolute inset-0 opacity-50 pointer-events-none hero-dot-grid"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-brand-teal-dark/30 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="relative max-w-4xl mx-auto text-center px-4">
        <p className="text-brand-gold text-sm font-semibold uppercase tracking-widest mb-2">
          {term}
        </p>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-white leading-tight">
          {uniName} Assignment Help
        </h1>

        <p className="text-white/85 text-lg sm:text-xl max-w-2xl mx-auto mb-3 leading-relaxed">
          Browse{' '}
          <span className="font-semibold text-white">{uniqueCourses}</span> courses across{' '}
          <span className="font-semibold text-white">{deptCount}</span> departments (
          <span className="font-semibold text-white">{totalSections}</span> sections).
        </p>

        <p className="text-white/65 text-sm max-w-xl mx-auto mb-10">
          Real {term} catalog data for {uniName} — no fabricated courses.
        </p>

        <CourseSearchBar courses={searchableCourses} />

        <a
          href={whatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: '#25D366',
            color: '#ffffff',
            fontWeight: 'bold',
            padding: '12px 24px',
            borderRadius: '0.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
          }}
        >
          Talk on WhatsApp
        </a>
      </div>
    </section>
  );
}
