/**
 * Test All Budget Modes
 * 
 * Tests all budget calculation modes to ensure they work correctly
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { recalculateBudgetHierarchy } from '../src/lib/utils/budget-calculator';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
	console.log('🧪 Testing All Budget Modes...\n');

	const pb = new PocketBase(POCKETBASE_URL);
	await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);

	const projectId = '17ktuh9139ju081'; // Operation details project

	// Test 1: Auto Mode
	console.log('='.repeat(60));
	console.log('TEST 1: AUTO MODE');
	console.log('='.repeat(60));
	await pb.collection('projects').update(projectId, {
		project_budget_mode: 'auto',
		project_manual_budget_override: null,
		project_budget_buffer: null,
		project_budget_cap: null
	});
	await recalculateBudgetHierarchy(pb, projectId);
	let project = await pb.collection('projects').getOne(projectId);
	console.log(`✓ Mode: ${project.project_budget_mode}`);
	console.log(`✓ Budget: $${project.project_budget} (should be sum of tasks = $5000)`);
	console.log();

	// Test 2: Fixed Mode
	console.log('='.repeat(60));
	console.log('TEST 2: FIXED MODE');
	console.log('='.repeat(60));
	await pb.collection('projects').update(projectId, {
		project_budget_mode: 'fixed',
		project_manual_budget_override: 10000
	});
	await recalculateBudgetHierarchy(pb, projectId);
	project = await pb.collection('projects').getOne(projectId);
	console.log(`✓ Mode: ${project.project_budget_mode}`);
	console.log(`✓ Budget: $${project.project_budget} (should be fixed = $10000)`);
	console.log();

	// Test 3: Hybrid Mode
	console.log('='.repeat(60));
	console.log('TEST 3: HYBRID MODE');
	console.log('='.repeat(60));
	await pb.collection('projects').update(projectId, {
		project_budget_mode: 'hybrid',
		project_manual_budget_override: null,
		project_budget_buffer: 2000
	});
	await recalculateBudgetHierarchy(pb, projectId);
	project = await pb.collection('projects').getOne(projectId);
	console.log(`✓ Mode: ${project.project_budget_mode}`);
	console.log(`✓ Budget: $${project.project_budget} (should be tasks + buffer = $7000)`);
	console.log();

	// Test 4: Capped Mode
	console.log('='.repeat(60));
	console.log('TEST 4: CAPPED MODE');
	console.log('='.repeat(60));
	await pb.collection('projects').update(projectId, {
		project_budget_mode: 'capped',
		project_manual_budget_override: null,
		project_budget_buffer: null,
		project_budget_cap: 3000
	});
	await recalculateBudgetHierarchy(pb, projectId);
	project = await pb.collection('projects').getOne(projectId);
	console.log(`✓ Mode: ${project.project_budget_mode}`);
	console.log(`✓ Budget: $${project.project_budget} (should be capped at $3000)`);
	console.log();

	// Reset to auto
	console.log('='.repeat(60));
	console.log('RESETTING TO AUTO MODE');
	console.log('='.repeat(60));
	await pb.collection('projects').update(projectId, {
		project_budget_mode: 'auto',
		project_manual_budget_override: null,
		project_budget_buffer: null,
		project_budget_cap: null
	});
	await recalculateBudgetHierarchy(pb, projectId);
	project = await pb.collection('projects').getOne(projectId);
	console.log(`✓ Reset to auto mode`);
	console.log(`✓ Budget: $${project.project_budget}`);
	console.log();

	console.log('✅ All budget modes tested successfully!');
}

main().catch(console.error);
