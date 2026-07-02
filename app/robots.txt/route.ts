import { headers } from 'next/headers';
import { buildRobotsTxt } from '@/lib/robotsTxt';
import { getEffectiveRequestHost } from '@/lib/routing';
import { resolveSiteContext } from '@/lib/siteContext';
import { plainTextResponse } from '@/lib/textRoute';

export const runtime = 'edge';

export async function GET(): Promise<Response> {
  const requestHeaders = headers();
  const host = getEffectiveRequestHost((name) => requestHeaders.get(name));
  const context = resolveSiteContext(host);
  return plainTextResponse(buildRobotsTxt(context));
}
