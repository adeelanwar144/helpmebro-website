import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { fetchUniversityData } from '@/lib/fetchCourses';
import {
  buildApexSitemapEntries,
  buildComingSoonSitemapEntries,
  buildUniversitySitemapEntries,
} from '@/lib/sitemapEntries';
import { getBaseUrlFromHost, getEffectiveRequestHost, getSubdomainFromHost } from '@/lib/routing';
import { getUniversityByDisplaySlug, isComingSoonSlug, isLiveSlug } from '@/lib/universities';

export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = headers();
  const host = getEffectiveRequestHost((name) => requestHeaders.get(name));
  const hostSubdomain = getSubdomainFromHost(host);

  if (!hostSubdomain) {
    return buildApexSitemapEntries();
  }

  const baseUrl = getBaseUrlFromHost(host);
  const uniMeta = getUniversityByDisplaySlug(hostSubdomain);
  if (!uniMeta) return [];

  const uniKey = uniMeta.shortKey;

  if (isComingSoonSlug(uniKey)) {
    return buildComingSoonSitemapEntries(baseUrl);
  }

  if (!isLiveSlug(uniKey)) {
    return [];
  }

  const university = await fetchUniversityData(uniKey);
  if (!university) return [];

  return buildUniversitySitemapEntries(university, baseUrl);
}
