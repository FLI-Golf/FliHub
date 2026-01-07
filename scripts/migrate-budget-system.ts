/**
 * Budget System Migration Script
 * 
 * This script migrates the budget system from manual entry to bottom-up calculation:
 * - Renames existing budget fields with proper prefixes
 * - Adds new task_budget field
 * - Preserves all existing data
 * 
 * IMPORTANT: Backup your database before running this script!
 * 
 * Usage: tsx scripts/migrate-budget-system.ts
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

interface MigrationStats {
	departments: { total: number; updated: number; errors: number };
	projects: { total: number; updated: number; errors: number };
	tasks: { total: number; updated: number; errors: number };
}

async function main() {
	console.log('🚀 Starting Budget System Migration...\n');
	console.log(`📍 PocketBase URL: ${POCKETBASE_URL}\n`);

	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD in .env');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		// Authenticate as admin
		console.log('🔐 Authenticating...');
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated successfully\n');

		const stats: MigrationStats = {
			departments: { total: 0, updated: 0, errors: 0 },
			projects: { total: 0, updated: 0, errors: 0 },
			tasks: { total: 0, updated: 0, errors: 0 }
		};

		// Step 1: Migrate Departments
		console.log('📦 Step 1: Migrating Departments...');
		await migrateDepartments(pb, stats);

		// Step 2: Migrate Projects
		console.log('\n📦 Step 2: Migrating Projects...');
		await migrateProjects(pb, stats);

		// Step 3: Migrate Tasks (add new field)
		console.log('\n📦 Step 3: Migrating Tasks...');
		await migrateTasks(pb, stats);

		// Print summary
		console.log('\n' + '='.repeat(60));
		console.log('📊 MIGRATION SUMMARY');
		console.log('='.repeat(60));
		console.log(`\nDepartments:`);
		console.log(`  Total: ${stats.departments.total}`);
		console.log(`  Updated: ${stats.departments.updated}`);
		console.log(`  Errors: ${stats.departments.errors}`);
		console.log(`\nProjects:`);
		console.log(`  Total: ${stats.projects.total}`);
		console.log(`  Updated: ${stats.projects.updated}`);
		console.log(`  Errors: ${stats.projects.errors}`);
		console.log(`\nTasks:`);
		console.log(`  Total: ${stats.tasks.total}`);
		console.log(`  Updated: ${stats.tasks.updated}`);
		console.log(`  Errors: ${stats.tasks.errors}`);
		console.log('\n' + '='.repeat(60));

		if (stats.departments.errors + stats.projects.errors + stats.tasks.errors > 0) {
			console.log('\n⚠️  Migration completed with errors. Please review the logs above.');
		} else {
			console.log('\n✅ Migration completed successfully!');
		}

	} catch (error) {
		console.error('\n❌ Migration failed:', error);
		process.exit(1);
	}
}

async function migrateDepartments(pb: PocketBase, stats: MigrationStats) {
	try {
		// Fetch all departments
		const departments = await pb.collection('departments').getFullList();

		stats.departments.total = departments.length;
		console.log(`  Found ${departments.length} departments`);

		for (const dept of departments) {
			try {
				const updates: any = {};

				// Rename annualBudget to department_annual_budget
				if (dept.annualBudget !== undefined) {
					updates.department_annual_budget = dept.annualBudget;
				}

				// Initialize new fields
				updates.department_actual_expenses = 0; // Will be calculated later
				updates.department_manual_budget_override = null;

				if (Object.keys(updates).length > 0) {
					await pb.collection('departments').update(dept.id, updates);
					stats.departments.updated++;
					console.log(`  ✓ Updated department: ${dept.name}`);
				}
			} catch (error) {
				stats.departments.errors++;
				console.error(`  ✗ Error updating department ${dept.name}:`, error);
			}
		}
	} catch (error) {
		console.error('  ✗ Error fetching departments:', error);
		throw error;
	}
}

async function migrateProjects(pb: PocketBase, stats: MigrationStats) {
	try {
		// Fetch all projects
		const projects = await pb.collection('projects').getFullList();

		stats.projects.total = projects.length;
		console.log(`  Found ${projects.length} projects`);

		for (const project of projects) {
			try {
				const updates: any = {};

				// Rename budget to project_budget
				if (project.budget !== undefined) {
					updates.project_budget = project.budget;
				}

				// Rename forecastedExpenses to project_forecasted_expenses
				if (project.forecastedExpenses !== undefined) {
					updates.project_forecasted_expenses = project.forecastedExpenses;
				}

				// Rename actualExpenses to project_actual_expenses
				if (project.actualExpenses !== undefined) {
					updates.project_actual_expenses = project.actualExpenses;
				}

				// Initialize new fields
				updates.project_manual_budget_override = null;

				if (Object.keys(updates).length > 0) {
					await pb.collection('projects').update(project.id, updates);
					stats.projects.updated++;
					console.log(`  ✓ Updated project: ${project.name}`);
				}
			} catch (error) {
				stats.projects.errors++;
				console.error(`  ✗ Error updating project ${project.name}:`, error);
			}
		}
	} catch (error) {
		console.error('  ✗ Error fetching projects:', error);
		throw error;
	}
}

async function migrateTasks(pb: PocketBase, stats: MigrationStats) {
	try {
		// Fetch all tasks
		const tasks = await pb.collection('tasks').getFullList();

		stats.tasks.total = tasks.length;
		console.log(`  Found ${tasks.length} tasks`);

		for (const task of tasks) {
			try {
				const updates: any = {};

				// Add new budget fields with default values
				updates.task_budget = 0; // Default to 0, users will set this
				updates.task_actual_cost = 0; // Will be calculated from hours

				await pb.collection('tasks').update(task.id, updates);
				stats.tasks.updated++;
				
				if (stats.tasks.updated % 10 === 0) {
					console.log(`  ✓ Updated ${stats.tasks.updated}/${tasks.length} tasks...`);
				}
			} catch (error) {
				stats.tasks.errors++;
				console.error(`  ✗ Error updating task ${task.title}:`, error);
			}
		}

		console.log(`  ✓ Updated all ${stats.tasks.updated} tasks`);
	} catch (error) {
		console.error('  ✗ Error fetching tasks:', error);
		throw error;
	}
}

// Run the migration
main().catch(console.error);
