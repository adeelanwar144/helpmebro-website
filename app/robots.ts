import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getBaseUrlFromHost, getEffectiveRequestHost, getUniversityKeyFromHost } from '@/lib/routing';
import { SITE_URL } from '@/lib/site';

export const runtime = 'edge';

export default function robots(): MetadataRoute.Robots {
  const requestHeaders = headers();
  const host = getEffectiveRequestHost((name) => requestHeaders.get(name));
  const uniKey = getUniversityKeyFromHost(host);
  const baseUrl = uniKey ? getBaseUrlFromHost(host) : SITE_URL;

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
