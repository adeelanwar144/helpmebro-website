import WhatsAppLinkButton from '@/components/course/WhatsAppLinkButton';

interface Props {
  courseCode: string;
  heading?: string;
  subline?: string;
}

export default function CourseContentCTA({
  courseCode,
  heading = `Need help with ${courseCode}?`,
  subline = 'Message us on WhatsApp with your assignment details for a fast, free quote.',
}: Props) {
  return (
    <div className="my-12 max-w-2xl overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark px-6 py-8 text-center shadow-xl shadow-brand-navy/25">
      <h3 className="font-display text-xl font-bold text-white mb-2">{heading}</h3>
      <p className="text-sm text-white/80 leading-relaxed mb-6 max-w-md mx-auto">{subline}</p>
      <WhatsAppLinkButton className="text-base px-8 py-3 shadow-lg hover:shadow-xl" />
    </div>
  );
}
