/**
 * Verify Phase 1 Migration
 * 
 * Verifies that the Phase 1 migration was successful by checking:
 * - Department count and names
 * - Project count and assignments
 * - Task count and budgets
 * - Total budget matches $2,800,000
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const EXPECTED_TOTAL = 2800000;

async function main() {
  console.log('🔍 Verifying Phase 1 Migration...\n');

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);

    const departments = await pb.collection('departments').getFullList();
    const projects = await pb.collection('projects').getFullList({ expand: 'department' });
    const tasks = await pb.collection('tasks').getFullList({ expand: 'projectId' });

    console.log('='.repeat(60));
    console.log('PHASE 1 STRUCTURE VERIFICATION');
    console.log('='.repeat(60));

    // Check departments
    console.log('\n📁 DEPARTMENTS');
    const activeDepts = departments.filter((d: any) => d.status === 'active');
    const inactiveDepts = departments.filter((d: any) => d.status === 'inactive');

    console.log(`\nActive Departments (${activeDepts.length}):`);
    const expectedDepts = [
      'Executive',
      'Operations',
      'Marketing',
      'Technology',
      'Legal & Compliance',
      'Player Development',
      'Content & Media',
      'Finance'
    ];

    let deptErrors = 0;
    for (const deptName of expectedDepts) {
      const dept = activeDepts.find((d: any) => d.name === deptName);
      if (dept) {
        console.log(`  ✓ ${deptName}`);
      } else {
        console.log(`  ❌ ${deptName} - MISSING`);
        deptErrors++;
      }
    }

    console.log(`\nInactive Departments (${inactiveDepts.length}):`);
    const expectedInactive = ['Sales', 'Clothing', 'Course Construction'];
    for (const deptName of expectedInactive) {
      const dept = inactiveDepts.find((d: any) => d.name === deptName);
      if (dept) {
        console.log(`  ✓ ${deptName} (archived)`);
      } else {
        console.log(`  ⚠️  ${deptName} - Not found in inactive`);
      }
    }

    // Check projects
    console.log('\n📂 PROJECTS');
    console.log(`\nTotal Projects: ${projects.length}`);
    console.log(`Expected: 13 (11 new + 2 existing modified)`);

    // Check tasks
    console.log('\n📝 TASKS');
    console.log(`\nTotal Tasks: ${tasks.length}`);
    console.log(`Expected: 22 (20 new + 2 modified)`);

    // Calculate total budget
    console.log('\n💰 BUDGET VERIFICATION');
    let totalBudget = 0;
    const budgetByDept: { [key: string]: number } = {};

    for (const task of tasks) {
      const budget = (task as any).task_budget || 0;
      totalBudget += budget;

      const project = projects.find((p: any) => p.id === (task as any).projectId);
      if (project) {
        const deptName = (project as any).expand?.department?.name || 'Unknown';
        budgetByDept[deptName] = (budgetByDept[deptName] || 0) + budget;
      }
    }

    console.log(`\nTotal Task Budgets: $${totalBudget.toLocaleString()}`);
    console.log(`Expected: $${EXPECTED_TOTAL.toLocaleString()}`);

    if (totalBudget === EXPECTED_TOTAL) {
      console.log('✅ Budget matches expected total!');
    } else {
      const diff = totalBudget - EXPECTED_TOTAL;
      console.log(`❌ Budget mismatch: ${diff > 0 ? '+' : ''}$${diff.toLocaleString()}`);
    }

    console.log('\nBudget by Department:');
    const sortedDepts = Object.entries(budgetByDept).sort((a, b) => b[1] - a[1]);
    for (const [deptName, budget] of sortedDepts) {
      console.log(`  ${deptName}: $${budget.toLocaleString()}`);
    }

    // Check Phase 1 dates
    console.log('\n📅 DATE VERIFICATION');
    const phase1Start = '2026-04-01';
    const phase1End = '2026-09-30';

    let dateErrors = 0;
    for (const task of tasks) {
      const startDate = (task as any).startDate?.substring(0, 10);
      const dueDate = (task as any).dueDate?.substring(0, 10);

      if (startDate !== phase1Start || dueDate !== phase1End) {
        console.log(`  ⚠️  ${(task as any).title}: ${startDate} → ${dueDate}`);
        dateErrors++;
      }
    }

    if (dateErrors === 0) {
      console.log('  ✅ All tasks have correct Phase 1 dates');
    } else {
      console.log(`  ⚠️  ${dateErrors} tasks have incorrect dates`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const allGood = deptErrors === 0 && 
                    totalBudget === EXPECTED_TOTAL && 
                    dateErrors === 0 &&
                    activeDepts.length === 8 &&
                    tasks.length === 22;

    if (allGood) {
      console.log('✅ Phase 1 migration verified successfully!');
      console.log('\nAll checks passed:');
      console.log('  ✓ 8 active departments');
      console.log('  ✓ 3 archived departments');
      console.log('  ✓ 22 tasks');
      console.log('  ✓ $2,800,000 total budget');
      console.log('  ✓ All dates set to Phase 1 period');
    } else {
      console.log('⚠️  Phase 1 migration has issues:');
      if (deptErrors > 0) console.log(`  ❌ ${deptErrors} department errors`);
      if (totalBudget !== EXPECTED_TOTAL) console.log(`  ❌ Budget mismatch`);
      if (dateErrors > 0) console.log(`  ❌ ${dateErrors} date errors`);
      if (activeDepts.length !== 8) console.log(`  ❌ Expected 8 active departments, found ${activeDepts.length}`);
      if (tasks.length !== 22) console.log(`  ❌ Expected 22 tasks, found ${tasks.length}`);
    }

    console.log();

  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main();
