/**
 * Export current database structure for analysis
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
  const pb = new PocketBase(POCKETBASE_URL);

  try {
    // Try admin auth first
    try {
      await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
      console.log('✓ Authenticated as admin\n');
    } catch (adminErr: any) {
      console.log('Admin auth failed, trying user auth...');
      await pb.collection('users').authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
      console.log('✓ Authenticated as user\n');
    }

    console.log('Fetching departments...');
    const departments = await pb.collection('departments').getFullList();
    console.log(`✓ Found ${departments.length} departments\n`);
    
    console.log('Fetching projects...');
    const projects = await pb.collection('projects').getFullList({ expand: 'project_department_id' });
    console.log(`✓ Found ${projects.length} projects\n`);
    
    console.log('Fetching tasks...');
    const tasks = await pb.collection('tasks').getFullList({ expand: 'task_project_id' });
    console.log(`✓ Found ${tasks.length} tasks\n`);

    console.log('=== CURRENT DATABASE STRUCTURE ===\n');
    
    for (const dept of departments) {
      const deptName = (dept as any).department_name || (dept as any).name || 'Unknown';
      const deptBudget = (dept as any).department_annual_budget || (dept as any).annualBudget || 0;
      const deptMode = (dept as any).department_budget_mode || (dept as any).budgetMode || 'auto';
      
      console.log(`\n📁 DEPARTMENT: ${deptName}`);
      console.log(`   ID: ${dept.id}`);
      console.log(`   Budget: $${deptBudget}`);
      console.log(`   Mode: ${deptMode}`);
      
      const deptProjects = projects.filter((p: any) => 
        p.department === dept.id || p.project_department_id === dept.id || p.departmentId === dept.id
      );
      
      for (const proj of deptProjects) {
        const projName = (proj as any).project_name || (proj as any).name || 'Unknown';
        const projBudget = (proj as any).project_budget || (proj as any).budget || 0;
        const projMode = (proj as any).project_budget_mode || (proj as any).budgetMode || 'auto';
        const projStatus = (proj as any).project_status || (proj as any).status || 'unknown';
        
        console.log(`\n   📂 PROJECT: ${projName}`);
        console.log(`      ID: ${proj.id}`);
        console.log(`      Budget: $${projBudget}`);
        console.log(`      Mode: ${projMode}`);
        console.log(`      Status: ${projStatus}`);
        
        const projTasks = tasks.filter((t: any) => 
          t.projectId === proj.id || t.project === proj.id || t.task_project_id === proj.id
        );
        
        if (projTasks.length > 0) {
          console.log(`      Tasks (${projTasks.length}):`);
          for (const task of projTasks) {
            const taskName = (task as any).title || (task as any).task_name || (task as any).name || 'Unknown';
            const taskBudget = (task as any).task_budget || (task as any).budget || 0;
            const taskStatus = (task as any).status || (task as any).task_status || 'unknown';
            const taskStart = (task as any).startDate || (task as any).task_start_date;
            const taskEnd = (task as any).dueDate || (task as any).task_end_date || (task as any).endDate;
            
            console.log(`         • ${taskName}`);
            console.log(`           Budget: $${taskBudget} | Status: ${taskStatus}`);
            if (taskStart || taskEnd) {
              console.log(`           Dates: ${taskStart || 'N/A'} → ${taskEnd || 'N/A'}`);
            }
          }
        } else {
          console.log(`      Tasks: None`);
        }
      }
    }

    console.log('\n\n=== SUMMARY ===');
    console.log(`Departments: ${departments.length}`);
    console.log(`Projects: ${projects.length}`);
    console.log(`Tasks: ${tasks.length}`);

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

main();
