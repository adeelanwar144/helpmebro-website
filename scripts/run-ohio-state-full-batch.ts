#!/usr/bin/env npx tsx
/**
 * Ohio State full-batch orchestrator.
 * Processes one department per invocation, persists cumulative cost/state,
 * and prints a browser-check URL after each department completes.
 *
 * Usage:
 *   npx tsx scripts/run-ohio-state-full-batch.ts          # next department
 *   npx tsx scripts/run-ohio-state-full-batch.ts --status   # show state only
 *   npx tsx scripts/run-ohio-state-full-batch.ts --resume   # continue after stop
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { courseCodeToSlug } from '../lib/courseUtils';
import { getDepartmentSlug } from '../lib/departmentSlugs';
import { loadAllCoursesFile } from '../lib/seoContentLoader';
import type { AllCoursesRecord } from '../lib/types';
import {
  getApiUsageRecords,
  resetApiUsage,
  summarizeApiUsageCost,
} from './lib/claudeClient';
import {
  prepareUniversityCourses,
  runGeneration,
  type BatchMonitorState,
} from './generate-course-content';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const UNIVERSITY = 'ohio-state';
const STATE_PATH = path.join(process.cwd(), 'output', 'ohio-state-batch-state.json');
const COST_CAP_USD = 20;
const PROGRESS_INTERVAL = 10;
const CONSECUTIVE_FAILURE_LIMIT = 3;

interface PersistedBatchState extends BatchMonitorState {
  completedDepartments: string[];
  lastDepartment?: string;
  startedAt: string;
  updatedAt: string;
  finished: boolean;
  stopReason?: string;
}

function defaultState(): PersistedBatchState {
  return {
    coursesCompleted: 0,
    cumulativeCostUsd: 0,
    consecutiveVerificationFailures: 0,
    fourAttemptCourses: [],
    needsReview: [],
    failedVerification: [],
    completedDepartments: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    finished: false,
  };
}

function loadState(): PersistedBatchState {
  if (!fs.existsSync(STATE_PATH)) return defaultState();
  return { ...defaultState(), ...JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) };
}

function saveState(state: PersistedBatchState): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function pendingByDepartment(courses: AllCoursesRecord[]): Map<string, AllCoursesRecord[]> {
  const map = new Map<string, AllCoursesRecord[]>();
  for (const course of courses) {
    if (course.excluded || course.seoContent?.sections?.length) continue;
    const list = map.get(course.department) ?? [];
    list.push(course);
    map.set(course.department, list);
  }
  return map;
}

function pickNextDepartment(
  pending: Map<string, AllCoursesRecord[]>,
  completedDepartments: string[]
): string | null {
  const remaining = [...pending.keys()]
    .filter((dept) => !completedDepartments.includes(dept))
    .sort((a, b) => {
      const diff = (pending.get(b)?.length ?? 0) - (pending.get(a)?.length ?? 0);
      return diff !== 0 ? diff : a.localeCompare(b);
    });
  return remaining[0] ?? null;
}

function browserCheckUrl(course: AllCoursesRecord): string {
  const deptSlug = getDepartmentSlug(course.department, UNIVERSITY);
  const courseSlug = courseCodeToSlug(course.courseCode);
  return `http://localhost:3000/${deptSlug}/${courseSlug}?uni=ohio-state`;
}

function printStatus(state: PersistedBatchState, pendingCount: number): void {
  console.log('\n--- Ohio State batch status ---');
  console.log(`Courses completed: ${state.coursesCompleted}`);
  console.log(`Cumulative real cost: $${state.cumulativeCostUsd.toFixed(4)}`);
  console.log(`Departments finished: ${state.completedDepartments.length}`);
  console.log(`Courses remaining: ${pendingCount}`);
  console.log(`Consecutive verification failures: ${state.consecutiveVerificationFailures}`);
  if (state.fourAttemptCourses.length) {
    console.log(`All-4-attempt courses: ${state.fourAttemptCourses.join(', ')}`);
  }
  if (state.needsReview.length) {
    console.log('Needs review:');
    for (const e of state.needsReview) {
      console.log(`  • ${e.department} / ${e.courseCode}: ${e.reason ?? 'unspecified'}`);
    }
  }
  if (state.failedVerification.length) {
    console.log('Failed verification:');
    for (const e of state.failedVerification) {
      console.log(`  • ${e.department} / ${e.courseCode}`);
    }
  }
  if (state.stopReason) console.log(`Stop reason: ${state.stopReason}`);
  if (state.finished) console.log('Batch marked finished.');
  console.log('-------------------------------\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--reset')) {
    if (fs.existsSync(STATE_PATH)) fs.unlinkSync(STATE_PATH);
    console.log('Batch state reset.');
    return;
  }

  const state = loadState();

  if (args.includes('--resume')) {
    state.finished = false;
    state.stopReason = undefined;
    state.consecutiveVerificationFailures = 0;
    saveState(state);
    console.log('Batch resumed: consecutive failure counter reset.');
  }
  const allCourses = loadAllCoursesFile(UNIVERSITY);
  const pending = pendingByDepartment(allCourses.courses);
  const pendingCount = [...pending.values()].reduce((sum, list) => sum + list.length, 0);

  if (args.includes('--status')) {
    printStatus(state, pendingCount);
    return;
  }

  if (state.finished || state.stopReason) {
    if (!args.includes('--resume')) {
      printStatus(state, pendingCount);
      console.log('Batch already stopped or finished. Use --resume to continue or --reset to start over.');
      return;
    }
  }

  if (state.cumulativeCostUsd >= COST_CAP_USD) {
    state.stopReason = 'cost_cap';
    state.finished = true;
    saveState(state);
    printStatus(state, pendingCount);
    return;
  }

  const nextDept = pickNextDepartment(pending, state.completedDepartments);
  if (!nextDept) {
    state.finished = true;
    saveState(state);
    printStatus(state, 0);
    console.log('All departments complete.');
    return;
  }

  const deptCourses = pending.get(nextDept) ?? [];
  console.log(
    `\n>>> Starting department ${nextDept} (${deptCourses.length} course(s) pending) <<<\n`
  );

  resetApiUsage();
  const freshCourses = await prepareUniversityCourses(UNIVERSITY);

  const batchState: BatchMonitorState = {
    coursesCompleted: state.coursesCompleted,
    cumulativeCostUsd: state.cumulativeCostUsd,
    consecutiveVerificationFailures: state.consecutiveVerificationFailures,
    fourAttemptCourses: [...state.fourAttemptCourses],
    needsReview: [...state.needsReview],
    failedVerification: [...state.failedVerification],
  };

  const result = await runGeneration(
    UNIVERSITY,
    freshCourses,
    {
      university: UNIVERSITY,
      department: nextDept,
      course: null,
      approved: true,
      skipDepartments: [],
      limit: null,
      batchMonitor: true,
    },
    {
      enabled: true,
      costCapUsd: COST_CAP_USD,
      progressInterval: PROGRESS_INTERVAL,
      consecutiveFailureLimit: CONSECUTIVE_FAILURE_LIMIT,
      state: batchState,
    }
  );

  const runCost = summarizeApiUsageCost(getApiUsageRecords()).totalCostUsd;
  state.coursesCompleted = batchState.coursesCompleted;
  state.cumulativeCostUsd = batchState.cumulativeCostUsd + runCost;
  state.consecutiveVerificationFailures = batchState.consecutiveVerificationFailures;
  state.fourAttemptCourses = batchState.fourAttemptCourses;
  state.needsReview = batchState.needsReview;
  state.failedVerification = batchState.failedVerification;
  state.lastDepartment = nextDept;

  if (result.stoppedEarly) {
    state.stopReason = result.stopReason ?? 'unknown';
    state.finished = true;
    saveState(state);
    printStatus(state, pendingCount);
    process.exit(result.stopReason === 'cost_cap' ? 2 : 3);
  }

  state.completedDepartments.push(nextDept);
  saveState(state);

  const updated = loadAllCoursesFile(UNIVERSITY);
  const sample =
    updated.courses.find(
      (c) =>
        c.department === nextDept &&
        !c.excluded &&
        c.seoContent?.sections?.length &&
        deptCourses.some((p) => p.courseCode === c.courseCode)
    ) ?? deptCourses[0];

  const checkUrl = browserCheckUrl(sample);
  console.log(`\n=== DEPARTMENT COMPLETE: ${nextDept} ===`);
  console.log(`BROWSER_CHECK_URL=${checkUrl}`);
  console.log(`BROWSER_CHECK_COURSE=${sample.courseCode}`);
  console.log(`Cumulative cost: $${state.cumulativeCostUsd.toFixed(4)}`);
  console.log(`Courses completed: ${state.coursesCompleted}`);
  console.log('====================================\n');

  const stillPending = pendingByDepartment(updated.courses);
  const remaining = [...stillPending.values()].reduce((sum, list) => sum + list.length, 0);
  if (remaining === 0) {
    state.finished = true;
    saveState(state);
    console.log('All departments complete.');
  }
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
