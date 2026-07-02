import { resolveHubSlugFromSubdomain } from '@/lib/hubPages';
import {
  getBaseUrlFromHost,
  getSubdomainFromHost,
} from '@/lib/routing';
import { SITE_URL } from '@/lib/site';
import {
  getUniversityByDisplaySlug,
  resolveUniversityKeyFromSubdomain,
} from '@/lib/universities';
import type { UniversityMeta } from '@/lib/universityMeta';

export type ApexSiteContext = {
  kind: 'apex';
  baseUrl: string;
};

export type UniversitySiteContext = {
  kind: 'university';
  baseUrl: string;
  shortKey: string;
  displaySlug: string;
  meta: UniversityMeta;
};

export type HubSiteContext = {
  kind: 'hub';
  baseUrl: string;
  slug: string;
};

export type UnknownSiteContext = {
  kind: 'unknown';
  baseUrl: string;
  displaySlug: string;
};

export type SiteContext =
  | ApexSiteContext
  | UniversitySiteContext
  | HubSiteContext
  | UnknownSiteContext;

export function resolveSiteContext(host: string): SiteContext {
  const hostSubdomain = getSubdomainFromHost(host);

  if (!hostSubdomain) {
    return { kind: 'apex', baseUrl: SITE_URL };
  }

  const baseUrl = getBaseUrlFromHost(host);
  const hubSlug = resolveHubSlugFromSubdomain(hostSubdomain);
  if (hubSlug) {
    return { kind: 'hub', baseUrl, slug: hubSlug };
  }

  const shortKey = resolveUniversityKeyFromSubdomain(hostSubdomain);
  const meta = getUniversityByDisplaySlug(hostSubdomain);
  if (shortKey && meta) {
    return {
      kind: 'university',
      baseUrl,
      shortKey,
      displaySlug: hostSubdomain,
      meta,
    };
  }

  return { kind: 'unknown', baseUrl, displaySlug: hostSubdomain };
}
