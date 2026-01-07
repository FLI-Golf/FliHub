/**
 * Backup Database Before Phase 1 Migration
 * 
 * Creates a JSON backup of all departments, projects, and tasks
 * before executing the Phase 1 migration.
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
  console.log('📦 Creating Database Backup...\n');

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    console.log('✓ Authenticated\n');

    console.log('Fetching all data...');
    const departments = await pb.collection('departments').getFullList();
    const projects = await pb.collection('projects').getFullList();
    const tasks = await pb.collection('tasks').getFullList();

    console.log(`✓ Departments: ${departments.length}`);
    console.log(`✓ Projects: ${projects.length}`);
    console.log(`✓ Tasks: ${tasks.length}\n`);

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      collections: {
        departments,
        projects,
        tasks
      },
      summary: {
        departments: departments.length,
        projects: projects.length,
        tasks: tasks.length
      }
    };

    const backupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(backupDir, `backup-pre-phase1-${timestamp}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log('✅ Backup created successfully!');
    console.log(`📁 Location: ${backupFile}`);
    console.log(`📊 Size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB\n`);

  } catch (error: any) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

main();
