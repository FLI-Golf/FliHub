/**
 * Recalculate All Budgets
 * 
 * Recalculates all project and department budgets using the bottom-up system.
 * Tasks → Projects → Departments
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function calculateProjectBudget(pb: PocketBase, projectId: string): Promise<number> {
  const project = await pb.collection('projects').getOne(projectId);
  const mode = (project as any).project_budget_mode || 'auto';

  // Check for manual override (only if > 0)
  const manualOverride = (project as any).project_manual_budget_override || 0;
  if (mode === 'fixed' && manualOverride > 0) {
    return manualOverride;
  }

  // Calculate sum of tasks
  const tasks = await pb.collection('tasks').getFullList({
    filter: `projectId = "${projectId}"`
  });

  const taskSum = tasks.reduce((sum, task) => sum + ((task as any).task_budget || 0), 0);

  // Apply mode-specific logic
  switch (mode) {
    case 'hybrid':
      const buffer = (project as any).project_budget_buffer || 0;
      return taskSum + buffer;

    case 'capped':
      const cap = (project as any).project_budget_cap || 0;
      return cap > 0 ? Math.min(taskSum, cap) : taskSum;

    case 'auto':
    default:
      return taskSum;
  }
}

async function calculateDepartmentBudget(pb: PocketBase, departmentId: string): Promise<number> {
  const department = await pb.collection('departments').getOne(departmentId);
  const mode = (department as any).department_budget_mode || 'auto';

  // Check for manual override (only if > 0)
  const manualOverride = (department as any).department_manual_budget_override || 0;
  if (manualOverride > 0) {
    return manualOverride;
  }

  // Calculate sum of projects
  const projects = await pb.collection('projects').getFullList({
    filter: `department = "${departmentId}"`
  });

  let projectSum = 0;
  for (const project of projects) {
    const projectBudget = await calculateProjectBudget(pb, project.id);
    projectSum += projectBudget;
  }

  // Apply mode-specific logic
  switch (mode) {
    case 'annual_cap':
      const cap = (department as any).department_budget_cap || 0;
      return cap > 0 ? Math.min(projectSum, cap) : projectSum;

    case 'allocated':
      const allocated = (department as any).department_annual_budget || 0;
      return allocated;

    case 'auto':
    default:
      return projectSum;
  }
}

async function main() {
  console.log('🔄 Recalculating All Budgets...\n');

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);

    const departments = await pb.collection('departments').getFullList();
    const projects = await pb.collection('projects').getFullList();

    console.log('='.repeat(60));
    console.log('RECALCULATING PROJECT BUDGETS');
    console.log('='.repeat(60));

    for (const project of projects) {
      const newBudget = await calculateProjectBudget(pb, project.id);
      const oldBudget = (project as any).project_budget || 0;

      await pb.collection('projects').update(project.id, {
        project_budget: newBudget
      });

      const change = newBudget - oldBudget;
      const changeStr = change === 0 ? '(no change)' : 
                       change > 0 ? `(+$${change.toLocaleString()})` : 
                       `(-$${Math.abs(change).toLocaleString()})`;

      console.log(`✓ ${(project as any).name}: $${newBudget.toLocaleString()} ${changeStr}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('RECALCULATING DEPARTMENT BUDGETS');
    console.log('='.repeat(60));

    let totalBudget = 0;
    for (const department of departments) {
      const newBudget = await calculateDepartmentBudget(pb, department.id);
      const oldBudget = (department as any).department_annual_budget || 0;

      await pb.collection('departments').update(department.id, {
        department_annual_budget: newBudget
      });

      const change = newBudget - oldBudget;
      const changeStr = change === 0 ? '(no change)' : 
                       change > 0 ? `(+$${change.toLocaleString()})` : 
                       `(-$${Math.abs(change).toLocaleString()})`;

      console.log(`✓ ${(department as any).name}: $${newBudget.toLocaleString()} ${changeStr}`);
      
      if ((department as any).status === 'active') {
        totalBudget += newBudget;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Active Department Budgets: $${totalBudget.toLocaleString()}`);
    console.log(`Expected Phase 1 Total: $2,800,000`);

    if (totalBudget === 2800000) {
      console.log('✅ Budget calculation matches Phase 1 total!');
    } else {
      const diff = totalBudget - 2800000;
      console.log(`⚠️  Difference: ${diff > 0 ? '+' : ''}$${diff.toLocaleString()}`);
    }

    console.log('\n✅ Budget recalculation complete!');

  } catch (error: any) {
    console.error('❌ Recalculation failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

main();
