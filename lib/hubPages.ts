import hubIndex from '@/data/hub-pages/index.json';
import type { HubPage } from '@/lib/hubTypes';
import { getApexDomain } from '@/lib/routing';

const HUB_SLUGS = new Set(hubIndex.pages.map((page) => page.slug));

export function getHubSlugs(): string[] {
  return [...HUB_SLUGS];
}

export function isHubSlug(slug: string): boolean {
  return HUB_SLUGS.has(slug);
}

export function resolveHubSlugFromSubdomain(hostSubdomain: string): string | null {
  return isHubSlug(hostSubdomain) ? hostSubdomain : null;
}

export async function getHubPage(slug: string): Promise<HubPage | null> {
  if (!isHubSlug(slug)) return null;
  try {
    const mod = await import(`@/data/hub-pages/${slug}.json`);
    return (mod.default ?? mod) as HubPage;
  } catch {
    return null;
  }
}

export function hubSubdomainUrl(slug: string): string {
  const domain = getApexDomain();
  return `https://${slug}.${domain}`;
}

export function hubDevUrl(slug: string): string {
  return `/?hub=${slug}`;
}

export function hubCanonicalUrl(slug: string): string {
  return hubSubdomainUrl(slug);
}
