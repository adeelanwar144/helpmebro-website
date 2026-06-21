import { getUniversityByShortKey, getUniversitySubdomainSlug } from './universities';
import { getApexDomain } from './routing';
import { SITE_URL } from './site';

export function slugToName(slug: string): string {
  const fromRegistry = getUniversityByShortKey(slug)?.fullName;
  if (fromRegistry) return fromRegistry;

  return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function universityHref(slug: string, siteUrl?: string): string {
  const base = siteUrl || SITE_URL;
  const domain = base.replace(/^https?:\/\//, '').replace(/\/$/, '');

  if (process.env.NODE_ENV === 'development') {
    return `/?uni=${slug}`;
  }

  const hostSubdomain = getUniversitySubdomainSlug(slug) ?? slug;
  return `https://${hostSubdomain}.${domain}`;
}

export { getApexDomain };
