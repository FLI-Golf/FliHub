/**
 * Restore Database from Backup
 * 
 * Restores the database from a backup JSON file.
 * WARNING: This will delete all current data and restore from backup!
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const backupFile = process.argv[2] || 'backups/backup-pre-phase1-2026-01-07T07-22-24.json';

async function main() {
  console.log('🔄 Restoring Database from Backup...\n');
  console.log(`Backup file: ${backupFile}\n`);

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log(`Backup timestamp: ${backup.timestamp}`);
  console.log(`Departments: ${backup.summary.departments}`);
  console.log(`Projects: ${backup.summary.projects}`);
  console.log(`Tasks: ${backup.summary.tasks}\n`);

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    console.log('✓ Authenticated\n');

    // Delete all current data
    console.log('Deleting current data...');
    const currentTasks = await pb.collection('tasks').getFullList();
    const currentProjects = await pb.collection('projects').getFullList();
    const currentDepts = await pb.collection('departments').getFullList();

    console.log(`Deleting ${currentTasks.length} tasks...`);
    for (const task of currentTasks) {
      await pb.collection('tasks').delete(task.id);
    }

    console.log(`Deleting ${currentProjects.length} projects...`);
    for (const project of currentProjects) {
      await pb.collection('projects').delete(project.id);
    }

    console.log(`Deleting ${currentDepts.length} departments...`);
    for (const dept of currentDepts) {
      await pb.collection('departments').delete(dept.id);
    }

    console.log('✓ Current data deleted\n');

    // Restore from backup
    console.log('Restoring from backup...');

    console.log(`Restoring ${backup.collections.departments.length} departments...`);
    for (const dept of backup.collections.departments) {
      await pb.collection('departments').create(dept);
    }

    console.log(`Restoring ${backup.collections.projects.length} projects...`);
    for (const project of backup.collections.projects) {
      await pb.collection('projects').create(project);
    }

    console.log(`Restoring ${backup.collections.tasks.length} tasks...`);
    for (const task of backup.collections.tasks) {
      await pb.collection('tasks').create(task);
    }

    console.log('\n✅ Database restored successfully!');

  } catch (error: any) {
    console.error('\n❌ Restore failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

main();
