import {
  WhatsApp,
  MessageSquare,
  GraduationCap,
  CheckCircle2,
} from '@/components/icons';
import { whatsAppLink } from '@/lib/whatsapp';

const STEPS = [
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

export default function HowItWorks() {
  return (
    <section className="bg-white py-16 px-4 border-y border-brand-cream" aria-labelledby="how-it-works-heading">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-stretch">
          <div className="relative min-h-[320px] lg:min-h-0 lg:h-full">
            <div className="absolute inset-0 rounded-2xl border border-brand-cream bg-white shadow-lg overflow-hidden">
              <img
                src="/images/student-placeholder.jpg"
                alt="Student working on assignment"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <h2 id="how-it-works-heading" className="section-heading">
              How It Works
            </h2>
            <p className="section-subheading">
              Expert guidance in four simple steps — from your first message to feeling ready to submit.
            </p>

            <ol className="space-y-6 mt-6">
              {STEPS.map(({ icon: Icon, title, description }, index) => (
                <li key={title} className="flex gap-4">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className="w-px flex-1 min-h-[1.5rem] bg-brand-teal/25 mt-2 hidden sm:block" aria-hidden />
                    )}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-5 h-5 text-brand-teal shrink-0" strokeWidth={1.75} aria-hidden />
                      <h3 className="font-display font-bold text-brand-navy">{title}</h3>
                    </div>
                    <p className="text-sm text-brand-navy/70 leading-relaxed">{description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <a
              href={whatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8"
              style={{
                backgroundColor: '#25D366',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '12px 24px',
                borderRadius: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              Talk on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
