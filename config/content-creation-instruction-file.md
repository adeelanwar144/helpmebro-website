# Content Creation Instruction File
## Assignment Help Service Course Pages — Full Build Specification

This file is the single source of truth for generating content across all
remaining courses (250+) following the PHILOS 1100 template established
and approved in this project. Apply every rule below to every course,
in every batch, with no exceptions made silently.

---

## STAGE 0: SCREENING PASS (mandatory, before any content is written)

Before generating content for any course, run a screening pass across
the full course list and produce a written list of exclusions for human
review. Do not generate content for any excluded course until the
exclusion list has been explicitly approved.

**Exclude a course if it matches any of the following patterns** (this
list was derived from the real BUSADM 5797 case, where the course was a
study abroad credit container with no actual coursework):

- Study abroad / foreign study / international exchange credit courses
  (no fixed syllabus, no assignment, work evaluated by an external
  institution, not by Ohio State or the home university)
- Internship, practicum, or co-op courses (work is supervised by an
  employer or external coordinator, not assessed via written assignment)
- Courses graded only S/U with descriptions indicating supervised
  experience rather than coursework (e.g. "directed and supervised
  experience," "conducted under the supervision of")
- "Individual Studies" or independent study courses with no defined
  syllabus (credit is for self directed work arranged with a specific
  faculty member, not a standard assignment)
- Any course where the real description field contains no indication of
  written assignments, essays, exams, or graded academic work product

**For each excluded course, the screening output must state:**
- Course code and title
- Department and university
- The exact phrase or pattern in the real description that triggered
  exclusion
- Confirmation that no assignment writing service offer will be built
  for this course

**Do not guess at exclusions from course titles alone.** Check the
actual description field. A course titled "Internship" with a real
description naming graded coursework would not be excluded; a course
titled generically that turns out to be an internship by description
would be.

After the screening list is approved, proceed to Stage 1 only for the
courses that remain.

---

## STAGE 1: DATA VERIFICATION (per course, before writing)

For every course that passes screening, before writing any content:

1. Confirm the real, sourced data available for this course: course
   code, title, instructor, credits, session dates, location, the real
   description text exactly as it appears in the source data, and the
   real sourceUrl.
2. Check the description field's actual depth. Some courses (Fordham,
   many OSU catalog entries) have full paragraph descriptions naming
   specific concepts. Some (Columbia, several OSU single course
   departments) have description: null or a single generic sentence.
   This determines how much real, honest concept breakdown content is
   possible. Do not write content implying a richer description than
   what actually exists.
3. Research the subject area's general, well established academic
   practice for how this type of course is typically assessed (the way
   PHILOS 1100's validity versus truth distinction was confirmed through
   general philosophy pedagogy research, not invented). This research
   must be:
   - General and field wide, never claimed as specific to this
     instructor's unpublished rubric
   - Sourced from legitimate academic or institutional material, never
     from Course Hero, OneClass, Coursicle reviews, or any other
     site hosting other students' uploaded coursework or copyrighted
     materials
   - Explicitly labeled in the content as general practice, not this
     course's specific requirements, wherever it appears
4. Research one real, specific, localized fact about the course or
   department if one exists and can be verified (the way the Fisher
   College Global Option detail was found for BUSADM 5797, or the GE
   transfer credit attributes were used for PHILOS 1100). Real degree
   program requirements, transfer credit designations, accreditation
   details, or department specific facts all qualify. Do not invent a
   localized detail if a real one cannot be found; omit this element for
   that course rather than fabricating one.
5. If a course's real description and any genuinely available general
   academic context together cannot honestly support a full page at the
   target depth, flag this course explicitly for review rather than
   padding the page with generic filler to hit a word count. State
   specifically what is missing.

---

## STAGE 2: KEYWORD RESEARCH (per course)

For every course, produce a keyword list in this exact category order,
commercial intent first:

**1. LSI / semantic commercial intent terms.** These are largely
constant across courses within the same subject area (philosophy essay
writing help, philosophy assignment help online, pay someone to write my
philosophy essay, and so on) but must be adapted to the actual subject
of each course (chemistry lab report help, financial accounting
assignment help, computer science project help, and equivalents,
matched to the real subject matter of each specific course).

