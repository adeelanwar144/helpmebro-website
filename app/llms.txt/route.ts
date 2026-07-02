import { headers } from 'next/headers';
import { buildLlmsTxt } from '@/lib/llmsTxt';
import { getEffectiveRequestHost } from '@/lib/routing';
import { resolveSiteContext } from '@/lib/siteContext';
import { plainTextResponse } from '@/lib/textRoute';

export const runtime = 'edge';

export async function GET(): Promise<Response> {
  const requestHeaders = headers();
  const host = getEffectiveRequestHost((name) => requestHeaders.get(name));
  const context = resolveSiteContext(host);
  const body = await buildLlmsTxt(context);
  return plainTextResponse(body);
}
