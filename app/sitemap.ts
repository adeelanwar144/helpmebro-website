import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { fetchUniversityData, getUniversityRoutePaths } from '@/lib/fetchCourses';
import { getBaseUrlFromHost, getUniversityKeyFromHost } from '@/lib/routing';
import { SITE_URL } from '@/lib/site';
import { isComingSoonSlug, isLiveSlug } from '@/lib/universities';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = headers().get('host') ?? '';
  const uniKey = getUniversityKeyFromHost(host);
  const baseUrl = uniKey ? getBaseUrlFromHost(host) : SITE_URL;
  const now = new Date();

  if (!uniKey) {
    return [
      { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
      { url: `${SITE_URL}/about-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${SITE_URL}/contact-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ];
  }

  if (isComingSoonSlug(uniKey)) {
    return [{ url: baseUrl, lastModified: now, changeFrequency: 'monthly', priority: 0.5 }];
  }

  if (!isLiveSlug(uniKey)) {
    return [];
  }

  const university = await fetchUniversityData(uniKey);
  if (!university) return [];

  return getUniversityRoutePaths(university).map((path) => ({
    url: `${baseUrl}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path.split('/').length > 2 ? 'monthly' : 'weekly',
    priority: path === '/' ? 1 : path.split('/').length === 2 ? 0.8 : 0.6,
  }));
}
