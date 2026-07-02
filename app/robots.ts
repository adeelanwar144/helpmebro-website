import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { isHubSlug } from '@/lib/hubPages';
import { getBaseUrlFromHost, getEffectiveRequestHost, getSubdomainFromHost, getUniversityKeyFromHost } from '@/lib/routing';
import { SITE_URL } from '@/lib/site';

export const runtime = 'edge';

export default function robots(): MetadataRoute.Robots {
  const requestHeaders = headers();
  const host = getEffectiveRequestHost((name) => requestHeaders.get(name));
  const hostSubdomain = getSubdomainFromHost(host);
  const uniKey = getUniversityKeyFromHost(host);
  const isHub = hostSubdomain ? isHubSlug(hostSubdomain) : false;
  const baseUrl = uniKey || isHub ? getBaseUrlFromHost(host) : SITE_URL;

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
