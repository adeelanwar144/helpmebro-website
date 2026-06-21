export type UniversityStatus = 'live' | 'coming_soon';

export interface UniversityTheme {
  accentColor: string | null;
  accentColorSource: string | null;
}

/** Schema for data/{shortKey}/meta.json */
export interface UniversityMeta {
  fullName: string;
  displaySlug: string;
  shortKey: string;
  status: UniversityStatus;
  /** Optional SEO/H1 override (e.g. "Ohio State University" vs "The Ohio State University"). */
  assignmentHelpName?: string | null;
  theme: UniversityTheme;
}

export const DEFAULT_UNIVERSITY_ACCENT = '#00848c';

export function getAssignmentHelpDisplayName(meta: UniversityMeta): string {
  if (meta.assignmentHelpName?.trim()) return meta.assignmentHelpName.trim();
  return meta.fullName.replace(/^The\s+/i, '').trim();
}
