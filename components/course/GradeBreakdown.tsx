import type { Assessment } from '@/lib/types';

const COLORS = [
  'bg-brand-navy',
  'bg-brand-teal',
  'bg-brand-teal-dark',
  'bg-brand-gold',
  'bg-brand-yellow',
  'bg-brand-cream',
];

export default function GradeBreakdown({ items }: { items: Assessment[] }) {
  if (!items?.length) return null;

  return (
    <section>
      <h2 className="section-heading">Grade Breakdown</h2>
      <p className="section-subheading">How your final grade is calculated</p>

      <div className="card p-4">
        <div className="flex h-4 rounded-full overflow-hidden mb-4">
          {items.map((item, i) => (
            <div
              key={item.name}
              className={`${COLORS[i % COLORS.length]} transition-all duration-200 ease-out`}
              style={{ width: `${item.percentage}%` }}
              title={`${item.name}: ${item.percentage}%`}
            />
          ))}
        </div>

        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${COLORS[i % COLORS.length]}`} />
                <span className="text-brand-navy/70">{item.name}</span>
              </div>
              <span className="font-semibold text-brand-navy">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
