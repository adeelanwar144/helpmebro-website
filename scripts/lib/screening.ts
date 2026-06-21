import type { AllCoursesRecord } from '../../lib/types';

export interface ScreeningExclusion {
  courseCode: string;
  courseTitle: string;
  department: string;
  university: string;
  triggerPhrase: string;
  pattern: string;
  confirmation: string;
}

export interface ScreeningResult {
  course: AllCoursesRecord;
  excluded: boolean;
  exclusion?: ScreeningExclusion;
}

const STUDY_ABROAD_RE =
  /\b(study abroad|study at a foreign institution|foreign study|foreign institution|international exchange|global option|education abroad|overseas study|exchange program)\b/i;

const INTERNSHIP_RE =
  /\b(internship|practicum|co-op|cooperative education|field placement|clinical placement)\b/i;

const SUPERVISED_EXPERIENCE_RE =
  /\b(directed and supervised experience|conducted under the supervision of|supervised experience|supervised by an employer|external coordinator)\b/i;

const INDIVIDUAL_STUDIES_RE =
  /\b(individual stud(y|ies)|independent study|independent research)\b/i;

/** Explicit syllabus structure in the description (for individual-studies edge case). */
const DEFINED_SYLLABUS_RE =
  /\b(syllabus|topics include|reading list|readings in|lecture|discussion section|weekly|assignments include|course covers|will cover|students will study|students will learn|students will read)\b/i;

const SU_GRADING_RE = /\b(S\/U|satisfactory\/unsatisfactory|pass\/fail|P\/F)\b/i;

/** Credit containers with no actual subject matter (BUSADM 5797 pattern). */
const CREDIT_CONTAINER_RE =
  /\b(receive ohio state credit for that work|opportunity for students to study at a foreign institution|receive (?:ohio state|osu) credit for(?: that)? work)\b/i;

/**
 * Substantive academic subject content in a catalog description.
 * Approve-by-default: lecture and survey courses qualify even without
 * literal "essay" or "exam" wording.
 */
const ACADEMIC_SUBJECT_RE =
  /\b(introduction to|introductory|survey|principles|applied to|applied|covers|covering|examines|examine|explores|explore|topics include|study of|theory|theories|methods|analysis|concepts|literature|mythology|philosophy|economics|chemistry|biology|physics|history|culture|society|political|psychology|mathematics|engineering|readings|authors|major problems|nature of|development|fundamentals|overview|perspectives|issues in|techniques|structure|function|processes|systems|design|communication|management|policy|research|scientific|humanities|social|art|music|language|writing|composition|calculus|statistics|programming|data|health|medical|clinical|legal|ethical|moral|religion|science|anthropology|archaeology|geography|geology|nutrition|education|business|finance|accounting|marketing|law|nursing|anatomy|physiology|microbiology|genetics|ecology|environment|sustainability|performance|behavior|organizational|cognitive|linguistic|translation|myth|greek|roman|western thought|major authors|gods and goddesses|meaningful life|question of whether)\b/i;

function firstMatch(text: string, re: RegExp): string | null {
  const match = text.match(re);
  return match ? match[0] : null;
}

function stripCatalogBoilerplate(description: string): string {
  return description
    .replace(/\nPrereq:.*$/is, '')
    .replace(/\nRepeatable.*$/is, '')
    .replace(/\nCoreq:.*$/is, '')
    .trim();
}

export function hasAcademicSubjectContent(description: string): boolean {
  const core = stripCatalogBoilerplate(description);
  if (!core) return false;

  if (CREDIT_CONTAINER_RE.test(core) && !ACADEMIC_SUBJECT_RE.test(core)) {
    return false;
  }

  if (ACADEMIC_SUBJECT_RE.test(core)) return true;

  // Substantive multi-clause catalog copy (e.g. CLAS survey descriptions).
  if (core.length >= 70 && /[;,]/.test(core) && core.split(/\s+/).length >= 10) {
    return true;
  }

  return false;
}

export function hasDefinedSyllabus(description: string): boolean {
  const core = stripCatalogBoilerplate(description);
  return DEFINED_SYLLABUS_RE.test(core) || hasAcademicSubjectContent(core);
}

export function assessDescriptionDepth(description: string | null): 'rich' | 'thin' {
  if (!description || !description.trim()) return 'thin';
  const trimmed = description.trim();
  const sentences = trimmed.split(/[.!?]+/).filter(Boolean);
  if (sentences.length <= 1 && trimmed.length < 120) return 'thin';
  const conceptIndicators =
    /\b(introduction to|covers|focuses|examines|explores|topics include|students will|concepts|theory|analysis|methods|principles)\b/i;
  if (trimmed.length >= 180 && conceptIndicators.test(trimmed)) return 'rich';
  if (sentences.length >= 2 && trimmed.length >= 100) return 'rich';
  return 'thin';
}

