import {
  ShieldCheck,
  FileCheck,
  Clock,
  MessageCircle,
  Lock,
  type LucideIcon,
} from '@/components/icons';

const BADGES: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: '100% Original Work' },
  { icon: FileCheck, label: 'Turnitin Report' },
  { icon: Clock, label: 'Fast Turnaround' },
  { icon: MessageCircle, label: '24/7 Support' },
  { icon: Lock, label: 'Secure & Confidential' },
];

export default function TrustBadges({ variant = 'default' }: { variant?: 'default' | 'vivid' }) {
  const isVivid = variant === 'vivid';

  return (
    <section
      className={
        isVivid
          ? 'bg-gradient-to-r from-brand-teal-dark/12 via-brand-teal/8 to-brand-navy/8 border-b border-brand-teal/25 py-12 px-4'
          : 'bg-white border-b border-brand-cream py-12 px-4'
      }
      aria-labelledby="trust-badges-heading"
    >
      <h2 id="trust-badges-heading" className="sr-only">
        Why students trust AssignHelp
      </h2>
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        {BADGES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className={`flex flex-col items-center text-center gap-4 rounded-xl px-3 py-5 shadow-md hover:shadow-lg transition-shadow duration-200 ${
              isVivid
                ? 'border-2 border-brand-teal/30 bg-white'
                : 'border border-brand-cream bg-white'
            }`}
          >
            <div
              className="w-[68px] h-[68px] rounded-2xl bg-gradient-to-br from-brand-teal-dark to-brand-teal flex items-center justify-center shadow-sm"
              aria-hidden
            >
              <Icon className="w-9 h-9 text-white" strokeWidth={2.25} />
            </div>
            <p className="text-base font-bold text-brand-navy leading-snug">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
