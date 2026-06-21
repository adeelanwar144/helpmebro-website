import { SITE_URL } from './site';
import {
  getUniversitySubdomainSlug,
  resolveUniversityKeyFromSubdomain,
} from './universities';

export function getApexDomain(): string {
  return SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Host label before the apex domain (e.g. ohio-state-university-assignment-help). */
export function getSubdomainFromHost(host: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();

  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace(/\.localhost$/, '');
    return sub && sub !== 'localhost' ? sub : null;
  }

  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0];
  }

  if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'localhost') {
    return parts[0];
  }

  return null;
}

/** Prefer Worker-provided x-forwarded-host; fall back to host for local dev. */
export function getEffectiveRequestHost(
  getHeader: (name: string) => string | null
): string {
  return getHeader('x-forwarded-host') || getHeader('host') || '';
}

/** Internal university key from Host (maps descriptive subdomain → shortKey). */
export function getUniversityKeyFromHost(host: string): string | null {
  const hostSubdomain = getSubdomainFromHost(host);
  if (!hostSubdomain) return null;
  return resolveUniversityKeyFromSubdomain(hostSubdomain);
}

export function getBaseUrlFromHost(host: string): string {
  const hostname = host.split(':')[0];
  if (!hostname || hostname.startsWith('localhost')) {
    return SITE_URL;
  }
  return `https://${hostname}`;
}

export function universitySubdomainUrl(uniSlug: string, path = '/'): string {
  const domain = getApexDomain();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const suffix = normalizedPath === '/' ? '' : normalizedPath;
  const hostSubdomain = getUniversitySubdomainSlug(uniSlug) ?? uniSlug;
  return `https://${hostSubdomain}.${domain}${suffix}`;
}

/** Self-referencing canonical on the university subdomain (no query string). */
export function canonicalUniversityUrl(uniSlug: string, path = '/'): string {
  return universitySubdomainUrl(uniSlug, path);
}

/** Internal href while browsing a university context (dev uses ?uni=). */
export function hrefOnUniversity(path: string, uniSlug: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (process.env.NODE_ENV === 'development') {
    if (normalized === '/') return `/?uni=${uniSlug}`;
    return `${normalized}?uni=${uniSlug}`;
  }

  return normalized;
}

export function coursePagePath(deptSlug: string, courseSlug: string): string {
  return `/${deptSlug}/${courseSlug}`;
}

export function departmentPagePath(deptSlug: string): string {
  return `/${deptSlug}`;
}
