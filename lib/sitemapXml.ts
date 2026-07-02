import type { MetadataRoute } from 'next';

type SitemapEntry = MetadataRoute.Sitemap[number];

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function renderUrlSet(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const parts = [`<loc>${escapeXml(entry.url)}</loc>`];
      if (entry.lastModified) {
        parts.push(`<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`);
      }
      if (entry.changeFrequency) {
        parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
      }
      if (entry.priority != null) {
        parts.push(`<priority>${entry.priority}</priority>`);
      }
      return `<url>${parts.join('')}</url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function renderSitemapIndex(sitemapUrls: string[], lastModified = new Date()): string {
  const iso = lastModified.toISOString();
  const entries = sitemapUrls
    .map((url) => `<sitemap><loc>${escapeXml(url)}</loc><lastmod>${iso}</lastmod></sitemap>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
