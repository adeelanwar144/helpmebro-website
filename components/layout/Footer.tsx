import Link from 'next/link';
import { MessageCircle } from '@/components/icons';
import { getLiveUniversities } from '@/lib/universities';
import { universityHref } from '@/lib/subdomain';
import { whatsAppLink } from '@/lib/whatsapp';

const footerLinkClass =
  'text-white/70 hover:text-brand-teal transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal rounded-sm';

const footerColumnHeadingClass = 'text-white text-sm font-bold tracking-wide mb-4';

export default function Footer() {
  return (
    <footer className="border-t border-brand-cream bg-brand-navy text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div>
            <p className="font-display font-bold text-white text-lg mb-2">Help Me Bro</p>
            <p className="text-sm text-white/70 leading-relaxed">
              Expert assignment help and tutoring for US university students — built on verified
              Summer 2026 course data.
            </p>
          </div>

          <div>
            <p className={footerColumnHeadingClass}>Quick Links</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className={footerLinkClass}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about-us" className={footerLinkClass}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className={footerLinkClass}>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={footerColumnHeadingClass}>Universities</p>
            <ul className="space-y-2.5 text-sm">
              {getLiveUniversities().map((uni) => (
                <li key={uni.shortKey}>
                  <Link href={universityHref(uni.shortKey)} className={footerLinkClass}>
                    {uni.fullName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={footerColumnHeadingClass}>Get in Touch</p>
            <a
              href={whatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg transition-all duration-200 ease-out shadow-sm hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
              style={{
                backgroundColor: '#25D366',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '10px 20px',
              }}
            >
              <MessageCircle className="w-5 h-5 shrink-0" aria-hidden />
              Talk on WhatsApp
            </a>
            <p className="text-xs text-white/55 mt-4 leading-relaxed">
              Free quote · Confidential · Fast response
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Help Me Bro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
