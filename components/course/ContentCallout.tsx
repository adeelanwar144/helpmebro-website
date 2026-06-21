import type { ReactNode } from 'react';

export default function ContentCallout({ children }: { children: ReactNode }) {
  return (
    <aside
      className="my-6 rounded-r-xl border-l-4 border-brand-gold bg-gradient-to-r from-brand-teal/20 to-brand-teal/5 px-5 py-4 shadow-md"
      role="note"
    >
      <div className="text-brand-navy leading-relaxed text-[1.02rem] italic">{children}</div>
    </aside>
  );
}