export function screenCourse(course: AllCoursesRecord): ScreeningResult {
  const description = (course.description ?? '').trim();
  const title = course.courseTitle.trim();
  const university = course.university;

  const makeExclusion = (
    pattern: string,
    triggerPhrase: string
  ): ScreeningExclusion => ({
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    department: course.department,
    university,
    triggerPhrase,
    pattern,
    confirmation: 'No assignment writing service offer will be built for this course.',
  });

  if (!description) {
    return {
      course,
      excluded: true,
      exclusion: makeExclusion(
        'Description missing or empty; no academic subject content to verify',
        '(description is null or missing)'
      ),
    };
  }

  const phrase = firstMatch(description, STUDY_ABROAD_RE);
  if (phrase) {
    return {
      course,
      excluded: true,
      exclusion: makeExclusion('Study abroad / foreign study / international exchange credit', phrase),
    };
  }

  const internPhrase = firstMatch(description, INTERNSHIP_RE);
  if (internPhrase) {
    return {
      course,
      excluded: true,
      exclusion: makeExclusion(
        'Internship / practicum / co-op (supervised external work, not written assignment assessment)',
        internPhrase
      ),
    };
  }

  if (SU_GRADING_RE.test(description) && SUPERVISED_EXPERIENCE_RE.test(description)) {
    const supervisedPhrase =
      firstMatch(description, SUPERVISED_EXPERIENCE_RE) ?? 'supervised experience';
    return {
      course,
      excluded: true,
      exclusion: makeExclusion(
        'Graded S/U course with supervised experience rather than coursework',
        supervisedPhrase
      ),
    };
  }

  const isIndividualStudies =
    INDIVIDUAL_STUDIES_RE.test(description) || INDIVIDUAL_STUDIES_RE.test(title);
  if (isIndividualStudies && !hasDefinedSyllabus(description)) {
    const individualPhrase =
      firstMatch(description, INDIVIDUAL_STUDIES_RE) ??
      firstMatch(title, INDIVIDUAL_STUDIES_RE) ??
      'Individual Studies / independent study';
    return {
      course,
      excluded: true,
      exclusion: makeExclusion(
        'Individual Studies / independent study with no defined syllabus',
        individualPhrase
      ),
    };
  }

  if (CREDIT_CONTAINER_RE.test(description) && !hasAcademicSubjectContent(description)) {
    const containerPhrase =
      firstMatch(description, CREDIT_CONTAINER_RE) ?? description.slice(0, 120);
    return {
      course,
      excluded: true,
      exclusion: makeExclusion(
        'Credit container with no academic subject content (study abroad / transfer credit arrangement only)',
        containerPhrase
      ),
    };
  }

  if (!hasAcademicSubjectContent(description)) {
    return {
      course,
      excluded: true,
      exclusion: makeExclusion(
        'Description contains no academic subject content (no topic, readings, or substantive course matter)',
        description.slice(0, 120) || '(empty or generic description)'
      ),
    };
  }

  return { course, excluded: false };
}

export function applyScreeningToCourses(courses: AllCoursesRecord[]): {
  courses: AllCoursesRecord[];
  exclusions: ScreeningExclusion[];
  approved: AllCoursesRecord[];
} {
  const { results, exclusions, approved } = screenAllCourses(courses);

  const updatedCourses = results.map(({ course, excluded, exclusion }) => {
    if (excluded && exclusion) {
      return {
        ...course,
        excluded: true as const,
        exclusionReason: exclusion.pattern,
        exclusionPhrase: exclusion.triggerPhrase,
        exclusionPattern: exclusion.pattern,
        seoContent: undefined,
      };
    }
    return {
      ...course,
      excluded: false as const,
      exclusionReason: undefined,
      exclusionPhrase: undefined,
      exclusionPattern: undefined,
    };
  });

  return { courses: updatedCourses, exclusions, approved };
}

export function screenAllCourses(courses: AllCoursesRecord[]): {
  results: ScreeningResult[];
  exclusions: ScreeningExclusion[];
  approved: AllCoursesRecord[];
} {
  const results = courses.map(screenCourse);
  const exclusions = results.filter((r) => r.excluded).map((r) => r.exclusion!);
  const approved = results.filter((r) => !r.excluded).map((r) => r.course);
  return { results, exclusions, approved };
}
