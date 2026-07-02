import { buildApexMainSitemapEntries } from '@/lib/sitemapEntries';
import { renderUrlSet, xmlResponse } from '@/lib/sitemapXml';

export const runtime = 'edge';

export async function GET(): Promise<Response> {
  return xmlResponse(renderUrlSet(buildApexMainSitemapEntries()));
}
