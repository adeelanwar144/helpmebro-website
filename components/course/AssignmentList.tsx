import type { Assignment } from '@/lib/types';

function urgencyColor(dueDate: string) {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days <= 3) return 'text-brand-navy bg-brand-yellow border-brand-gold';
  if (days <= 7) return 'text-brand-navy bg-brand-cream border-brand-teal/30';
  return 'text-brand-teal-dark bg-brand-teal/10 border-brand-teal/20';
}

export default function AssignmentList({ assignments }: { assignments: Assignment[] }) {
  if (!assignments?.length) return null;

  return (
    <section>
      <h2 className="section-heading">Assignments</h2>
      <p className="section-subheading">{assignments.length} assignments this session</p>
      <div className="space-y-3">
        {assignments.map((a) => (
          <div key={a.name} className="card p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-navy truncate">{a.name}</p>
              <p className="text-xs text-brand-navy/45 mt-0.5">{a.type} · {a.week}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${urgencyColor(a.dueDate)}`}>
                {a.dueDate}
              </span>
              {a.weight ? (
                <p className="text-xs text-brand-navy/45 mt-1">{a.weight}% of grade</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
