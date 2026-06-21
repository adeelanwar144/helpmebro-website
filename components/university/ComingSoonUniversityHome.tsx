import Link from 'next/link';
import { getComingSoonUniversity } from '@/lib/universities';
import { slugToName } from '@/lib/subdomain';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Props {
  slug: string;
}

export default function ComingSoonUniversityHome({ slug }: Props) {
  const uni = getComingSoonUniversity(slug);
  const name = uni?.fullName ?? slugToName(slug);

  return (
    <>
      <Header uniName={name} uniSlug={slug} />
      <main className="flex-1">
        <section className="page-hero py-16">
          <div className="relative max-w-3xl mx-auto text-center">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-brand-yellow text-brand-navy px-3 py-1 rounded-full mb-4">
              Coming Soon
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3 text-white">{name}</h1>
            <p className="text-white/75 text-lg">
              Verified Summer 2026 course catalog — in progress.
            </p>
          </div>
        </section>

        <section className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-brand-navy/70 mb-6">
            We&apos;re building verified catalog data for {name}. Browse our live universities in the meantime.
          </p>
          <Link href="/#universities" className="btn-primary">
            Browse Live Universities
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
