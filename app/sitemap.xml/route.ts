import { headers } from 'next/headers';
import { fetchUniversityData } from '@/lib/fetchCourses';
import {
  buildApexMainSitemapEntries,
  buildComingSoonSitemapEntries,
  buildHubSubdomainSitemapEntry,
  buildUniversitySitemapEntries,
} from '@/lib/sitemapEntries';
import { buildApexSitemapIndexUrls } from '@/lib/sitemapIndex';
import { getBaseUrlFromHost, getEffectiveRequestHost, getSubdomainFromHost } from '@/lib/routing';
import hubIndex from '@/data/hub-pages/index.json';
import { isHubSlug } from '@/lib/hubPages';
import { renderSitemapIndex, renderUrlSet, xmlResponse } from '@/lib/sitemapXml';
import { getUniversityByDisplaySlug, isComingSoonSlug, isLiveSlug } from '@/lib/universities';

export const runtime = 'edge';

export async function GET(): Promise<Response> {
  const requestHeaders = headers();
  const host = getEffectiveRequestHost((name) => requestHeaders.get(name));
  const hostSubdomain = getSubdomainFromHost(host);

  if (!hostSubdomain) {
    return xmlResponse(renderSitemapIndex(buildApexSitemapIndexUrls()));
  }

  const baseUrl = getBaseUrlFromHost(host);

  if (isHubSlug(hostSubdomain)) {
    const hubMeta = hubIndex.pages.find((page) => page.slug === hostSubdomain);
    return xmlResponse(renderUrlSet(buildHubSubdomainSitemapEntry(hostSubdomain, hubMeta?.lastReviewed)));
  }

  const uniMeta = getUniversityByDisplaySlug(hostSubdomain);
  if (!uniMeta) {
    return xmlResponse(renderUrlSet([]));
  }

  const uniKey = uniMeta.shortKey;

  if (isComingSoonSlug(uniKey)) {
    return xmlResponse(renderUrlSet(buildComingSoonSitemapEntries(baseUrl)));
  }

  if (!isLiveSlug(uniKey)) {
    return xmlResponse(renderUrlSet([]));
  }

  const university = await fetchUniversityData(uniKey);
  if (!university) {
    return xmlResponse(renderUrlSet([]));
  }

  return xmlResponse(renderUrlSet(buildUniversitySitemapEntries(university, baseUrl)));
}
