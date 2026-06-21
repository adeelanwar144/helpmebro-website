#!/usr/bin/env npx tsx
/**
 * Standalone Claude API course content generation script.
 * Usage:
 *   npx tsx scripts/generate-course-content.ts --university=fordham
 *   npx tsx scripts/generate-course-content.ts --university=ohio-state --approved
 *   npx tsx scripts/generate-course-content.ts --university=ohio-state --department=philos --approved --skip-departments=PHILOS
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuthorBylineForDepartment } from '../lib/authorConfig';
import { loadPhilosHeadingList, loadPhilosSeoContentMap } from '../lib/philosSeoOverlay';
import { allCoursesPath, saveAllCoursesFile } from '../lib/seoContentLoader';
import type { AllCoursesFile, AllCoursesRecord, CourseSeoContent } from '../lib/types';
import {
  ClaudeContentClient,
  CONTENT_GENERATION_MODEL,
  getApiUsageRecords,
  payloadToJson,
  parseGeneratedContentText,
  resetApiUsage,
  summarizeApiUsageCost,
  type GeneratedContentPayload,
} from './lib/claudeClient';
import {
  appendJsonArrayOutput,
  departmentMatchesFilter,
  fetchUniversityFromIndex,
  isSkippedDepartment,
  mergeExistingCourseData,
  writeJsonOutput,
} from './lib/dataLoader';
import {
  buildGenerationUserPrompt,
  buildParseRetryUserPrompt,
  buildRevisionUserPrompt,
  buildSystemPrompt,
  type CourseGenerationContext,
} from './lib/prompts';
import { assessDescriptionDepth, applyScreeningToCourses, screenAllCourses } from './lib/screening';
import {
  formatFailuresForRetry,
  MIN_BODY_WORD_COUNT,
  registerHeadingPatterns,
  sanitizeDashesInSeoContent,
  verifySeoContent,
} from './lib/verification';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const INSTRUCTION_FILE_PATH = path.join(
  process.cwd(),
  'config',
  'content-creation-instruction-file.md'
);

const INSTRUCTION_FILE_TEXT = fs.readFileSync(INSTRUCTION_FILE_PATH, 'utf8');

interface CliArgs {
  university: string | null;
  department: string | null;
  course: string | null;
  approved: boolean;
  skipDepartments: string[];
  limit: number | null;
  batchMonitor: boolean;
}

export interface BatchMonitorState {
  coursesCompleted: number;
  cumulativeCostUsd: number;
  consecutiveVerificationFailures: number;
  fourAttemptCourses: string[];
  needsReview: Array<{ department: string; courseCode: string; reason?: string }>;
  failedVerification: Array<{ department: string; courseCode: string; failures?: string[] }>;
}

export interface BatchMonitorOptions {
  enabled: boolean;
  costCapUsd: number;
  progressInterval: number;
  consecutiveFailureLimit: number;
  state: BatchMonitorState;
}

export interface RunGenerationResult {
  stoppedEarly: boolean;
  stopReason?: 'cost_cap' | 'consecutive_failures';
}

interface GenerationLogEntry {
  courseCode: string;
  courseTitle: string;
  department: string;
  status: 'passed' | 'failed' | 'needs_review' | 'skipped' | 'excluded';
  attempts: number;
  reason?: string;
  failures?: string[];
}

export type { CliArgs };

function parseArgs(argv: string[]): CliArgs {
  let university: string | null = null;
  let department: string | null = null;
  let course: string | null = null;
  let approved = false;
  let skipDepartments: string[] = [];
  let limit: number | null = null;
  let batchMonitor = false;

  for (const arg of argv) {
    if (arg.startsWith('--university=')) {
      university = arg.split('=')[1]?.trim() ?? null;
    } else if (arg.startsWith('--department=')) {
      department = arg.split('=')[1]?.trim() ?? null;
    } else if (arg.startsWith('--course=')) {
      course = arg.split('=')[1]?.trim() ?? null;
    } else if (arg === '--approved') {
      approved = true;
    } else if (arg.startsWith('--skip-departments=')) {
      skipDepartments = (arg.split('=')[1] ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--limit=')) {
      const n = Number(arg.split('=')[1]);
      if (!Number.isNaN(n) && n > 0) limit = n;
    } else if (arg === '--batch-monitor') {
      batchMonitor = true;
    }
  }

  return { university, department, course, approved, skipDepartments, limit, batchMonitor };
}

function courseMatchesGenerationFilter(course: AllCoursesRecord, args: CliArgs): boolean {
  if (args.course && course.courseCode.trim() !== args.course.trim()) return false;
  if (args.department && !departmentMatchesFilter(course, args.department)) return false;
  return Boolean(args.course || args.department);
}

function isGenerationTarget(course: AllCoursesRecord, args: CliArgs): boolean {
  if (args.course || args.department) {
    return courseMatchesGenerationFilter(course, args);
  }
  return true;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function confirmEnvSetup(): void {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignore.includes('.env*.local') && !gitignore.includes('.env.local')) {
    console.warn('Warning: .env.local may not be gitignored. Confirm .gitignore includes .env*.local');
  } else {
    console.log('Confirmed: .env.local is gitignored.');
  }
}

function printSitewideReminder(): void {
  console.log('\n--- Stage 6: Outstanding sitewide requirements ---');
  console.log('• Substantive About page explaining who writes content and how quality is checked');
  console.log('• Source transparency: every page includes working real sourceUrl (enforced per page)');
  console.log('• Visible "last reviewed" date per page (auto populated at generation time)');
  console.log('• Real contact information and clear revision/support policy on the site');
  console.log('------------------------------------------------\n');
}

async function runScreening(universitySlug: string, allCourses: AllCoursesFile): Promise<boolean> {
  const { courses, exclusions, approved } = applyScreeningToCourses(allCourses.courses);
  allCourses.courses = courses;
  saveAllCoursesFile(universitySlug, allCourses);

  const report = {
    university: universitySlug,
    universityName: allCourses.university,
    generatedAt: new Date().toISOString(),
    totalCourses: allCourses.courses.length,
    excludedCount: exclusions.length,
    approvedCount: approved.length,
    exclusions,
    approvedCourses: approved.map((c) => ({
      courseCode: c.courseCode,
      courseTitle: c.courseTitle,
      department: c.department,
    })),
  };

  const reportPath = writeJsonOutput(`screening-report-${universitySlug}.json`, report);
  console.log(`Screening complete: ${exclusions.length} excluded, ${approved.length} approved.`);
  console.log(`Screening report written to ${reportPath}`);
  console.log('\nReview the screening report before generation.');
  console.log('Re-run with --approved after human review to proceed.\n');
  return false;
}

function getSubjectTerms(course: AllCoursesRecord): string[] {
  return [
    course.department,
    course.departmentDisplayName ?? '',
    course.courseTitle,
    course.university,
  ].filter(Boolean);
}

async function generateForCourse(
  course: AllCoursesRecord,
  ctxBase: Omit<CourseGenerationContext, 'runningHeadings'>,
  runningHeadings: string[],
  runningPatterns: Set<string>,
  claude: ClaudeContentClient,
  systemPrompt: string,
  bioUrl: string
): Promise<{
  status: 'passed' | 'failed' | 'needs_review';
  seoContent?: CourseSeoContent;
  attempts: number;
  reason?: string;
  failures?: string[];
}> {
  const logLabel = course.courseCode;
  const ctx: CourseGenerationContext = {
    ...ctxBase,
    runningHeadings,
  };

  let attempts = 0;
  let payload: GeneratedContentPayload | null = null;
  let lastJson = '';
  let lastRawText = '';
  let lastFailures: { check: string; detail: string }[] = [];

  while (attempts < 4) {
    attempts += 1;
    console.log(`  [${logLabel}] generation attempt ${attempts}/4...`);
    const isParseRetry =
      attempts > 1 && lastFailures.some((f) => f.check === 'api_or_parse');
    const userPrompt =
      attempts === 1
        ? buildGenerationUserPrompt(ctx)
        : isParseRetry && attempts >= 3
          ? `${buildGenerationUserPrompt(ctx)}\n\nCRITICAL: Previous ${attempts - 1} attempt(s) failed JSON parsing or returned non-JSON text. Return ONLY a single valid JSON object. No markdown fences, no commentary, no research notes outside the JSON.`
          : isParseRetry
            ? buildParseRetryUserPrompt(ctx, lastRawText, formatFailuresForRetry(lastFailures))
            : buildRevisionUserPrompt(ctx, lastJson, formatFailuresForRetry(lastFailures));

    let payload: GeneratedContentPayload;
    try {
      const rawText = await claude.complete(systemPrompt, userPrompt, logLabel);
      lastRawText = rawText;
      payload = parseGeneratedContentText(rawText);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [${logLabel}] attempt ${attempts}: API/parse error — ${message}`);
      lastFailures = [{ check: 'api_or_parse', detail: message }];
      continue;
    }
    lastJson = payloadToJson(payload);
    console.log(
      `  [${logLabel}] attempt ${attempts}: received payload (${payload.sections.length} sections, ${payload.keywords.length} keywords)`
    );

    if (payload.needsReview) {
      return {
        status: 'needs_review',
        attempts,
        reason: payload.needsReviewReason || 'Claude flagged insufficient honest context',
      };
    }

    const seoContent = sanitizeDashesInSeoContent(
      claude.toSeoContent(payload, bioUrl, ctxBase.lastReviewed, attempts)
    );
    const verification = verifySeoContent(
      seoContent,
      runningPatterns,
      course.courseCode,
      course.university,
      getSubjectTerms(course)
    );

    if (verification.passed) {
      if (attempts >= 2 && verification.wordCount < MIN_BODY_WORD_COUNT) {
        return {
          status: 'needs_review',
          attempts,
          reason: `Word count ${verification.wordCount} still below ${MIN_BODY_WORD_COUNT} after retry; flagged for human review`,
        };
      }
      return { status: 'passed', seoContent, attempts };
    }

    lastFailures = verification.failures;

    if (attempts === 1 && verification.wordCount < 2000 && ctxBase.descriptionDepth === 'thin') {
      return {
        status: 'needs_review',
        attempts,
        reason: `Thin description and word count ${verification.wordCount} after first attempt; insufficient honest context`,
        failures: verification.failures.map((f) => f.detail),
      };
    }
  }

  return {
    status: 'failed',
    attempts,
    failures: lastFailures.map((f) => f.detail),
  };
}

async function runGeneration(
  universitySlug: string,
  allCourses: AllCoursesFile,
  args: CliArgs,
  batchMonitorOpts?: BatchMonitorOptions
): Promise<RunGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing from .env.local');
  }

  allCourses.screeningApprovedAt = new Date().toISOString();
  if (!batchMonitorOpts?.enabled) {
    resetApiUsage();
  }
  const claude = new ClaudeContentClient(apiKey);
  const systemPrompt = buildSystemPrompt(INSTRUCTION_FILE_TEXT);
  const lastReviewed = todayIsoDate();

  console.log('\nRefreshing screening flags from current rules (clears stale excluded:true on disk)...');
  const screened = applyScreeningToCourses(allCourses.courses);
  allCourses.courses = screened.courses;
  saveAllCoursesFile(universitySlug, allCourses);
  console.log(
    `  Screening refreshed: ${screened.approved.length} approved, ${screened.exclusions.length} excluded`
  );

  writeJsonOutput(`needs-review-${universitySlug}.json`, []);
  writeJsonOutput(`failed-verification-${universitySlug}.json`, []);

  const runningHeadings: string[] = [];
  const runningPatterns = new Set<string>();

  for (const existing of allCourses.courses) {
    if (existing.seoContent?.sections) {
      for (const section of existing.seoContent.sections) {
        runningHeadings.push(section.heading);
      }
      registerHeadingPatterns(
        existing.seoContent,
        runningPatterns,
        existing.courseCode,
        existing.university,
        getSubjectTerms(existing)
      );
    }
  }

  if (universitySlug === 'ohio-state') {
    for (const heading of loadPhilosHeadingList()) {
      runningHeadings.push(heading);
    }
    for (const [courseCode, seoContent] of loadPhilosSeoContentMap()) {
      const record = allCourses.courses.find((c) => c.courseCode.trim() === courseCode);
      registerHeadingPatterns(
        seoContent,
        runningPatterns,
        courseCode,
        record?.university ?? allCourses.university,
        record ? getSubjectTerms(record) : ['PHILOS', 'Philosophy']
      );
    }
    console.log(
      `Loaded ${runningHeadings.length} existing headings (including completed PHILOS pages) for batch uniqueness checks.`
    );
  }

  const log: GenerationLogEntry[] = [];
  let processed = 0;
  const departmentsFinished = new Set<string>();
  const departmentsInProgress = new Map<string, number>();
  const departmentCourseCounts = new Map<string, number>();

  for (const course of allCourses.courses) {
    if (course.excluded || isSkippedDepartment(course, args.skipDepartments)) continue;
    if (!isGenerationTarget(course, args)) continue;
    departmentCourseCounts.set(
      course.department,
      (departmentCourseCounts.get(course.department) ?? 0) + 1
    );
  }

  if (args.course || args.department) {
    const targets = allCourses.courses.filter((c) => isGenerationTarget(c, args));
    const excludedTargets = targets.filter((c) => c.excluded);
    const generatable = targets.filter(
      (c) =>
        !c.excluded &&
        !isSkippedDepartment(c, args.skipDepartments) &&
        !c.seoContent?.sections?.length
    );

    console.log(
      `\nFilter: ${args.course ? `course=${args.course}` : ''}${args.department ? ` department=${args.department}` : ''}`
    );
    console.log(`Target course(s): ${targets.map((c) => c.courseCode).join(', ') || '(none)'}`);

    for (const c of excludedTargets) {
      console.error(`  ✗ ${c.courseCode} BLOCKED — excluded: ${c.exclusionReason ?? 'unknown reason'}`);
    }

    console.log(
      `Ready to generate: ${generatable.map((c) => c.courseCode).join(', ') || '(none)'}\n`
    );

    if (!generatable.length) {
      throw new Error(
        `No courses available to generate for this filter. ` +
          `${excludedTargets.length} target(s) are excluded with stale or current screening rules. ` +
          `Run: npm run ohio-state:screen-audit`
      );
    }
  }

  function maybeReportCheckpoint(justFinishedDept?: string): void {
    if (justFinishedDept) departmentsFinished.add(justFinishedDept);
    if (departmentsFinished.size === 0 || departmentsFinished.size % 10 !== 0) return;

    const passed = log.filter((e) => e.status === 'passed');
    const needsReview = log.filter((e) => e.status === 'needs_review');
    const failed = log.filter((e) => e.status === 'failed');
    const avgAttempts =
      passed.length > 0
        ? (passed.reduce((sum, e) => sum + e.attempts, 0) / passed.length).toFixed(2)
        : '0';

    console.log('\n=== CHECKPOINT ===');
    console.log(`Departments completed: ${departmentsFinished.size}`);
    console.log(`Courses passed: ${passed.length}, avg attempts: ${avgAttempts}`);

    if (needsReview.length) {
      console.log('\nNeeds review:');
      for (const entry of needsReview) {
        console.log(
          `  • ${entry.department} / ${entry.courseCode}: ${entry.reason ?? 'unspecified'}`
        );
      }
    } else {
      console.log('\nNeeds review: none');
    }

    if (failed.length) {
      console.log('\nFailed verification:');
      for (const entry of failed) {
        const checks = entry.failures?.length
          ? entry.failures.join('; ')
          : entry.reason ?? 'unspecified';
        console.log(`  • ${entry.department} / ${entry.courseCode}: ${checks}`);
      }
    } else {
      console.log('\nFailed verification: none');
    }

    console.log(`\nRunning headings tracked: ${runningHeadings.length} (no duplicates detected in passed courses)`);
    console.log('==================\n');

    writeJsonOutput(`checkpoint-${universitySlug}-${departmentsFinished.size}.json`, {
      university: universitySlug,
      departmentsCompleted: departmentsFinished.size,
      timestamp: new Date().toISOString(),
      summary: {
        passed: passed.length,
        avgAttempts: Number(avgAttempts),
        needsReview: needsReview.length,
        failed: failed.length,
        headingCount: runningHeadings.length,
      },
      needsReview: needsReview.map((e) => ({
        department: e.department,
        courseCode: e.courseCode,
        reason: e.reason,
        failures: e.failures,
      })),
      failed: failed.map((e) => ({
        department: e.department,
        courseCode: e.courseCode,
        reason: e.reason,
        failures: e.failures,
      })),
      entries: log,
    });
  }

  function getRunningCostUsd(): number {
    const runCost = summarizeApiUsageCost(getApiUsageRecords()).totalCostUsd;
    return (batchMonitorOpts?.state.cumulativeCostUsd ?? 0) + runCost;
  }

  function reportBatchProgress(trigger: string): void {
    if (!batchMonitorOpts?.enabled) return;
    const state = batchMonitorOpts.state;
    const totalCost = getRunningCostUsd();

    console.log('\n=== BATCH PROGRESS ===');
    console.log(`Trigger: ${trigger}`);
    console.log(`Running course count completed: ${state.coursesCompleted}`);
    console.log(`Running real cost total: $${totalCost.toFixed(4)}`);
    if (state.fourAttemptCourses.length) {
      console.log(`Courses needing all 4 attempts: ${state.fourAttemptCourses.join(', ')}`);
    } else {
      console.log('Courses needing all 4 attempts: none');
    }
    if (state.needsReview.length) {
      console.log('Needs review:');
      for (const entry of state.needsReview) {
        console.log(`  • ${entry.department} / ${entry.courseCode}: ${entry.reason ?? 'unspecified'}`);
      }
    } else {
      console.log('Needs review: none');
    }
    if (state.failedVerification.length) {
      console.log('Failed verification:');
      for (const entry of state.failedVerification) {
        const detail = entry.failures?.length ? entry.failures.join('; ') : 'unspecified';
        console.log(`  • ${entry.department} / ${entry.courseCode}: ${detail}`);
      }
    } else {
      console.log('Failed verification: none');
    }
    console.log('======================\n');
  }

  function handleBatchMonitorAfterCourse(
    course: AllCoursesRecord,
    result: { status: 'passed' | 'failed' | 'needs_review'; attempts: number; reason?: string; failures?: string[] }
  ): boolean {
    if (!batchMonitorOpts?.enabled) return false;

    const state = batchMonitorOpts.state;
    state.coursesCompleted += 1;

    if (result.attempts >= 4 && !state.fourAttemptCourses.includes(course.courseCode)) {
      state.fourAttemptCourses.push(course.courseCode);
    }

    if (result.status === 'failed') {
      state.consecutiveVerificationFailures += 1;
      const existingIdx = state.failedVerification.findIndex(
        (e) => e.courseCode === course.courseCode
      );
      const entry = {
        department: course.department,
        courseCode: course.courseCode,
        failures: result.failures,
      };
      if (existingIdx >= 0) state.failedVerification[existingIdx] = entry;
      else state.failedVerification.push(entry);
    } else if (result.status === 'passed') {
      state.consecutiveVerificationFailures = 0;
    } else if (result.status === 'needs_review') {
      const existingIdx = state.needsReview.findIndex((e) => e.courseCode === course.courseCode);
      const entry = {
        department: course.department,
        courseCode: course.courseCode,
        reason: result.reason,
      };
      if (existingIdx >= 0) state.needsReview[existingIdx] = entry;
      else state.needsReview.push(entry);
    }

    if (state.coursesCompleted % batchMonitorOpts.progressInterval === 0) {
      reportBatchProgress(`every ${batchMonitorOpts.progressInterval} courses`);
    }

    const totalCost = getRunningCostUsd();
    if (totalCost > batchMonitorOpts.costCapUsd) {
      console.error(
        `\n⛔ BATCH STOP: Running cost $${totalCost.toFixed(4)} exceeds $${batchMonitorOpts.costCapUsd.toFixed(2)} cap.`
      );
      stopReason = 'cost_cap';
      return true;
    }

    if (state.consecutiveVerificationFailures >= batchMonitorOpts.consecutiveFailureLimit) {
      console.error(
        `\n⛔ BATCH STOP: ${state.consecutiveVerificationFailures} consecutive verification failures after all retry attempts.`
      );
      stopReason = 'consecutive_failures';
      return true;
    }

    return false;
  }

  let stoppedEarly = false;
  let stopReason: RunGenerationResult['stopReason'];

  function markDepartmentProgress(dept: string): void {
    const done = (departmentsInProgress.get(dept) ?? 0) + 1;
    departmentsInProgress.set(dept, done);
    const total = departmentCourseCounts.get(dept) ?? 0;
    if (total > 0 && done >= total) {
      maybeReportCheckpoint(dept);
    }
  }

  for (const course of allCourses.courses) {
    if (stoppedEarly) break;

    const isTarget = isGenerationTarget(course, args);

    if (course.excluded) {
      if (isTarget) {
        console.error(
          `\n✗ GENERATION SKIPPED — ${course.courseCode}: excluded (${course.exclusionReason ?? 'no reason recorded'})\n`
        );
      }
      log.push({
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        department: course.department,
        status: 'excluded',
        attempts: 0,
        reason: course.exclusionReason,
      });
      continue;
    }

    if (!isTarget) continue;

    if (isSkippedDepartment(course, args.skipDepartments)) {
      log.push({
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        department: course.department,
        status: 'skipped',
        attempts: 0,
        reason: `Department skipped via --skip-departments (${course.department})`,
      });
      continue;
    }

    if (course.seoContent?.sections?.length) {
      log.push({
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        department: course.department,
        status: 'skipped',
        attempts: 0,
        reason: 'Already has verified seoContent; not regenerating',
      });
      for (const section of course.seoContent.sections) {
        if (!runningHeadings.includes(section.heading)) {
          runningHeadings.push(section.heading);
        }
      }
      registerHeadingPatterns(
        course.seoContent,
        runningPatterns,
        course.courseCode,
        course.university,
        getSubjectTerms(course)
      );
      markDepartmentProgress(course.department);
      continue;
    }

    if (args.limit !== null && processed >= args.limit) break;

    let authorConfig;
    try {
      authorConfig = getAuthorBylineForDepartment(course.department, universitySlug);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.push({
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        department: course.department,
        status: 'failed',
        attempts: 0,
        reason: message,
      });
      appendJsonArrayOutput(`failed-verification-${universitySlug}.json`, {
        courseCode: course.courseCode,
        department: course.department,
        reason: message,
      });
      continue;
    }

    processed += 1;
    console.log(`Generating ${course.courseCode} (${course.department})...`);

    const ctxBase: Omit<CourseGenerationContext, 'runningHeadings'> = {
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      department: course.department,
      departmentDisplayName: course.departmentDisplayName ?? course.department,
      university: course.university,
      instructor: course.instructor ?? null,
      credits: course.credits ?? null,
      sessionStart: course.sessionStart ?? null,
      sessionEnd: course.sessionEnd ?? null,
      location: course.location ?? null,
      description: course.description,
      attributes: course.attributes ?? null,
      sourceUrl: course.sourceUrl,
      descriptionDepth: assessDescriptionDepth(course.description),
      bylineText: authorConfig.bylineText,
      bioUrl: authorConfig.bioUrl,
      lastReviewed,
    };

    try {
      const result = await generateForCourse(
        course,
        ctxBase,
        runningHeadings,
        runningPatterns,
        claude,
        systemPrompt,
        authorConfig.bioUrl
      );

      if (result.status === 'passed' && result.seoContent) {
        course.seoContent = result.seoContent;
        for (const section of result.seoContent.sections) {
          runningHeadings.push(section.heading);
        }
        registerHeadingPatterns(
          result.seoContent,
          runningPatterns,
          course.courseCode,
          course.university,
          getSubjectTerms(course)
        );
        log.push({
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          department: course.department,
          status: 'passed',
          attempts: result.attempts,
        });
        saveAllCoursesFile(universitySlug, allCourses);
        console.log(
          `  ✓ ${course.courseCode} passed (${result.attempts} attempt(s)) — seoContent saved to ${allCoursesPath(universitySlug)}`
        );
        markDepartmentProgress(course.department);
        if (handleBatchMonitorAfterCourse(course, result)) {
          stoppedEarly = true;
          break;
        }
      } else if (result.status === 'needs_review') {
        log.push({
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          department: course.department,
          status: 'needs_review',
          attempts: result.attempts,
          reason: result.reason,
          failures: result.failures,
        });
        appendJsonArrayOutput(`needs-review-${universitySlug}.json`, {
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          department: course.department,
          attempts: result.attempts,
          reason: result.reason,
          failures: result.failures,
        });
        console.log(`  ⚠ ${course.courseCode} needs review: ${result.reason}`);
        if ((args.course || args.department) && !batchMonitorOpts?.enabled) {
          throw new Error(`${course.courseCode} flagged needs_review: ${result.reason}`);
        }
        markDepartmentProgress(course.department);
        if (handleBatchMonitorAfterCourse(course, result)) {
          stoppedEarly = true;
          break;
        }
      } else {
        log.push({
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          department: course.department,
          status: 'failed',
          attempts: result.attempts,
          failures: result.failures,
        });
        appendJsonArrayOutput(`failed-verification-${universitySlug}.json`, {
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          department: course.department,
          attempts: result.attempts,
          failures: result.failures,
        });
        console.log(`  ✗ ${course.courseCode} failed verification after ${result.attempts} attempts`);
        if (result.failures?.length) {
          console.error(`    ${result.failures.join('; ')}`);
        }
        if ((args.course || args.department) && !batchMonitorOpts?.enabled) {
          throw new Error(
            `${course.courseCode} failed verification after ${result.attempts} attempts: ${result.failures?.join('; ') ?? 'unknown'}`
          );
        }
        markDepartmentProgress(course.department);
        if (handleBatchMonitorAfterCourse(course, result)) {
          stoppedEarly = true;
          break;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${course.courseCode} ERROR: ${message}`);
      if (err instanceof Error && err.stack) {
        console.error(err.stack);
      }
      log.push({
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        department: course.department,
        status: 'failed',
        attempts: 0,
        reason: message,
      });
      appendJsonArrayOutput(`failed-verification-${universitySlug}.json`, {
        courseCode: course.courseCode,
        department: course.department,
        reason: message,
      });
      markDepartmentProgress(course.department);
      if (args.course || args.department) {
        throw err instanceof Error ? err : new Error(message);
      }
    }
  }

  if (batchMonitorOpts?.enabled && batchMonitorOpts.state.coursesCompleted > 0) {
    const remainder = batchMonitorOpts.state.coursesCompleted % batchMonitorOpts.progressInterval;
    if (remainder !== 0 || stoppedEarly) {
      reportBatchProgress(stoppedEarly ? 'batch stop' : 'run complete');
    }
  }

  saveAllCoursesFile(universitySlug, allCourses);

  const passedForFilter = log.filter(
    (e) =>
      e.status === 'passed' &&
      allCourses.courses.some(
        (c) => c.courseCode === e.courseCode && isGenerationTarget(c, args)
      )
  );

  const logPath = writeJsonOutput(`generation-log-${universitySlug}.json`, {
    university: universitySlug,
    generatedAt: new Date().toISOString(),
    departmentFilter: args.department,
    courseFilter: args.course,
    skipDepartments: args.skipDepartments,
    entries: log,
    summary: {
      passed: log.filter((e) => e.status === 'passed').length,
      failed: log.filter((e) => e.status === 'failed').length,
      needsReview: log.filter((e) => e.status === 'needs_review').length,
      skipped: log.filter((e) => e.status === 'skipped').length,
      excluded: log.filter((e) => e.status === 'excluded').length,
    },
  });

  console.log(`\nGeneration log written to ${logPath}`);

  const usageRecords = getApiUsageRecords();
  const batchCost = summarizeApiUsageCost(usageRecords);
  const perCourseCost = new Map<string, { inputTokens: number; outputTokens: number }>();
  for (const record of usageRecords) {
    const current = perCourseCost.get(record.logLabel) ?? { inputTokens: 0, outputTokens: 0 };
    current.inputTokens += record.inputTokens;
    current.outputTokens += record.outputTokens;
    perCourseCost.set(record.logLabel, current);
  }

  const usageReport = {
    model: CONTENT_GENERATION_MODEL,
    pricing: { inputPerMillionUsd: 1, outputPerMillionUsd: 5 },
    batch: batchCost,
    perCourse: [...perCourseCost.entries()].map(([courseCode, usage]) => {
      const cost = summarizeApiUsageCost([
        { logLabel: courseCode, turn: 0, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
      ]);
      return { courseCode, ...usage, ...cost };
    }),
    calls: usageRecords,
  };

  const usagePath = writeJsonOutput(`generation-usage-${universitySlug}.json`, usageReport);

  console.log('\n--- API usage cost (Haiku: $1/M input, $5/M output) ---');
  console.log(
    `  Batch totals: ${batchCost.totalInputTokens.toLocaleString()} input + ${batchCost.totalOutputTokens.toLocaleString()} output tokens`
  );
  console.log(
    `  Input cost:  ${batchCost.totalInputTokens.toLocaleString()} / 1,000,000 × $1.00 = $${batchCost.inputCostUsd.toFixed(4)}`
  );
  console.log(
    `  Output cost: ${batchCost.totalOutputTokens.toLocaleString()} / 1,000,000 × $5.00 = $${batchCost.outputCostUsd.toFixed(4)}`
  );
  console.log(`  Batch total: $${batchCost.totalCostUsd.toFixed(4)}`);
  for (const entry of usageReport.perCourse) {
    console.log(
      `  ${entry.courseCode}: ${entry.inputTokens.toLocaleString()} in + ${entry.outputTokens.toLocaleString()} out = $${entry.totalCostUsd.toFixed(4)} (${usageRecords.filter((r) => r.logLabel === entry.courseCode).length} API call(s))`
    );
  }
  console.log(`  Full call log: ${usagePath}`);

  if (args.course || args.department) {
    console.log(
      `\nGeneration summary for filter: ${passedForFilter.length} passed — ${passedForFilter.map((e) => `${e.courseCode} (${e.attempts} attempts)`).join(', ') || 'NONE'}`
    );
    if (!passedForFilter.length && !batchMonitorOpts?.enabled) {
      throw new Error(
        `Generation finished with zero passed courses for filter ${args.course ?? args.department}. ` +
          `See ${logPath} for excluded/failed/skipped entries. Do not run verification.`
      );
    }
  }

  return { stoppedEarly, stopReason };
}

export async function prepareUniversityCourses(universitySlug: string): Promise<AllCoursesFile> {
  const filePath = allCoursesPath(universitySlug);

  console.log(`Loading courses for ${universitySlug}...`);
  const existing = fs.existsSync(filePath)
    ? (JSON.parse(fs.readFileSync(filePath, 'utf8')) as AllCoursesFile)
    : null;

  const fetched = await fetchUniversityFromIndex(universitySlug);
  if (!fetched?.courses.length) {
    throw new Error(`No courses found for university "${universitySlug}"`);
  }

  const freshFile: AllCoursesFile = {
    university: fetched.university,
    universitySlug,
    term: fetched.term,
    location: fetched.location,
    generatedAt: existing?.generatedAt ?? new Date().toISOString(),
    screeningApprovedAt: existing?.screeningApprovedAt,
    courses: fetched.courses,
  };

  const allCourses = mergeExistingCourseData(freshFile, existing);

  if (!existing) {
    saveAllCoursesFile(universitySlug, allCourses);
    console.log(`Bootstrapped ${filePath} with ${allCourses.courses.length} courses.`);
  }

  return allCourses;
}

export { runScreening, runGeneration };

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.university) {
    console.error('Error: --university flag is required.');
    console.error('Example: npx tsx scripts/generate-course-content.ts --university=fordham');
    console.error('Universities (manual order): fordham, columbia, uconn, asu, ohio-state');
    process.exit(1);
  }

  confirmEnvSetup();

  const universitySlug = args.university;
  const allCourses = await prepareUniversityCourses(universitySlug);

  if (!args.approved) {
    await runScreening(universitySlug, allCourses);
    printSitewideReminder();
    process.exit(0);
  }

  const screeningReportPath = path.join(process.cwd(), 'output', `screening-report-${universitySlug}.json`);
  if (!fs.existsSync(screeningReportPath) && !allCourses.screeningApprovedAt) {
    console.warn(
      `Warning: No screening report at output/screening-report-${universitySlug}.json. Run without --approved first to generate one.`
    );
  }

  console.log('Screening approved via --approved flag. Starting generation...\n');
  await runGeneration(universitySlug, allCourses, args);
  printSitewideReminder();
}

const isDirectRun =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
