import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ContactForm, { WhatsAppButton } from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with AssignHelp for assignment writing help or questions about our services.',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="page-hero">
          <div className="relative max-w-3xl mx-auto text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3 text-white">Contact Us</h1>
            <p className="text-white/80 text-lg">
              Have a question or need help with a course? We&apos;re here for you.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2 className="section-heading">Send us a message</h2>
              <p className="section-subheading">
                Share a few details below, then follow up on WhatsApp for the quickest reply.
              </p>
              <ContactForm />
            </div>

            <div className="lg:bg-brand-cream/40 lg:rounded-xl lg:p-6">
              <h2 className="section-heading">Prefer WhatsApp?</h2>
              <p className="section-subheading mb-6">
                Chat with us directly — fastest way to get a quote for your assignment.
              </p>
              <WhatsAppButton />
              <div className="mt-8 card p-5 text-sm text-brand-navy/70 space-y-2">
                <p>
                  <span className="font-semibold text-brand-navy">Fastest channel:</span> WhatsApp
                  — we reply quickly during business hours.
                </p>
                <p>
                  <span className="font-semibold text-brand-navy">Free quote:</span> No commitment
                  required to ask about pricing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
