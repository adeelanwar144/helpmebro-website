import type { SiteContext } from '@/lib/siteContext';
import { getAssignmentHelpDisplayName } from '@/lib/universityMeta';
import { buildApexSitemapIndexUrls } from '@/lib/sitemapIndex';
import { SITE_NAME, SITE_URL } from '@/lib/site';

function lines(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join('\n');
}

export function buildRobotsTxt(context: SiteContext): string {
  const sitemapUrl = `${context.baseUrl}/sitemap.xml`;

  if (context.kind === 'apex') {
    return lines(
      `# ${SITE_NAME} — main site`,
      `# Canonical: ${SITE_URL}`,
      `# Sitemap index lists ${buildApexSitemapIndexUrls().length} child sitemaps (universities, hubs, main pages).`,
      '',
      'User-agent: *',
      'Allow: /',
      '',
      `Sitemap: ${sitemapUrl}`
    );
  }

  if (context.kind === 'hub') {
    return lines(
      `# ${SITE_NAME} — college essay service hub`,
      `# Subdomain: ${context.slug}`,
      `# Canonical: ${context.baseUrl}`,
      '',
      'User-agent: *',
      'Allow: /',
      '',
      `Sitemap: ${sitemapUrl}`
    );
  }

  if (context.kind === 'university') {
    const name = getAssignmentHelpDisplayName(context.meta);
    return lines(
      `# ${SITE_NAME} — ${name}`,
      `# University: ${context.meta.fullName}`,
      `# Status: ${context.meta.status}`,
      `# Canonical: ${context.baseUrl}`,
      '',
      'User-agent: *',
      'Allow: /',
      '',
      `Sitemap: ${sitemapUrl}`
    );
  }

  return lines(
    `# ${SITE_NAME}`,
    `# Subdomain: ${context.displaySlug}`,
    `# Canonical: ${context.baseUrl}`,
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemapUrl}`
  );
}