**2. Primary commercial target, course specific.** Built from the real
course code and university (e.g. cisc 1600 fordham assignment help).

**3. Specific commercial long tail tied to a real, named pain point for
this subject.** This is the most important category and the one most
likely to be skipped under time pressure. Do not default to generic
essay help language for every course. Identify the actual, well known
difficulty specific to this subject the way the validity versus grade
gap was identified for philosophy. Examples of what this looks like for
other subjects, to be researched and confirmed per subject rather than
assumed:
- Introductory accounting: the gap between calculating a number
  correctly and explaining why a transaction affects the accounting
  equation the way it does
- Introductory computer science: the gap between code that runs and
  code that meets a specific assignment rubric for style, efficiency, or
  edge case handling
- Introductory biology lab courses: the gap between performing a lab
  procedure and writing it up using the required scientific format
This category requires genuine subject specific research per course or
per course cluster, not a single template applied everywhere.

**4. Natural language, question based long tail (informational, feeding
the commercial page).**

**5. Entity and real attribute terms** pulled directly from the course's
own data fields (GE designations, transfer credit codes, prerequisite
chains, department names), never generic.

---

## STAGE 3: PAGE STRUCTURE (mandatory format, applies to every course)

Every course page must follow this exact structural order. This order
was corrected once already in this project after review caught
sections answering questions only after a paragraph of context; do not
reintroduce that error.

1. **H1**: Course code and title at this university, framed as
   assignment help, e.g. "[CODE] at [University]: [Subject] Essay/
   Assignment Help"
2. **Byline**: Written and reviewed by [real author name], [real,
   verifiable credentials]. Do not publish without a real name and real,
   verifiable credentials. See Stage 5 below.
3. **First H2, immediately commercial**: phrased as a natural question a
   student would ask when looking for help with this exact course
   (e.g. "Where can I get help with my [course] assignment?"). The
   first sentence under this heading must be the direct answer. Context,
   keyword phrases, and elaboration follow after the direct answer, never
   before it.
4. **Second H2, the named pain point**: the specific, subject relevant
   difficulty identified in Stage 2 category 3. Direct answer first,
   sentence one, every time.
5. **Third H2, what the service specifically checks or does for this
   course**: concrete, numbered or listed specifics, not generic
   service language.
6. **Fourth H2 onward, course information sections**: what the course
   covers, scheduling and session details, prerequisite or general
   education information, comparison to honors or alternate sections if
   one exists. These come after the commercial sections, never before.
7. **Final H2, official source link**: link to the real, verified
   sourceUrl for this course, with a last verified date.

**Every single heading, with no exceptions, must be phrased as a
question a real person would naturally ask**, including commercial
headings. A heading that states a service offer as a declarative
sentence is not acceptable; rephrase it as the question a student would
type before they find that offer.

**Every heading must be unique across the entire site, not merely
unique by course code.** Inserting the course code into an otherwise
identical template sentence does not satisfy this requirement. A
pattern such as "Where can I get help writing my [code] essay?"
repeated across many pages with only the code swapped is itself a
templated, scaled content pattern, even though each individual string
technically differs. Before finalizing any page, check its headings
against the headings already published on other pages in the same
batch, and rewrite any heading whose underlying question, with the
course code and subject name removed, matches a heading already in use
elsewhere. The fix is to draw the unique phrasing from the actual
subject matter of the course, not from the code, the university name,
or generic service language alone. Run this check across the full
batch before considering any batch complete, not only within a single
page; this defect was caught only after six pages had already been
written using the same underlying heading template.

**Every answer must lead with the direct answer in the first sentence
of the section, before any context, restated question, search phrase
example, or elaboration.** This was a real defect caught and fixed in
the PHILOS 1100 draft; verify this section by section before
considering any page final.

---

## STAGE 4: WRITING RULES (mandatory, mechanically checked, not just attempted)

- **Minimum 1500 words per page**, the actual page body, not including
  any internal notes, research sections, or planning material.
- **No dashes or hyphens of any kind**, anywhere in the body copy. This
  includes em dashes, en dashes, and standard hyphens. Compound terms
  that would normally use a hyphen must be rewritten or written as two
  separate words.
- **Active voice throughout.** Avoid constructions where the subject is
  acted upon rather than acting. Reread every paragraph specifically
  checking for this; do not assume a first draft satisfies it.
