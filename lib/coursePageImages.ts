export interface CourseStudentImage {
  src: string;
  alt: string;
}

/** Self-hosted student photos under /public/images. */
export const COURSE_STUDENT_IMAGES: CourseStudentImage[] = [
  {
    src: '/images/student-1.jpg',
    alt: 'Student reading and taking notes at a desk',
  },
  {
    src: '/images/student-2.jpg',
    alt: 'Student writing an assignment on a laptop',
  },
  {
    src: '/images/student-3.jpg',
    alt: 'Student studying with textbooks and a highlighter',
  },
];

/** One unique image per slot — no repeats across hero, mid-article, and end CTA. */
export const COURSE_IMAGE_SLOTS = {
  hero: COURSE_STUDENT_IMAGES[0],
  midArticle: COURSE_STUDENT_IMAGES[1],
  beforeFinalCta: COURSE_STUDENT_IMAGES[2],
} as const satisfies Record<string, CourseStudentImage>;
