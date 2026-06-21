'use client';

import { useState } from 'react';
import type { WeeklyModule } from '@/lib/types';

export default function WeeklyModules({ modules }: { modules: WeeklyModule[] }) {
  const [openWeek, setOpenWeek] = useState<string | null>(modules[0]?.week ?? null);

  if (!modules?.length) return null;

  return (
    <section>
      <h2 className="section-heading">Weekly Modules</h2>
      <p className="section-subheading">{modules.length} weeks of course content</p>

      <div className="space-y-2">
        {modules.map((mod) => {
          const isOpen = openWeek === mod.week;
          return (
            <div key={mod.week} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenWeek(isOpen ? null : mod.week)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-brand-cream transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:bg-brand-cream"
                aria-expanded={isOpen}
              >
                <div>
                  <span className="text-xs font-semibold text-brand-teal uppercase tracking-wide">
                    {mod.week}
                  </span>
                  <p className="font-semibold text-brand-navy mt-0.5">{mod.topic}</p>
                  <p className="text-xs text-brand-navy/45 mt-0.5">{mod.dateRange}</p>
                </div>
                <span className={`text-brand-teal/50 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {isOpen && mod.description && (
                <div className="px-4 pb-4 border-t border-brand-cream">
                  <p className="mt-3 text-sm text-brand-navy/70">{mod.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
