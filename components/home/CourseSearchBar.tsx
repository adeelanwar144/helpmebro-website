'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { SearchableCourse } from '@/lib/types';
import { filterSearchableCourses } from '@/lib/courseUtils';
import { whatsAppUrl } from '@/lib/whatsapp';

const MAX_VISIBLE = 8;
const DEBOUNCE_MS = 200;

interface Props {
  courses: SearchableCourse[];
}

export default function CourseSearchBar({ courses }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setShowAll(false);
  }, [debouncedQuery]);

  const results = filterSearchableCourses(courses, debouncedQuery);
  const trimmed = debouncedQuery.trim();
  const showNoResults = trimmed.length >= 2 && results.length === 0;
  const showResults = open && trimmed.length > 0 && results.length > 0;
  const visible = showAll ? results : results.slice(0, MAX_VISIBLE);
  const hiddenCount = results.length - MAX_VISIBLE;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    setOpen(true);
  }, []);

  const whatsAppMessage = `Hi, I'm looking for help with ${trimmed}, can you assist?`;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto mb-8">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal pointer-events-none">
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search by course name or code (e.g. ENG 101, COM SCI 31)"
          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-brand-cream border border-white/30
                     text-brand-navy placeholder:text-brand-navy/45 text-base
                     focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal
                     shadow-lg shadow-brand-navy/15 transition-all duration-200 ease-out"
          aria-label="Search courses"
          aria-expanded={open && (showResults || showNoResults)}
          aria-haspopup="listbox"
          autoComplete="off"
        />
      </div>

      {showNoResults && open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl bg-white text-brand-navy shadow-xl border border-brand-cream p-5 text-left animate-fade-in">
          <p className="text-sm text-brand-navy/70">
            We couldn&apos;t find that course in our current database.
          </p>
          <a
            href={whatsAppUrl(whatsAppMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-base px-5 py-2.5 rounded-lg transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            💬 Talk to us on WhatsApp
          </a>
        </div>
      )}

      {showResults && (
        <div
          className="absolute z-20 mt-2 w-full rounded-xl bg-white text-brand-navy shadow-xl border border-brand-cream overflow-hidden text-left animate-fade-in"
          role="listbox"
        >
          <ul>
            {visible.map((course) => (
              <li key={`${course.href}-${course.courseCode}`}>
                <Link
                  href={course.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-brand-cream focus:bg-brand-cream transition-colors duration-200 ease-out border-b border-brand-cream/60 last:border-0 focus-visible:outline-none"
                  role="option"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-brand-navy">{course.courseCode}</p>
                      <p className="text-sm font-medium text-brand-navy/80 truncate">{course.courseTitle}</p>
                      <p className="text-xs text-brand-teal mt-0.5 uppercase tracking-wide">{course.university}</p>
                    </div>
                    <span className="text-brand-teal/40 shrink-0">→</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full px-4 py-2.5 text-base font-medium text-brand-teal hover:bg-brand-cream transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:bg-brand-cream"
            >
              See all {results.length} results
            </button>
          )}
        </div>
      )}
    </div>
  );
}
