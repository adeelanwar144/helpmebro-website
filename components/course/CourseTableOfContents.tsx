'use client';

import { useState } from 'react';
import { ChevronDown } from '@/components/icons';

export interface TocItem {
  id: string;
  heading: string;
}

interface Props {
  items: TocItem[];
  variant: 'mobile' | 'desktop';
}

function handleJump(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function CourseTableOfContents({ items, variant }: Props) {
  const [open, setOpen] = useState(false);

  if (!items.length) return null;

  if (variant === 'mobile') {
    return (
      <nav aria-label="On this page" className="lg:hidden mb-8">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 rounded-xl border-2 border-brand-teal/25 bg-gradient-to-r from-brand-teal/10 to-white px-4 py-3 text-left shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          aria-expanded={open}
        >
          <span className="font-semibold text-brand-navy text-sm">On this page</span>
          <ChevronDown
            className={`w-5 h-5 text-brand-teal shrink-0 transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {open && (
          <ol className="mt-2 rounded-xl border-2 border-brand-teal/25 bg-white p-3 shadow-md space-y-1 max-h-64 overflow-y-auto">
            {items.map(({ id, heading }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    handleJump(id);
                    setOpen(false);
                  }}
                  className="w-full text-left text-sm text-brand-teal hover:text-brand-teal-dark hover:underline underline-offset-2 py-1.5 px-2 rounded-md transition-colors duration-200 ease-out"
                >
                  {heading}
                </button>
              </li>
            ))}
          </ol>
        )}
      </nav>
    );
  }

  return (
    <nav aria-label="On this page" className="hidden lg:block">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-navy/60 mb-3">
        On this page
      </p>
      <ol className="space-y-2 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
        {items.map(({ id, heading }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => handleJump(id)}
              className="w-full text-left text-sm text-brand-teal hover:text-brand-teal-dark hover:underline underline-offset-2 leading-snug py-1 transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal rounded-sm"
            >
              {heading}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
