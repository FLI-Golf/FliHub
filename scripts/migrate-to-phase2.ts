/**
 * Phase 2 Migration Script
 * 
 * Creates Phase 2 tasks and projects for Marketing and PR Launch
 * Period: October 1, 2026 - January 31, 2027
 * Budget: $1,473,300
 * 
 * Usage: npx tsx scripts/migrate-to-phase2.ts [--dry-run]
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const DRY_RUN = process.argv.includes('--dry-run');

const PHASE2_START = '2026-10-01 00:00:00.000Z';
const PHASE2_END = '2027-01-31 23:59:59.000Z';

interface DepartmentMap {
  [key: string]: string;
}

let departmentIds: DepartmentMap = {};
let projectIds: { [key: string]: string } = {};

async function main() {
  console.log('🚀 Phase 2 Migration Script\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE MODE (changes will be applied)'}\n`);

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    console.log('✓ Authenticated\n');

    // Get departments
    const departments = await pb.collection('departments').getFullList();
    departments.forEach((dept: any) => {
      departmentIds[dept.name] = dept.id;
    });

    // Get existing projects
    const projects = await pb.collection('projects').getFullList();

    console.log('='.repeat(60));
    console.log('STEP 1: Creating New Phase 2 Projects');
    console.log('='.repeat(60));

    // Create new projects
    const newProjects = [
      { name: 'Broadcasting', dept: 'Content & Media', desc: 'Broadcasting staff and operations' },
      { name: 'Events', dept: 'Operations', desc: 'Marketing and community events' },
      { name: 'Community Outreach', dept: 'Operations', desc: 'Local community engagement' },
      { name: 'Production Technology', dept: 'Technology', desc: 'Production planning and technology' }
    ];

    for (const proj of newProjects) {
      const existing = projects.find((p: any) => p.name === proj.name && p.department === departmentIds[proj.dept]);
      
      if (existing) {
        console.log(`✓ Project already exists: ${proj.name}`);
        projectIds[proj.name] = existing.id;
      } else {
        console.log(`Creating project: ${proj.name} (${proj.dept})`);
        if (!DRY_RUN) {
          const created = await createProject(pb, proj.name, departmentIds[proj.dept], proj.desc);
          projectIds[proj.name] = created;
          console.log(`  ✓ Created (ID: ${created})`);
        } else {
          console.log(`  [DRY RUN] Would create project`);
        }
      }
    }

    // Get existing project IDs
    projectIds['Media Partnerships'] = projects.find((p: any) => p.name === 'Media Partnerships')?.id || '';
    projectIds['Video Production'] = projects.find((p: any) => p.name === 'Video Production')?.id || '';
    projectIds['Marketing Campaigns'] = projects.find((p: any) => p.name === 'Marketing Campaigns')?.id || '';
    projectIds['PR & Communications'] = projects.find((p: any) => p.name === 'PR & Communications')?.id || '';
    projectIds['Advertising'] = projects.find((p: any) => p.name === 'Advertising')?.id || '';
    projectIds['Merchandise & Apparel'] = projects.find((p: any) => p.name === 'Merchandise & Apparel')?.id || '';
    projectIds['Legal Services'] = projects.find((p: any) => p.name === 'Legal Services')?.id || '';

    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Creating Phase 2 Tasks');
    console.log('='.repeat(60));

    // Content & Media Department
    console.log('\n📁 Content & Media Department');
    await createTask(pb, projectIds['Media Partnerships'], 'P2-3 Go Throw (Media Partner)', 40000, 'Payments 3 and 4 of 4 quarterly payments');
    await createTask(pb, projectIds['Video Production'], 'P2-3 Documentary', 250000, 'All production continues');
    await createTask(pb, projectIds['Broadcasting'], 'P2 Broadcasting Staff', 150000, 'Training costs and logistics');

    // Marketing Department
    console.log('\n📁 Marketing Department');
    await createTask(pb, projectIds['Marketing Campaigns'], 'P2-3 Marketing', 320000, '$80,000 per month for 4 months');
    await createTask(pb, projectIds['PR & Communications'], 'P2-3 Public Relations', 100000, 'Launch campaign execution');
    await createTask(pb, projectIds['Advertising'], 'P2-3 Advertising', 100000, 'Launch campaign execution');
    await createTask(pb, projectIds['Merchandise & Apparel'], 'P2 Clothing and Apparel', 18300, 'First limited drop order for stores');

    // Operations Department
    console.log('\n📁 Operations Department');
    await createTask(pb, projectIds['Events'], 'P2 Mini Marketing Event', 250000, 'Mini FLO Golf League event at Turf Paradise');
    await createTask(pb, projectIds['Community Outreach'], 'P2 Local Outreach', 20000, 'Local school/college/athletic program outreach');

    // Technology Department
    console.log('\n📁 Technology Department');
    await createTask(pb, projectIds['Production Technology'], 'Pure Mobile', 200000, 'Deposit to begin production planning ($1M remaining for future phases)');

    // Legal & Compliance Department
    console.log('\n📁 Legal & Compliance Department');
    await createTask(pb, projectIds['Legal Services'], 'P2-3 Legal', 25000, 'Phase 2 legal work');

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));

    if (DRY_RUN) {
      console.log('🔍 DRY RUN COMPLETE - No changes were made');
      console.log('\nTo execute the migration, run:');
      console.log('  npx tsx scripts/migrate-to-phase2.ts');
    } else {
      console.log('✅ MIGRATION COMPLETE');
      console.log('\nPhase 2 structure created successfully!');
      console.log('\nPhase 2 Stats:');
      console.log('  - Period: October 1, 2026 - January 31, 2027');
      console.log('  - Duration: 4 months');
      console.log('  - Investment: $1,473,300');
      console.log('  - Tasks Created: 11');
      console.log('  - Projects Created: 4');
      console.log('\nNext steps:');
      console.log('  1. Add Phase 2 milestones as subtasks');
      console.log('  2. Recalculate budgets');
      console.log('  3. Verify totals');
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

async function createProject(pb: PocketBase, name: string, departmentId: string, description: string): Promise<string> {
  if (DRY_RUN) {
    return 'dry-run-id';
  }
  
  const project = await pb.collection('projects').create({
    name,
    department: departmentId,
    description,
    status: 'planned',
    type: 'campaign',
    startDate: PHASE2_START,
    endDate: PHASE2_END,
    project_budget: 0,
    project_budget_mode: 'auto',
    fiscalYear: '2027'
  });
  
  return project.id;
}

async function createTask(pb: PocketBase, projectId: string, title: string, budget: number, description: string): Promise<void> {
  console.log(`  Creating task: ${title} ($${budget.toLocaleString()})`);
  if (DRY_RUN) {
    console.log(`    [DRY RUN] Would create task`);
    return;
  }
  
  await pb.collection('tasks').create({
    title,
    projectId,
    description,
    task_budget: budget,
    startDate: PHASE2_START,
    dueDate: PHASE2_END,
    status: 'todo',
    priority: 'high'
  });
  
  console.log(`    ✓ Created task`);
}

main();
