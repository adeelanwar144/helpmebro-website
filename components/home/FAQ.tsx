'use client';

import { useState } from 'react';
import { ChevronDown } from '@/components/icons';
import { FAQ_ITEMS } from '@/lib/faq';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      className="relative py-16 px-4 border-t border-brand-teal/15 bg-gradient-to-b from-brand-cream/25 via-white to-brand-teal/[0.04]"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto">
        <h2 id="faq-heading" className="section-heading text-center">
          Frequently Asked Questions
        </h2>
        <p className="section-subheading text-center">
          Common questions about expert assignment help and tutoring support
        </p>

        <div className="mt-8 space-y-4">
          {FAQ_ITEMS.map(({ question, answer }, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <div
                key={question}
                className="rounded-xl border border-brand-cream border-l-4 border-l-brand-teal bg-white shadow-sm hover:shadow-md hover:bg-brand-cream/15 transition-all duration-200 ease-out overflow-hidden"
              >
                <button
                  id={buttonId}
                  type="button"
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-teal/40"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-semibold text-brand-navy pr-2">{question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-brand-teal shrink-0 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    aria-hidden
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  aria-hidden={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 pt-1 border-t border-brand-cream/70">
                      <p className="text-sm text-brand-navy/65 leading-relaxed">{answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
