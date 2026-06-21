export const STAGE_7_EXCLUSION_RULES = `
Never invent a syllabus, specific assignment, or grading rubric for any course. General academic practice may be discussed only if explicitly labeled as general practice, never presented as this course's specific requirements.
Never invent a professor's office hours, teaching style, personality, or any detail not present in the real source data.
Never invent a testimonial, review, or student quote attributed to a real or implied real person.
Never invent a localized fact. If no localized fact was verified through web search, omit that element entirely rather than inventing one.
Never reproduce content from Course Hero, OneClass, Coursicle reviews, or any other site hosting other students' uploaded or copyrighted coursework.
Never claim or imply a credential for the credited author that is not configured as true and verifiable.
`.trim();

export const SOURCE_EXCLUSION_RULES = `
CRITICAL SOURCE EXCLUSION: Do NOT search for, cite, or draw content from Course Hero, OneClass, Coursicle reviews, or any other site hosting other students' uploaded coursework or copyrighted material. Essay mill and sample paper sites (sites offering to write essays for the reader) must also be excluded as sources, even when they surface in search results. Disregard any search result from these categories rather than summarizing or drawing from them. Use only legitimate academic or institutional sources.
`.trim();

export interface CourseGenerationContext {
  courseCode: string;
  courseTitle: string;
  department: string;
  departmentDisplayName: string;
  university: string;
  instructor: string | null;
  credits: string | null;
  sessionStart: string | null;
  sessionEnd: string | null;
  location: string | null;
  description: string | null;
  attributes: string | null;
  sourceUrl: string | null;
  descriptionDepth: 'rich' | 'thin';
  bylineText: string;
  bioUrl: string;
  lastReviewed: string;
  runningHeadings: string[];
}

export function buildGenerationUserPrompt(ctx: CourseGenerationContext): string {
  const headingsBlock =
    ctx.runningHeadings.length > 0
      ? ctx.runningHeadings.map((h, i) => `${i + 1}. ${h}`).join('\n')
      : '(none yet in this batch)';

  return `
Generate SEO course page content for the following real course record.

REAL COURSE DATA (use exactly; do not invent missing fields):
- Course code: ${ctx.courseCode}
- Course title: ${ctx.courseTitle}
- Department: ${ctx.department} (${ctx.departmentDisplayName})
- University: ${ctx.university}
- Instructor: ${ctx.instructor ?? '(not published)'}
- Credits: ${ctx.credits ?? '(not published)'}
- Session dates: ${ctx.sessionStart ?? '?'} to ${ctx.sessionEnd ?? '?'}
- Location: ${ctx.location ?? '(not published)'}
- Attributes / GE designations: ${ctx.attributes ?? '(none published)'}
- Real description (exact): ${ctx.description ?? '(null or missing)'}
- Real sourceUrl: ${ctx.sourceUrl ?? '(missing)'}
- Description depth flag: ${ctx.descriptionDepth}

STAGE 1 RESEARCH REQUIREMENTS:
1. Use web search to research the well established general academic practice for how ${ctx.departmentDisplayName} courses like this subject are typically taught and assessed. Label all such content explicitly as general practice, not this course's specific requirements.
2. Use web search to find one real, specific, localized fact about this course or department if verifiable (degree requirements, transfer credit designations, accreditation, department facts). If search is inconclusive, set localizedFact to null and omit localized content entirely. Do NOT invent a localized fact.
3. If description depth is "thin" AND web search cannot surface enough honest general academic context for a full page, set needsReview to true and needsReviewReason explaining what is missing. Do not pad with generic filler.

STAGE 2 KEYWORD RESEARCH (produce BEFORE writing page body):
Generate a keyword list in this exact category order. Every keyword must appear at least once in the final page body:
1. LSI / semantic commercial intent terms for this specific subject (not generic essay help)
2. Primary commercial target from real course code and university
3. Specific commercial long tail tied to a real named pain point for this subject (from your research)
4. Natural language question based long tail
5. Entity and real attribute terms from the course data fields above

STAGE 3 PAGE STRUCTURE (exact order):
1. h1: course code and title at ${ctx.university}, framed as assignment help
2. byline: use EXACTLY this text: "${ctx.bylineText}"
3. First H2: immediately commercial, natural student question about help with this exact course. First sentence = direct answer.
4. Second H2: named pain point from keyword category 3. Direct answer first.
5. Third H2: what the service specifically checks or does for this course (concrete, specific).
6. Fourth H2 onward: course information (coverage, scheduling, prerequisites, GE info, honors comparison if applicable). Commercial sections come first.
7. Final H2: official source link with real sourceUrl and last verified date ${ctx.lastReviewed}.

HEADING UNIQUENESS: Do not reuse any heading pattern from this list. If your planned heading matches one of these with the course code and subject name removed, rewrite it using this course's actual subject matter:
${headingsBlock}

Every heading must be phrased as a natural question. Every section body's first sentence must be the direct answer before any context.

STAGE 4 WRITING RULES:
- Minimum 1500 words in page body (all section bodies combined, not meta fields)
- No dashes or hyphens of any kind in body copy (no hyphen, en dash, or em dash characters)
- Active voice throughout
- Every keyword from Stage 2 must appear at least once
- Natural readable sentences; restructure rather than keyword stuffing

Return ONLY valid JSON with this exact shape (no markdown outside the JSON):
{
  "needsReview": false,
  "needsReviewReason": "",
  "metaTitle": "...",
  "metaDescription": "...",
  "h1": "...",
  "byline": "${ctx.bylineText}",
  "sections": [{ "heading": "...", "body": "..." }],
  "keywords": ["...", "..."]
}
`.trim();
}

export function buildParseRetryUserPrompt(
  ctx: CourseGenerationContext,
  previousRawText: string,
  failureDetails: string
): string {
  const excerpt = previousRawText.length > 60_000
    ? `${previousRawText.slice(0, 60_000)}\n...[truncated]`
    : previousRawText;

  return `
Your previous response for ${ctx.courseCode} could not be parsed as valid JSON.

PARSE / FORMAT ERRORS:
${failureDetails}

PREVIOUS RAW RESPONSE (fix and return as valid JSON only):
${excerpt || '(empty — generate fresh JSON from scratch using the original course requirements)'}

Return ONLY a single valid JSON object in the exact shape required. No markdown fences, no commentary, no research notes before or after the JSON. Escape all special characters inside JSON string values. Include all required sections and keywords.
`.trim();
}

export function buildRevisionUserPrompt(
  ctx: CourseGenerationContext,
  previousJson: string,
  failureDetails: string
): string {
  return `
The previous JSON output for ${ctx.courseCode} failed verification. Revise ONLY what is needed to pass the failed checks while preserving everything that already passed.

FAILED CHECKS:
${failureDetails}

PREVIOUS OUTPUT:
${previousJson}

Re run the same requirements from the original prompt. Return ONLY valid JSON in the same shape as before.
`.trim();
}

export function buildSystemPrompt(instructionFileText: string): string {
  return `${instructionFileText}

${SOURCE_EXCLUSION_RULES}

STAGE 7 EXCLUSION RULES (apply without exception):
${STAGE_7_EXCLUSION_RULES}

You must use web search for academic context and localized facts. Every response for content generation must follow the JSON output format requested in the user message.`;
}
