import type { MetadataRoute } from 'next';
import type { UniversityData } from './types';
import { getUniversityRoutePaths } from './fetchCourses';
import { getHubSlugs, hubSubdomainUrl } from './hubPages';
import { universitySubdomainRootUrl } from './routing';
import { SITE_URL } from './site';
import { getLiveUniversities, getComingSoonUniversities } from './universities';

type SitemapEntry = MetadataRoute.Sitemap[number];

function entry(
  url: string,
  priority: number,
  changeFrequency: SitemapEntry['changeFrequency'] = 'weekly'
): SitemapEntry {
  return { url, lastModified: new Date(), changeFrequency, priority };
}

/** Apex-domain sitemap: main site pages plus every university subdomain root. */
export function buildApexSitemapEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    entry(SITE_URL, 1),
    entry(`${SITE_URL}/about-us`, 0.6, 'monthly'),
    entry(`${SITE_URL}/contact-us`, 0.6, 'monthly'),
  ];

  for (const uni of getLiveUniversities()) {
    entries.push(entry(universitySubdomainRootUrl(uni.displaySlug), 0.9));
  }

  for (const uni of getComingSoonUniversities()) {
    entries.push(entry(universitySubdomainRootUrl(uni.displaySlug), 0.5, 'monthly'));
  }

  for (const slug of getHubSlugs()) {
    entries.push(entry(hubSubdomainUrl(slug), 0.85, 'monthly'));
  }

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
