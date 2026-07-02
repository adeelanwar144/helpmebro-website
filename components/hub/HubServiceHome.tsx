import Link from 'next/link';
import type { HubPage } from '@/lib/hubTypes';
import { hubSubdomainUrl, hubDevUrl } from '@/lib/hubPages';
import { hubBreadcrumbJsonLd, hubFaqJsonLd, hubServiceJsonLd } from '@/lib/hubStructuredData';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import HubPageContent from '@/components/hub/HubPageContent';
import HubCtaButton from '@/components/hub/HubCtaButton';

interface Props {
  page: HubPage;
}

export default function HubServiceHome({ page }: Props) {
  const jsonLd: Record<string, unknown>[] = [hubServiceJsonLd(page), hubBreadcrumbJsonLd(page)];
  const faqLd = hubFaqJsonLd(page);
  if (faqLd) jsonLd.push(faqLd);

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      <main className="flex-1 pb-16">
        <section className="relative overflow-hidden border-b border-brand-teal/20 bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark">
          <div className="absolute inset-0 opacity-40 pointer-events-none hero-dot-grid" aria-hidden />
          <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-12 text-center">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {page.h1}
            </h1>
            {page.intro && (
              <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-3xl mx-auto mb-8">
                {page.intro}
              </p>
            )}
            {page.ctas[0] && (
              <div className="flex justify-center">
                <HubCtaButton label={page.ctas[0]} />
              </div>
            )}
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <HubPageContent blocks={page.blocks.slice(2)} />

          {page.internalLinks.length > 0 && (
            <section className="mt-16 pt-10 border-t border-brand-cream">
              <h2 className="font-display text-xl font-bold text-brand-navy mb-4">Related services</h2>
              <ul className="flex flex-wrap gap-3">
                {page.internalLinks.map((link) => (
                  <li key={link.slug}>
                    <Link
                      href={process.env.NODE_ENV === 'development' ? hubDevUrl(link.slug) : hubSubdomainUrl(link.slug)}
                      className="inline-flex rounded-full border border-brand-teal/30 bg-white px-4 py-2 text-sm font-medium text-brand-navy hover:border-brand-teal hover:text-brand-teal transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
