import Link from 'next/link';
import { hrefOnUniversity } from '@/lib/routing';
import { whatsAppLink } from '@/lib/whatsapp';

interface Props {
  uniName?: string;
  uniSlug?: string;
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about-us', label: 'About Us' },
  { href: '/contact-us', label: 'Contact Us' },
];

export default function Header({ uniName, uniSlug }: Props) {
  const homeHref = uniSlug ? hrefOnUniversity('/', uniSlug) : '/';

  return (
    <header className="border-b border-brand-cream bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between gap-6">
          <Link
            href={homeHref}
            className="flex items-center gap-2 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal rounded-sm"
          >
            <span className="font-display font-bold text-brand-navy text-lg">Help Me Bro</span>
            {uniName && (
              <>
                <span className="text-brand-cream hidden lg:block">·</span>
                <span className="text-brand-navy/60 text-sm hidden lg:block truncate max-w-[180px]">
                  {uniName}
                </span>
              </>
            )}
          </Link>

          <nav
            className="hidden md:flex flex-1 items-center justify-center gap-8"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-bold text-lg text-brand-navy px-3 py-1.5 rounded-md transition-all duration-200 ease-out hover:text-brand-teal hover:underline hover:underline-offset-4 hover:decoration-brand-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
              >
                {label}
              </Link>
            ))}
          </nav>

          <a
            href={whatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
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

        <nav
          className="md:hidden flex items-center gap-6 pt-4 pb-1 overflow-x-auto"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-bold text-lg text-brand-navy whitespace-nowrap px-3 py-1.5 rounded-md transition-all duration-200 ease-out hover:text-brand-teal hover:underline hover:underline-offset-4 hover:decoration-brand-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
