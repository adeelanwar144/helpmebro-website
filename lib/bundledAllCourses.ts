import type { AllCoursesFile, AllCoursesRecord } from './types';
import fordhamAllCourses from '@/data/fordham/all-courses.json';

// Ohio State SEO lives in repo/CDN dept chunks (~18KB each) and is fetched at runtime.
// Do not statically import data/ohio-state/all-courses.json — it exceeds Cloudflare Workers' 1 MiB bundle limit.
const BUNDLED_BY_SLUG: Record<string, AllCoursesFile> = {
  fordham: fordhamAllCourses as AllCoursesFile,
};

export function getBundledAllCoursesFile(universitySlug: string): AllCoursesFile | null {
  return BUNDLED_BY_SLUG[universitySlug] ?? null;
}

/** Merge remote and repo-bundled course records; later sources win for seoContent. */
export function mergeAllCoursesFiles(
  ...files: (AllCoursesFile | null | undefined)[]
): AllCoursesFile | null {
  const byCode = new Map<string, AllCoursesRecord>();

  for (const file of files) {
    if (!file?.courses?.length) continue;
    for (const course of file.courses) {
      const code = course.courseCode.trim();
      const prev = byCode.get(code);
      byCode.set(code, {
        ...prev,
        ...course,
        seoContent: course.seoContent ?? prev?.seoContent,
        excluded: course.excluded ?? prev?.excluded,
      });
    }
  }

  if (byCode.size === 0) return null;

  const template = files.find((f) => f?.universitySlug || f?.university);
  return {
    university: template?.university ?? '',
    universitySlug: template?.universitySlug ?? '',
    term: template?.term ?? '',
    location: template?.location ?? '',
    courses: Array.from(byCode.values()),
  };
}
