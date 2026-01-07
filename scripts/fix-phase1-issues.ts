/**
 * Fix Phase 1 Migration Issues
 * 
 * Fixes issues found in verification:
 * 1. Set Content & Media to active
 * 2. Delete remaining old tasks not in Phase 1
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
  console.log('🔧 Fixing Phase 1 Issues...\n');

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);

    // Fix 1: Set Content & Media to active
    console.log('1. Setting Content & Media to active...');
    const departments = await pb.collection('departments').getFullList();
    const contentMedia = departments.find((d: any) => d.name === 'Content & Media');
    
    if (contentMedia && (contentMedia as any).status !== 'active') {
      await pb.collection('departments').update(contentMedia.id, { status: 'active' });
      console.log('   ✓ Content & Media set to active\n');
    } else {
      console.log('   ✓ Content & Media already active\n');
    }

    // Fix 2: Delete old tasks not in Phase 1
    console.log('2. Deleting old tasks not in Phase 1...');
    const tasks = await pb.collection('tasks').getFullList({ expand: 'projectId' });
    const projects = await pb.collection('projects').getFullList();

    // Find old projects that should have been deleted
    const oldProjectNames = ['Production Equipment Quote', 'App & Website Refactor'];
    const oldProjects = projects.filter((p: any) => oldProjectNames.includes(p.name));

    for (const project of oldProjects) {
      const projTasks = tasks.filter((t: any) => t.projectId === project.id);
      console.log(`   Deleting project: ${(project as any).name} (${projTasks.length} tasks)`);
      
      for (const task of projTasks) {
        await pb.collection('tasks').delete(task.id);
      }
      
      await pb.collection('projects').delete(project.id);
      console.log(`   ✓ Deleted project and ${projTasks.length} tasks`);
    }

    // Fix 3: Delete orphaned tasks (tasks with no project)
    console.log('\n3. Deleting orphaned tasks...');
    const allTasks = await pb.collection('tasks').getFullList();
    const orphanedTasks = allTasks.filter((t: any) => !t.projectId);
    
    for (const task of orphanedTasks) {
      console.log(`   Deleting: ${(task as any).title}`);
      await pb.collection('tasks').delete(task.id);
    }
    console.log(`   ✓ Deleted ${orphanedTasks.length} orphaned tasks\n`);

    // Fix 4: Add missing P1 Sizzle Reel Development task
    console.log('4. Adding missing P1 Sizzle Reel Development task...');
    const videoProject = projects.find((p: any) => p.name === 'Video Production');
    
    if (videoProject) {
      await pb.collection('tasks').create({
        title: 'P1 Sizzle Reel Development',
        projectId: videoProject.id,
        description: 'Sizzle reel development work',
        task_budget: 5000,
        startDate: '2026-04-01 00:00:00.000Z',
        dueDate: '2026-09-30 23:59:59.000Z',
        status: 'todo',
        priority: 'medium'
      });
      console.log('   ✓ Created P1 Sizzle Reel Development task\n');
    }

    console.log('✅ All fixes applied successfully!');
    console.log('\nRun verification again: npx tsx scripts/verify-phase1.ts');

  } catch (error: any) {
    console.error('❌ Fix failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

main();
