import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveUniversityKeyFromSubdomain } from '@/lib/universities';

function extractHostSubdomain(host: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();

  // e.g. ohio-state-university-assignment-help.localhost
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace(/\.localhost$/, '');
    return sub && sub !== 'localhost' ? sub : null;
  }

  const parts = hostname.split('.');
  // e.g. ohio-state-university-assignment-help.helpmebro.com
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0];
  }

  // e.g. fordham.localhost (single-label dev host without .localhost suffix)
  if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'localhost') {
    return parts[0];
  }

  return null;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostSubdomain = extractHostSubdomain(host);

  if (!hostSubdomain) {
    return NextResponse.next();
  }

  const uniKey = resolveUniversityKeyFromSubdomain(hostSubdomain);
  if (!uniKey) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.searchParams.set('uni', uniKey);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
