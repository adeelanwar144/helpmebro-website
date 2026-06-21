import { Star } from '@/components/icons';

const TESTIMONIALS = [
  {
    initials: 'J.M.',
    quote:
      'Got clear, well-organized help with my course project right before the deadline. Made a stressful week much easier.',
    university: 'Ohio State University',
  },
  {
    initials: 'A.R.',
    quote:
      'The tutor really understood the assignment requirements and helped me improve my understanding of the material, not just hand in something finished.',
    university: 'Fordham University',
  },
  {
    initials: 'S.K.',
    quote:
      'Fast responses and the work matched exactly what my professor asked for in the rubric.',
    university: 'ASU',
  },
];

function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <div
      className="w-11 h-11 rounded-full bg-brand-teal text-white flex items-center justify-center text-sm font-bold shrink-0"
      aria-hidden
    >
      {initials}
    </div>
  );
}

function StarRating() {
  return (
    <div className="flex gap-0.5" role="img" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-brand-gold text-brand-gold" aria-hidden />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <>
      {/* PLACEHOLDER TESTIMONIALS - replace with real student reviews before launch */}
      <section className="bg-white py-16 px-4" aria-labelledby="testimonials-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="testimonials-heading" className="section-heading text-center">
            What Students Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {TESTIMONIALS.map(({ initials, quote, university }) => (
              <article key={initials} className="card p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <InitialsAvatar initials={initials} />
                  <div>
                    <StarRating />
                    <p className="text-xs text-brand-teal mt-1 font-medium uppercase tracking-wide">
                      {university}
                    </p>
                  </div>
                </div>
                <blockquote className="text-sm text-brand-navy/75 leading-relaxed flex-1">
                  &ldquo;{quote}&rdquo;
                </blockquote>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
