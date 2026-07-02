import type { Metadata } from 'next';
import type { HubPage } from './hubTypes';
import { Course, CourseSeoContent } from './types';
import { canonicalUniversityUrl } from './routing';
import { hubCanonicalUrl } from './hubPages';
import { getUniversityAssignmentHelpName } from './universities';
import { SITE_NAME } from './site';

export function withCanonical(metadata: Metadata, canonicalUrl: string): Metadata {
  return {
    ...metadata,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export function generateCourseMetadata(
  course: Course,
  universityName: string,
  uniSlug: string,
  deptSlug: string,
  courseSlug: string,
  seoContent?: CourseSeoContent
): Metadata {
  const title = seoContent?.metaTitle ?? `${course.courseCode} — ${universityName}`;
  const description =
    seoContent?.metaDescription ??
    `${course.courseTitle} at ${universityName}. Verified Summer 2026 catalog data.`;

  return withCanonical(
    {
      title,
      description,
      openGraph: { title, description, type: 'website' },
    },
    canonicalUniversityUrl(uniSlug, `/${deptSlug}/${courseSlug}`)
  );
}

export function generateDepartmentMetadata(
  dept: string,
  universityName: string,
  uniSlug: string,
  deptSlug: string
): Metadata {
  const title = `${dept} — ${universityName}`;
  const description = `${dept} courses at ${universityName}. Summer 2026 catalog.`;

  return withCanonical(
    {
      title,
      description,
      openGraph: { title, description, type: 'website' },
    },
    canonicalUniversityUrl(uniSlug, `/${deptSlug}`)
  );
}

export function generateUniversityMetadata(
  universityName: string,
  uniqueCourseCount: number,
  departmentCount: number,
  uniSlug: string
): Metadata {
  const displayName = getUniversityAssignmentHelpName(uniSlug, universityName);
  const title = `${displayName} Assignment Help`;
  const description = `${uniqueCourseCount} courses across ${departmentCount} departments at ${displayName}. Verified Summer 2026 data.`;

  return withCanonical(
    {
      title,
      description,
      openGraph: { title, description, type: 'website' },
    },
    canonicalUniversityUrl(uniSlug, '/')
  );
}

export function generateHubMetadata(page: HubPage): Metadata {
  const url = hubCanonicalUrl(page.slug);
  const title = page.metaTitle;
  const description = page.metaDescription;

  return {
    title,
    description,
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
