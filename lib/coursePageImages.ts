export interface CourseStudentImage {
  src: string;
  alt: string;
}

/** Placeholder paths — swap in real Unsplash/Pexels assets at these paths. */
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
    src: '/images/student-studying.jpg',
    alt: 'Student studying with textbooks and a highlighter',
  },
  {
    src: '/images/student-laptop.jpg',
    alt: 'Student working on coursework using a laptop',
  },
];

/** Fixed slots — mid and end slots reuse earlier images where noted. */
export const COURSE_IMAGE_SLOTS = {
  hero: COURSE_STUDENT_IMAGES[0],
  midArticle: COURSE_STUDENT_IMAGES[1],
  /** Reuses the hero image near the final CTA. */
  beforeFinalCta: COURSE_STUDENT_IMAGES[0],
} as const satisfies Record<string, CourseStudentImage>;
