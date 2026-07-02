import hubIndex from '@/data/hub-pages/index.json';
import { hubSubdomainUrl } from './hubPages';
import { universitySubdomainRootUrl } from './routing';
import { SITE_URL } from './site';
import { getComingSoonUniversities, getLiveUniversities } from './universities';

/** Child sitemap URLs referenced by the apex sitemap index. */
export function buildApexSitemapIndexUrls(): string[] {
  const urls = [`${SITE_URL}/sitemap-main.xml`];

  for (const uni of getLiveUniversities()) {
    urls.push(`${universitySubdomainRootUrl(uni.displaySlug)}/sitemap.xml`);
  }

  for (const uni of getComingSoonUniversities()) {
    urls.push(`${universitySubdomainRootUrl(uni.displaySlug)}/sitemap.xml`);
  }

  for (const { slug } of hubIndex.pages) {
    urls.push(`${hubSubdomainUrl(slug)}/sitemap.xml`);
  }

  return urls;
}
