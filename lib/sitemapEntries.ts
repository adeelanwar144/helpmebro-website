import type { MetadataRoute } from 'next';
import type { UniversityData } from './types';
import { getUniversityRoutePaths } from './fetchCourses';
import hubIndex from '@/data/hub-pages/index.json';
import { hubSubdomainUrl } from './hubPages';
import { universitySubdomainRootUrl } from './routing';
import { SITE_URL } from './site';
import { getLiveUniversities, getComingSoonUniversities } from './universities';

type SitemapEntry = MetadataRoute.Sitemap[number];

const MONEY_PAGE_SLUG = 'college-essay-writing-services';

function entry(
  url: string,
  priority: number,
  changeFrequency: SitemapEntry['changeFrequency'] = 'weekly',
  lastModified?: string
): SitemapEntry {
  return {
    url,
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    changeFrequency,
    priority,
  };
}

function hubSitemapPriority(slug: string): number {
  if (slug === MONEY_PAGE_SLUG) return 0.95;
  if (slug.endsWith('-service') || slug.includes('writing-service')) return 0.9;
  if (slug.startsWith('how-') || slug.startsWith('what-') || slug.startsWith('do-')) return 0.8;
  return 0.85;
}

/** All hub subdomain URLs for the apex sitemap. */
export function buildHubSitemapEntries(): MetadataRoute.Sitemap {
  return hubIndex.pages.map(({ slug, lastReviewed }) =>
    entry(
      hubSubdomainUrl(slug),
      hubSitemapPriority(slug),
      slug === MONEY_PAGE_SLUG ? 'weekly' : 'monthly',
      lastReviewed
    )
  );
}

/** Single-entry sitemap for a hub subdomain. */
export function buildHubSubdomainSitemapEntry(
  slug: string,
  lastReviewed?: string
): MetadataRoute.Sitemap {
  return [
    entry(hubSubdomainUrl(slug), 1, 'monthly', lastReviewed),
  ];
}

/** Main apex-domain pages only (referenced by /sitemap-main.xml). */
export function buildApexMainSitemapEntries(): MetadataRoute.Sitemap {
  return [
    entry(SITE_URL, 1),
    entry(`${SITE_URL}/about-us`, 0.6, 'monthly'),
    entry(`${SITE_URL}/contact-us`, 0.6, 'monthly'),
  ];
}

/** @deprecated Use buildApexMainSitemapEntries + buildApexSitemapIndexUrls instead. */
export function buildApexSitemapEntries(): MetadataRoute.Sitemap {
  const entries = buildApexMainSitemapEntries();

  for (const uni of getLiveUniversities()) {
    entries.push(entry(universitySubdomainRootUrl(uni.displaySlug), 0.9));
  }

  for (const uni of getComingSoonUniversities()) {
    entries.push(entry(universitySubdomainRootUrl(uni.displaySlug), 0.5, 'monthly'));
  }

  entries.push(...buildHubSitemapEntries());

  return entries;
}

/** Subdomain sitemap: university home, every department, and every course page. */
export function buildUniversitySitemapEntries(
  university: UniversityData,
  baseUrl: string
): MetadataRoute.Sitemap {
  return getUniversityRoutePaths(university).map((path) => {
    const depth = path.split('/').filter(Boolean).length;
    return entry(
      `${baseUrl}${path === '/' ? '' : path}`,
      path === '/' ? 1 : depth === 1 ? 0.8 : 0.6,
      depth > 1 ? 'monthly' : 'weekly'
    );
  });
}

export function buildComingSoonSitemapEntries(baseUrl: string): MetadataRoute.Sitemap {
  return [entry(baseUrl, 0.5, 'monthly')];
}
