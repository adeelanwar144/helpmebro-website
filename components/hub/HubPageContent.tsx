import type { HubContentBlock } from '@/lib/hubTypes';
import { slugifyHeading } from '@/lib/courseContentUtils';
import HubCtaButton from '@/components/hub/HubCtaButton';

interface Props {
  blocks: HubContentBlock[];
}

function renderParagraphs(paragraphs: string[]) {
  return paragraphs.map((paragraph, index) => (
    <p key={index} className="leading-relaxed">
      {paragraph}
    </p>
  ));
}

export default function HubPageContent({ blocks }: Props) {
  let sectionIndex = 0;

  return (
    <div className="space-y-12">
      {blocks.map((block, index) => {
        if (block.type === 'intro') {
          return (
            <p key={index} className="text-lg text-brand-navy/90 leading-relaxed">
              {block.text}
            </p>
          );
        }

        if (block.type === 'cta') {
          return (
            <div key={index} className="flex justify-center my-8">
              <HubCtaButton label={block.label} />
            </div>
          );
        }

        if (block.type === 'badges') {
          return (
            <ul
              key={index}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-brand-teal/20 bg-brand-cream/40 px-5 py-4"
            >
              {block.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-brand-navy/90">
                  <span className="text-brand-teal mt-0.5" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'section') {
          const id = slugifyHeading(block.heading, sectionIndex);
          sectionIndex += 1;
          return (
            <section key={index} id={id} className="scroll-mt-24">
              <h2 className="section-heading">{block.heading}</h2>
              <div className="mt-4 space-y-4 text-brand-navy/90">{renderParagraphs(block.paragraphs)}</div>
            </section>
          );
        }

        if (block.type === 'faq') {
          return (
            <section key={index} id="faq" className="scroll-mt-24">
              <h2 className="section-heading">Frequently Asked Questions</h2>
              <div className="mt-6 space-y-8">
                {block.items.map(({ question, answer }) => (
                  <div key={question}>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-3 leading-snug">
                      {question}
                    </h3>
                    <p className="leading-relaxed text-brand-navy/90">{answer}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
