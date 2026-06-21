export const INDEX_URL =
  'https://raw.githubusercontent.com/adeelanwar144/university-course-data/main/data/index.json';

/** Verified nested index (before scraper bot overwrote main with summary-only JSON) */
export const NESTED_INDEX_FALLBACK_URL =
  'https://raw.githubusercontent.com/adeelanwar144/university-course-data/10804bf03a7756419fa2837a41510be1c1e25f8e/data/index.json';

export const DATA_BASE_URL =
  'https://raw.githubusercontent.com/adeelanwar144/university-course-data/main/data';

export interface CourseSeoSection {
  heading: string;
  body: string;
}

export interface CourseSeoContent {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  byline: string;
  bioUrl?: string;
  sections: CourseSeoSection[];
  keywords: string[];
  lastReviewed: string;
  generationAttempts: number;
}

export interface Course {
  department: string;
  courseCode: string;
  courseTitle: string;
  section: string | null;
  crn: string | null;
  session: string | null;
  sessionStart: string | null;
  sessionEnd: string | null;
  location: string | null;
  meetingDays: string | null;
  meetingTime: string | null;
  instructionMode: string | null;
  instructor: string | null;
  credits: string | null;
  description: string | null;
  attributes: string | null;
  sourceUrl: string | null;
}

export interface UniqueCourse {
  courseCode: string;
  courseTitle: string;
  department: string;
  slug: string;
  sections: Course[];
  seoContent?: CourseSeoContent;
  excluded?: boolean;
  exclusionReason?: string;
}

export interface AllCoursesRecord {
  courseCode: string;
  courseTitle: string;
  department: string;
  departmentSlug: string;
  departmentDisplayName?: string;
  university: string;
  instructor?: string | null;
  credits?: string | null;
  session?: string | null;
  sessionStart?: string | null;
  sessionEnd?: string | null;
  location?: string | null;
  meetingDays?: string | null;
  meetingTime?: string | null;
  instructionMode?: string | null;
  attributes?: string | null;
  description: string | null;
  sourceUrl: string | null;
  excluded?: boolean;
  exclusionReason?: string;
  exclusionPhrase?: string;
  exclusionPattern?: string;
  seoContent?: CourseSeoContent;
}

export interface AllCoursesFile {
  university: string;
  universitySlug: string;
  term: string;
  location?: string;
  generatedAt?: string;
  screeningApprovedAt?: string;
  courses: AllCoursesRecord[];
}

export interface Department {
  name: string;
  displayName?: string;
  slug?: string;
  count: number;
  sectionCount?: number;
  uniqueCourseCount?: number;
  uniqueCourses?: UniqueCourse[];
  isThinDepartment?: boolean;
  courses: Course[];
}

export interface UniversityIndex {
  university: string;
  location: string;
  term: string;
  totalCourses: number;
  departments: Department[];
}

export interface DataIndex {
  generatedAt?: string;
  accuracyPolicy?: string;
  schemaNote?: string;
  universities: UniversityIndex[];
  totalCourses?: number;
  totalUniversities?: number;
}

export interface UniversityData extends UniversityIndex {
  slug: string;
  courses: Course[];
  totalSections?: number;
  totalUniqueCourses?: number;
  totalDepartments?: number;
}

export interface SiteStats {
  totalSections: number;
  totalUniqueCourses: number;
  totalDepartments: number;
  totalUniversities: number;
}

export interface SiteData {
  universities: UniversityData[];
  stats: SiteStats;
  searchableCourses: SearchableCourse[];
}

export interface SearchableCourse {
  courseCode: string;
  courseTitle: string;
  university: string;
  universitySlug: string;
  departmentSlug: string;
  courseSlug: string;
  href: string;
}

export interface UniversitySummaryFile {
  id: string;
  fullName: string;
  city: string;
  term: string;
  totalCourses: number;
  departments: { name: string; count: number }[];
}

export interface DepartmentFileRaw {
  department?: string;
  courses?: Record<string, unknown>[];
  count?: number;
}
