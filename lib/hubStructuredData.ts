import type { HubPage } from '@/lib/hubTypes';
import { hubCanonicalUrl } from '@/lib/hubPages';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export function hubServiceJsonLd(page: HubPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.h1,
    description: page.metaDescription,
    url: hubCanonicalUrl(page.slug),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function hubFaqJsonLd(page: HubPage) {
  if (!page.faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

export function hubPersonJsonLd(page: HubPage) {
  if (!page.schemaTypes.some((type) => type.toLowerCase() === 'person')) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Muhammad Ahsan (Sheikh)',
    jobTitle: 'PhD Scholar',
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: 'University of Sydney',
    },
    knowsAbout: [page.primaryKeyword, ...page.secondaryKeywords.slice(0, 3)],
  };
}

export function hubBreadcrumbJsonLd(page: HubPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: SITE_NAME,
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.h1,
        item: hubCanonicalUrl(page.slug),
      },
    ],
  };
}
