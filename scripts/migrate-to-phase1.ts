/**
 * Phase 1 Migration Script
 * 
 * Migrates the database from current structure to CEO's Phase 1 vision:
 * - Creates 3 new departments
 * - Renames 3 departments
 * - Deletes/archives 3 departments
 * - Deletes 39 tasks
 * - Modifies 2 tasks
 * - Creates 20 new tasks
 * - Creates 11 new projects
 * - Deletes 6 projects
 * 
 * Usage: npx tsx scripts/migrate-to-phase1.ts [--dry-run]
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const DRY_RUN = process.argv.includes('--dry-run');

const PHASE1_START = '2026-04-01 00:00:00.000Z';
const PHASE1_END = '2026-09-30 23:59:59.000Z';

interface DepartmentMap {
  [key: string]: string;
}

let departmentIds: DepartmentMap = {};
let projectIds: { [key: string]: string } = {};

async function main() {
  console.log('🚀 Phase 1 Migration Script\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE MODE (changes will be applied)'}\n`);

  if (!DRY_RUN) {
    console.log('⚠️  WARNING: This will modify the database!');
    console.log('⚠️  Make sure you have a backup before proceeding.\n');
  }

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    console.log('✓ Authenticated\n');

    // Get a default user for headOfDepartment from existing departments
    let defaultUserId = null;
    const existingDepts = await pb.collection('departments').getList(1, 1);
    if (existingDepts.items.length > 0 && existingDepts.items[0].headOfDepartment) {
      defaultUserId = existingDepts.items[0].headOfDepartment;
      console.log(`Using default user ID for new departments: ${defaultUserId}\n`);
    } else {
      console.log('⚠️  No default user found, new departments will need head assigned later\n');
    }

    // Step 1: Get current departments
    console.log('='.repeat(60));
    console.log('STEP 1: Analyzing Current Structure');
    console.log('='.repeat(60));
    const departments = await pb.collection('departments').getFullList();
    const projects = await pb.collection('projects').getFullList();
    const tasks = await pb.collection('tasks').getFullList();

    console.log(`Current: ${departments.length} departments, ${projects.length} projects, ${tasks.length} tasks\n`);

    // Create department ID map
    departments.forEach((dept: any) => {
      const name = dept.name || dept.department_name;
      departmentIds[name] = dept.id;
    });

    // Step 2: Create new departments
    console.log('='.repeat(60));
    console.log('STEP 2: Creating New Departments');
    console.log('='.repeat(60));

    const newDepartments = [
      { name: 'Executive', budget: 1200000, description: 'Executive leadership and strategic initiatives' },
      { name: 'Legal & Compliance', budget: 150000, description: 'Legal services and regulatory compliance' },
      { name: 'Player Development', budget: 300000, description: 'Player sponsorships and development programs' }
    ];

    for (const dept of newDepartments) {
      console.log(`Creating: ${dept.name} ($${dept.budget.toLocaleString()})`);
      if (!DRY_RUN) {
        const deptData: any = {
          name: dept.name,
          description: dept.description,
          annualBudget: dept.budget,
          department_annual_budget: dept.budget,
          department_budget_mode: 'auto',
          status: 'active'
        };
        
        if (defaultUserId) {
          deptData.headOfDepartment = defaultUserId;
        }
        
        const created = await pb.collection('departments').create(deptData);
        departmentIds[dept.name] = created.id;
        console.log(`  ✓ Created with ID: ${created.id}`);
      } else {
        console.log(`  [DRY RUN] Would create department`);
      }
    }
    console.log();

    // Step 3: Rename departments
    console.log('='.repeat(60));
    console.log('STEP 3: Renaming Departments');
    console.log('='.repeat(60));

    const renameMap = [
      { old: 'Production', new: 'Content & Media' },
      { old: 'Technical', new: 'Technology' },
      { old: 'Marketing & PR', new: 'Marketing' }
    ];

    for (const rename of renameMap) {
      const deptId = departmentIds[rename.old];
      if (deptId) {
        console.log(`Renaming: ${rename.old} → ${rename.new}`);
        if (!DRY_RUN) {
          await pb.collection('departments').update(deptId, { name: rename.new });
          departmentIds[rename.new] = deptId;
          delete departmentIds[rename.old];
          console.log(`  ✓ Renamed`);
        } else {
          console.log(`  [DRY RUN] Would rename department`);
        }
      }
    }
    console.log();

    // Step 4: Delete/Archive departments
    console.log('='.repeat(60));
    console.log('STEP 4: Archiving Departments (Not in Phase 1)');
    console.log('='.repeat(60));

    const archiveDepts = ['Sales', 'Clothing', 'Course Construction'];
    for (const deptName of archiveDepts) {
      const deptId = departmentIds[deptName];
      if (deptId) {
        console.log(`Archiving: ${deptName}`);
        if (!DRY_RUN) {
          await pb.collection('departments').update(deptId, { status: 'inactive' });
          console.log(`  ✓ Archived (status set to inactive)`);
        } else {
          console.log(`  [DRY RUN] Would archive department`);
        }
      }
    }
    console.log();

    // Step 5: Delete projects not in Phase 1
    console.log('='.repeat(60));
    console.log('STEP 5: Deleting Projects Not in Phase 1');
    console.log('='.repeat(60));

    const deleteProjects = [
      'Launch All Clothing',
      'Acquire sponsors',
      'Revenue streams',
      'Build Disc Golf Course',
      'Legal Framework',
      'Marketing Details'
    ];

    for (const projName of deleteProjects) {
      const project = projects.find((p: any) => (p.name || p.project_name) === projName);
      if (project) {
        console.log(`Deleting project: ${projName} (${project.id})`);
        
        // First delete all tasks in this project
        const projTasks = tasks.filter((t: any) => 
          t.projectId === project.id || t.project === project.id || t.task_project_id === project.id
        );
        
        console.log(`  - Deleting ${projTasks.length} tasks...`);
        if (!DRY_RUN) {
          for (const task of projTasks) {
            await pb.collection('tasks').delete(task.id);
          }
          await pb.collection('projects').delete(project.id);
          console.log(`  ✓ Deleted project and ${projTasks.length} tasks`);
        } else {
          console.log(`  [DRY RUN] Would delete project and ${projTasks.length} tasks`);
        }
      }
    }
    console.log();

    // Step 6: Delete remaining tasks not in Phase 1
    console.log('='.repeat(60));
    console.log('STEP 6: Deleting Remaining Tasks Not in Phase 1');
    console.log('='.repeat(60));

    const operationsProject = projects.find((p: any) => (p.name || p.project_name) === 'Operation details');
    if (operationsProject) {
      const deleteTaskNames = [
        'Payment 1',
        'Final Players are signed on letters of intent',
        'Tournament schedule is announced',
        'Set up accounting',
        'Internal cost process analysis',
        'Analyze trends',
        'Funding Meetings / Update',
        'Headquarters',
        'Landscape / Real Estate'
      ];

      for (const taskName of deleteTaskNames) {
        const task = tasks.find((t: any) => 
          (t.title || t.task_name || t.name) === taskName &&
          (t.projectId === operationsProject.id || t.project === operationsProject.id)
        );
        
        if (task) {
          console.log(`Deleting task: ${taskName}`);
          if (!DRY_RUN) {
            await pb.collection('tasks').delete(task.id);
            console.log(`  ✓ Deleted`);
          } else {
            console.log(`  [DRY RUN] Would delete task`);
          }
        }
      }
    }
    console.log();

    // Step 7: Modify existing tasks
    console.log('='.repeat(60));
    console.log('STEP 7: Modifying Existing Tasks');
    console.log('='.repeat(60));

    // Modify: Office Locations → P1 Office Upgrades
    const officeTask = tasks.find((t: any) => (t.title || t.task_name) === 'Office Locations');
    if (officeTask) {
      console.log('Modifying: Office Locations → P1 Office Upgrades');
      if (!DRY_RUN) {
        await pb.collection('tasks').update(officeTask.id, {
          title: 'P1 Office Upgrades',
          task_budget: 5000,
          startDate: PHASE1_START,
          dueDate: PHASE1_END,
          status: 'todo'
        });
        console.log(`  ✓ Modified`);
      } else {
        console.log(`  [DRY RUN] Would modify task`);
      }
    }

    // Modify: Sizzle Reel → P1 Sizzle Reel Development
    const sizzleTask = tasks.find((t: any) => (t.title || t.task_name) === 'Sizzle Reel');
    if (sizzleTask) {
      console.log('Modifying: Sizzle Reel → P1 Sizzle Reel Development');
      if (!DRY_RUN) {
        await pb.collection('tasks').update(sizzleTask.id, {
          title: 'P1 Sizzle Reel Development',
          task_budget: 5000,
          startDate: PHASE1_START,
          dueDate: PHASE1_END,
          status: 'todo'
        });
        console.log(`  ✓ Modified`);
      } else {
        console.log(`  [DRY RUN] Would modify task`);
      }
    }
    console.log();

    // Step 8: Create new projects and tasks
    console.log('='.repeat(60));
    console.log('STEP 8: Creating Phase 1 Projects and Tasks');
    console.log('='.repeat(60));

    // Executive Department
    console.log('\n📁 Executive Department');
    const execProject = await createProject(pb, 'Executive Salaries & Benefits', departmentIds['Executive'], 'Salaries and benefits for executive team');
    await createTask(pb, execProject, 'P1 Executive Staff', 1140000, 'Executive team salaries for Phase 1');
    await createTask(pb, execProject, 'P1 Travel Expenses', 60000, 'Travel expenses for securing league partnerships');

    // Operations Department
    console.log('\n📁 Operations Department');
    const facilitiesProject = await createProject(pb, 'Facilities Management', departmentIds['Operations'], 'Office facilities and operations');
    await createTask(pb, facilitiesProject, 'P1 Office Staff', 286000, 'Office staff salaries');
    await createTask(pb, facilitiesProject, 'P1 San Diego Office', 95000, 'San Diego office yearly expenses');
    await createTask(pb, facilitiesProject, 'P1 Scottsdale Office', 48000, 'Scottsdale office yearly expenses');
    await createTask(pb, facilitiesProject, 'P1 Utilities', 48000, 'Utilities for both offices');

    const itProject = await createProject(pb, 'IT Services', departmentIds['Operations'], 'IT infrastructure and services');
    await createTask(pb, itProject, 'P1 Mobile Data', 10000, 'Staff and office connectivity');

    // Marketing Department
    console.log('\n📁 Marketing Department');
    const marketingCampaignsProject = await createProject(pb, 'Marketing Campaigns', departmentIds['Marketing'], 'Marketing campaigns and initiatives');
    await createTask(pb, marketingCampaignsProject, 'P1-3 Marketing', 60000, '$10k per month for 6 months');

    const prProject = await createProject(pb, 'PR & Communications', departmentIds['Marketing'], 'Public relations and communications');
    await createTask(pb, prProject, 'P1-3 Public Relations', 30000, 'Launch campaign PR');

    const advertisingProject = await createProject(pb, 'Advertising', departmentIds['Marketing'], 'Advertising campaigns');
    await createTask(pb, advertisingProject, 'P1-3 Advertising', 50000, 'Launch campaign advertising');

    const merchandiseProject = await createProject(pb, 'Merchandise & Apparel', departmentIds['Marketing'], 'Branded merchandise and apparel');
    await createTask(pb, merchandiseProject, 'P1 Clothing/Shoes/Apparel', 18300, 'Initial sponsored player and marketing order');

    // Technology Department
    console.log('\n📁 Technology Department');
    const appDevProject = await createProject(pb, 'App Development', departmentIds['Technology'], 'Mobile and web application development');
    await createTask(pb, appDevProject, 'P1 Tech/App Development', 150000, 'Phase 1 app development');

    const infraProject = await createProject(pb, 'Infrastructure', departmentIds['Technology'], 'Technology infrastructure');
    await createTask(pb, infraProject, 'P1 Hardware/Software', 18000, 'Hardware and software for both offices');

    // Legal & Compliance Department
    console.log('\n📁 Legal & Compliance Department');
    const legalProject = await createProject(pb, 'Legal Services', departmentIds['Legal & Compliance'], 'Legal services and counsel');
    await createTask(pb, legalProject, 'P1-3 Legal', 50000, 'Phase 1 legal work');

    const licensingProject = await createProject(pb, 'Licensing & Permits', departmentIds['Legal & Compliance'], 'Gaming licenses and permits');
    await createTask(pb, licensingProject, 'P1 State Gaming Licensing', 100000, 'Gaming licenses for key states');

    // Player Development Department
    console.log('\n📁 Player Development Department');
    const playerProject = await createProject(pb, 'Player Sponsorships', departmentIds['Player Development'], 'Professional player sponsorships');
    await createTask(pb, playerProject, 'P1 MPO/FPO Sponsored Players', 300000, 'Sponsored player contracts');

    // Content & Media Department
    console.log('\n📁 Content & Media Department');
    const mediaProject = await createProject(pb, 'Media Partnerships', departmentIds['Content & Media'], 'Media partnerships and collaborations');
    await createTask(pb, mediaProject, 'P1-3 Go Throw (Media Partner)', 40000, 'Quarterly payments 1 and 2 of 4');

    const videoProject = await createProject(pb, 'Video Production', departmentIds['Content & Media'], 'Video content production');
    await createTask(pb, videoProject, 'P1-3 Documentary/Sizzle Reel', 100000, 'Initial product purchase and production staff');

    // Finance Department
    console.log('\n📁 Finance Department');
    const payrollProject = await createProject(pb, 'Payroll & Benefits', departmentIds['Finance'], 'Payroll processing and benefits administration');
    await createTask(pb, payrollProject, 'P1 Payroll/Insurance/Relocation', 106000, 'Payroll, insurance, and relocation expenses');

    const contingencyProject = await createProject(pb, 'Contingency', departmentIds['Finance'], 'Contingency and miscellaneous expenses');
    await createTask(pb, contingencyProject, 'P1 Misc', 80700, 'Miscellaneous expenses');

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));

    if (DRY_RUN) {
      console.log('🔍 DRY RUN COMPLETE - No changes were made');
      console.log('\nTo execute the migration, run:');
      console.log('  npx tsx scripts/migrate-to-phase1.ts');
    } else {
      console.log('✅ MIGRATION COMPLETE');
      console.log('\nPhase 1 structure created successfully!');
      console.log('Next steps:');
      console.log('  1. Run budget recalculation: npx tsx scripts/recalculate-all-budgets.ts');
      console.log('  2. Verify totals match $2,800,000');
      console.log('  3. Review in the application');
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
  console.log(`  Creating project: ${name}`);
  if (DRY_RUN) {
    console.log(`    [DRY RUN] Would create project`);
    return 'dry-run-id';
  }
  
  const project = await pb.collection('projects').create({
    name,
    department: departmentId,
    description,
    status: 'planned',
    type: 'campaign', // Default type for Phase 1 projects
    startDate: PHASE1_START,
    endDate: PHASE1_END,
    project_budget: 0,
    project_budget_mode: 'auto',
    fiscalYear: '2026'
  });
  
  console.log(`    ✓ Created project (ID: ${project.id})`);
  return project.id;
}

async function createTask(pb: PocketBase, projectId: string, title: string, budget: number, description: string): Promise<void> {
  console.log(`    Creating task: ${title} ($${budget.toLocaleString()})`);
  if (DRY_RUN) {
    console.log(`      [DRY RUN] Would create task`);
    return;
  }
  
  await pb.collection('tasks').create({
    title,
    projectId,
    description,
    task_budget: budget,
    startDate: PHASE1_START,
    dueDate: PHASE1_END,
    status: 'todo',
    priority: 'medium'
  });
  
  console.log(`      ✓ Created task`);
}

main();
