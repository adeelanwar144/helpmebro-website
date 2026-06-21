import {
  WhatsApp,
  MessageSquare,
  GraduationCap,
  CheckCircle2,
  type LucideIcon,
} from '@/components/icons';

const STEPS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: WhatsApp,
    title: 'Send Direct Message on WhatsApp',
    description:
      'Message us directly on WhatsApp with your course code and assignment details to get started instantly.',
  },
  {
    icon: MessageSquare,
    title: 'Tell Us What You Need',
    description: 'Share assignment details via WhatsApp or our contact form — rubrics welcome.',
  },
  {
    icon: GraduationCap,
    title: 'Get Expert Help',
    description: 'We match you with a subject expert for guidance, tutoring, and structured support.',
  },
  {
    icon: CheckCircle2,
    title: 'Review & Submit',
    description: 'Review the work, ask questions, and request revisions until you feel confident.',
  },
];

export default function CourseHowItWorksMini({ variant = 'standalone' }: { variant?: 'standalone' | 'embedded' }) {
  const isEmbedded = variant === 'embedded';

  return (
    <section
      className={
        isEmbedded
          ? 'rounded-2xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark px-4 py-10 shadow-xl shadow-brand-navy/20'
          : 'my-16 py-12 px-4 -mx-4 sm:mx-0 rounded-2xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark shadow-xl shadow-brand-navy/20'
      }
      aria-labelledby="course-how-it-works-heading"
    >
      <div className="max-w-3xl mx-auto">
        <h2 id="course-how-it-works-heading" className="font-display text-2xl font-bold text-white mb-1 text-center">
          How It Works
        </h2>
        <p className="text-white/75 text-sm text-center mb-8">
          Expert guidance in four simple steps — from your first message to feeling ready to submit.
        </p>

        <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li
              key={title}
              className="flex gap-4 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm p-5"
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-brand-gold text-brand-navy flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-5 h-5 text-brand-gold shrink-0" strokeWidth={1.75} aria-hidden />
                  <h3 className="font-display font-bold text-white text-sm leading-snug">{title}</h3>
                </div>
                <p className="text-sm text-white/75 leading-relaxed">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
