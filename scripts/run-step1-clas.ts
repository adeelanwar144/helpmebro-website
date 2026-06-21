#!/usr/bin/env npx tsx
/**
 * Step 1: Bootstrap PHILOS, re-screen, generate CLAS only, verify.
 *
 * Usage: npm run ohio-state:step1
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {
  prepareUniversityCourses,
  runGeneration,
  runScreening,
  type CliArgs,
} from './generate-course-content';
import { importPhilosSeo } from './import-philos-seo';
import { verifyClasStep1 } from './verify-clas-step1';
import { loadAllCoursesFile } from '../lib/seoContentLoader';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const UNI = 'ohio-state';
const CLAS_CODES = ['CLAS 1101', 'CLAS 2220'];

function assertClasSeoOnDisk(): void {
  const file = loadAllCoursesFile(UNI);
  if (!file) throw new Error('data/ohio-state/all-courses.json missing after generation');

  for (const code of CLAS_CODES) {
    const course = file.courses.find((c) => c.courseCode.trim() === code);
    if (!course) throw new Error(`${code} not found in all-courses.json`);
    const seo = course.seoContent;
    if (!seo?.sections?.length) {
      throw new Error(
        `${code} has no seoContent on disk after generation. ` +
          `Check generation log — course may have been skipped as excluded.`
      );
    }
    console.log(
      `  ✓ ${code}: seoContent on disk (${seo.sections.length} sections, ${seo.generationAttempts} attempt(s), h1="${seo.h1.slice(0, 60)}...")`
    );
  }
}

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY missing from .env.local');
  }

  fs.mkdirSync(path.join(process.cwd(), 'output'), { recursive: true });

  console.log('=== STEP 1: CLAS test run ===\n');

  console.log('--- Import PHILOS seoContent ---');
  await importPhilosSeo();

  console.log('\n--- Re-run screening (required — clears stale excluded:true flags) ---');
  const coursesForScreening = await prepareUniversityCourses(UNI);
  await runScreening(UNI, coursesForScreening);

  const afterScreen = loadAllCoursesFile(UNI);
  for (const code of CLAS_CODES) {
    const c = afterScreen?.courses.find((x) => x.courseCode.trim() === code);
    if (!c) throw new Error(`${code} missing after screening`);
    if (c.excluded) {
      throw new Error(
        `${code} still excluded after screening refresh: ${c.exclusionReason}. Fix screening rules before generating.`
      );
    }
    console.log(`  ✓ ${code} approved for generation`);
  }

  console.log('\n--- Generate CLAS content ---');
  const clasArgs: CliArgs = {
    university: UNI,
    department: 'CLAS',
    course: null,
    approved: true,
    skipDepartments: [],
    limit: null,
  };
  const coursesForGeneration = await prepareUniversityCourses(UNI);
  await runGeneration(UNI, coursesForGeneration, clasArgs);

  console.log('\n--- Confirm seoContent saved to disk before verification ---');
  assertClasSeoOnDisk();

  console.log('\n--- Verify CLAS Step 1 checks ---');
  const report = verifyClasStep1();

  console.log('\n=== Step 1 mechanical checks complete ===');
  if (!report.allMechanicalChecksPassed) {
    throw new Error(
      'One or more mechanical verification checks failed. See output/step1-clas-verification.json'
    );
  }

  console.log('Check 7 (browser): visit both CLAS pages at localhost:3000 before Step 2.');
  console.log('  http://localhost:3000/clas/clas-1101?uni=ohio-state');
  console.log('  http://localhost:3000/clas/clas-2220?uni=ohio-state');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
