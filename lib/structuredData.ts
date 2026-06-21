import { FAQ_ITEMS } from '@/lib/faq';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Expert assignment help and tutoring for verified Summer 2026 courses at US universities.',
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    knowsAbout: [
      'Assignment help',
      'Academic tutoring',
      'University coursework support',
      'Summer session courses',
    ],
  };
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}
