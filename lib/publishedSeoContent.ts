import 'server-only';

import type { AllCoursesRecord, CourseSeoContent } from './types';
import {
  SITE_SEO_CONTENT_BASE_URL,
  SITE_SEO_CONTENT_CDN_BASE_URL,
} from './types';
import { getBundledAllCoursesFile } from './bundledAllCourses';

interface SeoChunkFile {
  universitySlug: string;
  departmentSlug: string;
  courses: Pick<AllCoursesRecord, 'courseCode' | 'seoContent' | 'excluded'>[];
}

const chunkCache = new Map<string, Promise<SeoChunkFile | null>>();

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function fetchSeoChunk(
  universitySlug: string,
  departmentSlug: string
): Promise<SeoChunkFile | null> {
  const key = `${universitySlug}:${departmentSlug}`;
  const cached = chunkCache.get(key);
  if (cached) return cached;

  const request = (async () => {
    const urls = [
      `${SITE_SEO_CONTENT_CDN_BASE_URL}/${universitySlug}/seo/${departmentSlug}.json`,
      `${SITE_SEO_CONTENT_BASE_URL}/${universitySlug}/seo/${departmentSlug}.json`,
      `https://cdn.jsdelivr.net/gh/adeelanwar144/helpmebro-website@main/public/data/${universitySlug}/seo/${departmentSlug}.json`,
    ];

    for (const url of urls) {
      const chunk = await fetchJson<SeoChunkFile>(url);
      if (chunk?.courses?.length) return chunk;
    }
    return null;
  })();

  chunkCache.set(key, request);
  return request;
}

export async function fetchCourseSeoContent(
  universitySlug: string,
  departmentSlug: string,
  courseCode: string
): Promise<CourseSeoContent | undefined> {
  const chunk = await fetchSeoChunk(universitySlug, departmentSlug);
  const code = courseCode.trim();

  if (chunk) {
    const fromChunk = chunk.courses.find((course) => course.courseCode.trim() === code)?.seoContent;
    if (fromChunk) return fromChunk;
  }

  const bundled = getBundledAllCoursesFile(universitySlug);
  return bundled?.courses.find((course) => course.courseCode.trim() === code)?.seoContent;
}