- **Every keyword and key phrase identified in Stage 2 must appear at
  least once, as close to the exact phrase as natural sentence
  construction allows.** This must be checked by literally searching the
  finished text for each phrase, not assumed from memory of having
  included it.
- **Grammatically correct, natural sentence flow.** Keyword inclusion
  must never come at the cost of a sentence reading as obviously
  keyword stuffed; if a phrase cannot be worked in naturally, restructure
  the surrounding sentence rather than forcing it.

---

## STAGE 5: AUTHOR ATTRIBUTION (sitewide requirement, applies to every page)

Every page must credit a real author: Muhammad Ahsan (Sheikh), PhD
Scholar at the University of Sydney, with over 12 years of experience
helping students achieve excellent results in philosophy and humanities
coursework, as established for the PHILOS 1100 template.

If this same byline is used across subjects outside philosophy and
humanities (engineering, business, biological sciences, and so on), the
credential description must remain accurate to what is actually true of
this person. Do not silently expand a humanities specific credential
claim to cover unrelated technical subjects without confirming it is
still an accurate description. If a different real author with relevant
credentials should be credited for a different subject area, that
must be decided explicitly, not defaulted automatically.

This page's author bio must link to a real bio page. The bio page
itself must not overstate anything beyond what is true and verifiable.

---

## STAGE 6: GOOGLE QUALITY REQUIREMENTS (sitewide, checked per batch, not per page)

These were established from Google's current Quality Rater Guidelines
and helpful content documentation and apply across the whole site, not
as individual page content:

- A substantive About page explaining who writes the content, what
  expertise backs it, and how quality is checked. Boilerplate is not
  sufficient.
- Source transparency maintained on every factual course claim, with a
  working link to the real sourceUrl on every page, no exceptions.
- A visible process for human review of generated content before
  publish. A "last reviewed" date displayed per page is the minimum bar.
- Real contact information, a clear revision or support policy, and
  basic site trust signals (secure forms, no deceptive design patterns)
  must exist sitewide, since these gate whether any individual page's
  content quality work pays off in ranking.

---

## STAGE 7: EXCLUSION RULES (no fabrication, restated explicitly)

These rules apply without exception to every course, in every batch:

- Never invent a syllabus, specific assignment, or grading rubric for
  any course. If a course's real source has no such information, the
  page may discuss general, well known academic practice for that
  subject, explicitly labeled as general practice, never presented as
  this specific course's actual requirements.
- Never invent a professor's office hours, teaching style, personality,
  or any detail not present in the real source data.
- Never invent a testimonial, review, or student quote attributed to a
  real or implied real person.
- Never invent a localized fact (a department detail, a program
  requirement, an accreditation claim) that cannot be verified through
  real research. Omit the element rather than fabricate it.
- Never reproduce content from Course Hero, OneClass, Coursicle reviews,
  or any other site hosting other students' uploaded or copyrighted
  coursework.
- Never claim or imply a credential for the credited author that is not
  true and verifiable.

---

## STAGE 8: BATCH PROCESS

Work proceeds one university at a time, in this order: Fordham,
Columbia, UConn, ASU, Ohio State, given Ohio State's size and the high
proportion of single course departments requiring individual attention
within it.

For each university:

1. Run and submit the Stage 0 screening list for that university for
   approval before writing anything.
2. Once approved, generate Stage 1 through Stage 2 research notes for
   every remaining course in that university, batched for review before
   full page writing begins, so subject specific pain points and source
   depth issues are caught before 30 or more full pages are written
   against a flawed premise.
3. Write full pages following Stage 3 and Stage 4 for the approved
   course set.
4. Run the full mechanical check on every page before considering the
   batch complete: word count at or above 1500, zero dash or hyphen
   characters, every keyword present, answer first structure confirmed
   section by section. Do not rely on a single pass; verify after any
   edit that touches existing content, since a correction in one place
   can silently break a requirement met elsewhere.
5. Present the completed, verified batch for review before moving to
   the next university.

Do not attempt all five universities in a single uninterrupted pass.
The realistic effort per page, including research, writing, structural
correction, and verification, means a full 250 plus course batch
without checkpoints risks the same quality drift this instruction file
exists to prevent.
