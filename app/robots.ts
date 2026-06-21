import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getBaseUrlFromHost, getUniversityKeyFromHost } from '@/lib/routing';
import { SITE_URL } from '@/lib/site';

export const runtime = 'edge';

export default function robots(): MetadataRoute.Robots {
  const host = headers().get('host') ?? '';
  const uniKey = getUniversityKeyFromHost(host);
  const baseUrl = uniKey ? getBaseUrlFromHost(host) : SITE_URL;

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
