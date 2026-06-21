import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AboutIllustration from '@/components/about/AboutIllustration';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'AssignHelp provides expert assignment writing help for real Summer 2026 courses at verified US universities.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="page-hero">
          <div className="relative max-w-3xl mx-auto text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3 text-white">About AssignHelp</h1>
            <p className="text-white/80 text-lg">
              Expert assignment help built on real university course data.
            </p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-4 py-12 space-y-0 text-brand-navy/80 leading-relaxed">
          <AboutIllustration />
          <section className="py-8">
            <h2 className="font-display text-xl font-bold text-brand-navy mb-3">What we do</h2>
            <p>
              AssignHelp connects students with expert tutors and writers for assignment guidance on{' '}
              <strong className="text-brand-navy">real Summer 2026 courses</strong> at verified US universities — including
              Fordham, Columbia, UConn, Arizona State, and Ohio State. Browse actual catalog
              sections, then request help for the specific course you&apos;re enrolled in.
            </p>
          </section>

          <section className="py-8 bg-brand-cream -mx-4 px-4 sm:mx-0 sm:rounded-xl sm:px-8">
            <h2 className="font-display text-xl font-bold text-brand-navy mb-3">Why our data is real</h2>
            <p>
              Every course on this site comes from a live, public university catalog page. We do
              not invent course codes, instructors, or schedules. Each record includes a source URL
              pointing back to the university&apos;s own listing. If a field isn&apos;t published
              publicly (e.g. some schools don&apos;t expose CRNs or descriptions), we leave it blank
              rather than guess.
            </p>
          </section>

          <section className="py-8">
            <h2 className="font-display text-xl font-bold text-brand-navy mb-3">Our mission</h2>
            <p>
              We believe students deserve fast, reliable, confidential support when coursework
              gets overwhelming. Our goal is to match you with subject-matter experts who deliver
              original, high-quality work — on time, every time.
            </p>
          </section>

          <section className="py-8 bg-brand-cream -mx-4 px-4 sm:mx-0 sm:rounded-xl sm:px-8">
            <h2 className="font-display text-xl font-bold text-brand-navy mb-3">What we stand for</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-brand-navy">Transparency</strong> — Real course data, clearly sourced.
              </li>
              <li>
                <strong className="text-brand-navy">Quality</strong> — Expert writers matched to your subject and level.
              </li>
              <li>
                <strong className="text-brand-navy">Confidentiality</strong> — Your information stays private.
              </li>
              <li>
                <strong className="text-brand-navy">Support</strong> — Free quotes, no commitment required.
              </li>
            </ul>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
