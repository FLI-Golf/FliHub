import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

type BrandingTask = {
	title: string;
	description: string;
	task_budget: number;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	checklist: string[];
	tags: string[];
};

const DEFAULT_PROJECT_ID = 'xptzufs2w7lz1j7';
const PHASE1_START = '2026-07-01';
const PHASE1_END = '2026-12-31';

const ON_COURSE_BRANDING_TASKS: BrandingTask[] = [
	{
		title: 'On-Course Branding - Tee Signage Fabrication',
		description: 'Fabricate sponsor-ready tee signs for featured holes and warm-up lanes.',
		task_budget: 22000,
		priority: 'high',
		checklist: [
			'Finalize sponsor artwork proofs and dimensions',
			'Print weather-resistant signage materials',
			'Package replacements for damage or weather loss'
		],
		tags: ['on-course-branding', 'signage', 'sponsor-delivery']
	},
	{
		title: 'On-Course Branding - Fairway Banner Production',
		description: 'Produce fairway-side banner inventory for primary broadcast camera angles.',
		task_budget: 28000,
		priority: 'high',
		checklist: [
			'Lock banner locations with venue operations',
			'Print mesh banners for wind tolerance',
			'Track sponsor inventory by event'
		],
		tags: ['on-course-branding', 'fairway', 'inventory']
	},
	{
		title: 'On-Course Branding - Grandstand Vinyl Wraps',
		description: 'Install branded vinyl wraps on grandstand rails and fan-facing structures.',
		task_budget: 32000,
		priority: 'high',
		checklist: [
			'Map high-visibility wrap zones',
			'Approve sponsor hierarchy and placement order',
			'Install and QC for wrinkles, seams, and color matching'
		],
		tags: ['on-course-branding', 'grandstand', 'installation']
	},
	{
		title: 'On-Course Branding - Broadcast Tower Assets',
		description: 'Create and stage broadcast-facing sponsor assets for tower and commentary zones.',
		task_budget: 18000,
		priority: 'medium',
		checklist: [
			'Deliver talent desk sponsor backdrops',
			'Stage tower sponsor marks for primary camera feed',
			'Confirm no visual obstruction for production'
		],
		tags: ['on-course-branding', 'broadcast', 'sponsor-delivery']
	},
	{
		title: 'On-Course Branding - VIP Entry & Step-and-Repeat',
		description: 'Build VIP entry branding package including media wall and directional graphics.',
		task_budget: 16000,
		priority: 'medium',
		checklist: [
			'Design VIP arch and media wall layout',
			'Install sponsor-compliant step-and-repeat setup',
			'Prepare backup print kit for event-day damage'
		],
		tags: ['on-course-branding', 'vip', 'media']
	},
	{
		title: 'On-Course Branding - Wayfinding & Fan Flow Signage',
		description: 'Deploy branded wayfinding signage to improve fan flow and sponsor touchpoints.',
		task_budget: 14000,
		priority: 'medium',
		checklist: [
			'Route-map fan flow corridors',
			'Place wayfinding boards at congestion points',
			'Validate sponsor exposure against placement commitments'
		],
		tags: ['on-course-branding', 'wayfinding', 'fan-experience']
	},
	{
		title: 'On-Course Branding - Daily QC & Replacement Loop',
		description: 'Run daily quality checks and replacement cycles for all active branding placements.',
		task_budget: 12000,
		priority: 'high',
		checklist: [
			'Execute morning/afternoon branding inspections',
			'Replace damaged or missing assets within SLA',
			'Capture photos for sponsor proof-of-performance'
		],
		tags: ['on-course-branding', 'operations', 'quality-control']
	},
	{
		title: 'On-Course Branding - Sponsorship Compliance Audit',
		description: 'Audit installed placements against sold commitments and report variances.',
		task_budget: 10000,
		priority: 'medium',
		checklist: [
			'Reconcile sold inventory vs installed inventory',
			'Flag and remediate missing exposure units',
			'Publish post-event sponsor compliance report'
		],
		tags: ['on-course-branding', 'compliance', 'reporting']
	}
];

function getArgValue(flag: string): string | null {
	const idx = process.argv.findIndex((arg) => arg === flag);
	if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
	const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
	return inline ? inline.slice(flag.length + 1) : null;
}

function toChecklistMarkdown(items: string[]): string {
	return items.map((item) => `- [ ] ${item}`).join('\n');
}

function mergeTags(existing: string | undefined, additions: string[]): string {
	const set = new Set<string>();
	for (const part of String(existing || '').split(',')) {
		const value = part.trim();
		if (value) set.add(value);
	}
	for (const item of additions) {
		const value = item.trim();
		if (value) set.add(value);
	}
	return Array.from(set).join(', ');
}

async function findTaskByTitle(pb: PocketBase, projectId: string, title: string): Promise<any | null> {
	const escapedTitle = title.replace(/"/g, '\\"');
	const existing = await pb.collection('tasks').getFullList({
		filter: `projectId = "${projectId}" && title = "${escapedTitle}"`,
		fields: 'id,title,tags'
	});
	return existing[0] ?? null;
}

async function main() {
	const apply = process.argv.includes('--apply');
	const projectId = getArgValue('--project') || DEFAULT_PROJECT_ID;
	const cliUrl = getArgValue('--url');

	const url = (cliUrl || process.env.POCKETBASE_URL || '').replace(/\/$/, '');
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';

	if (!url || !email || !password) {
		throw new Error('Missing required env: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD');
	}

	const pb = new PocketBase(url);
	await (pb as any).admins.authWithPassword(email, password);

	const project = await pb.collection('projects').getOne(projectId, { fields: 'id,name,status' });
	console.log(`${apply ? 'APPLY' : 'DRY-RUN'}: On-Course Branding task migration`);
	console.log(`Project: ${project.name} (${project.id})`);

	let created = 0;
	let updated = 0;
	let skipped = 0;

	for (const task of ON_COURSE_BRANDING_TASKS) {
		const existing = await findTaskByTitle(pb, projectId, task.title);
		const tags = mergeTags(existing?.tags, ['phase-1', 'pre-tournaments', ...task.tags]);

		if (!existing) {
			if (apply) {
				await pb.collection('tasks').create({
					title: task.title,
					description: task.description,
					projectId,
					status: 'todo',
					priority: task.priority,
					startDate: PHASE1_START,
					dueDate: PHASE1_END,
					task_budget: task.task_budget,
					task_actual_cost: 0,
					estimatedHours: 0,
					actualHours: 0,
					notes: 'Generated from dashboard/on-course-branding migration for Venue & Course Build.',
					tags,
					subTasksChecklist: toChecklistMarkdown(task.checklist)
				});
			}
			created += 1;
			console.log(`${apply ? 'CREATE ' : 'PLAN  '} ${task.title} ($${task.task_budget.toLocaleString()})`);
			continue;
		}

		if (existing.tags !== tags) {
			if (apply) {
				await pb.collection('tasks').update(existing.id, { tags });
			}
			updated += 1;
			console.log(`${apply ? 'UPDATE ' : 'PLAN   '} ${task.title} (tags merged)`);
		} else {
			skipped += 1;
			console.log(`SKIP   ${task.title}`);
		}
	}

	const totalBudget = ON_COURSE_BRANDING_TASKS.reduce((sum, t) => sum + t.task_budget, 0);
	console.log('');
	console.log('Summary');
	console.log(`  Tasks planned: ${ON_COURSE_BRANDING_TASKS.length}`);
	console.log(`  Tasks created: ${created}`);
	console.log(`  Tasks updated: ${updated}`);
	console.log(`  Tasks skipped: ${skipped}`);
	console.log(`  Planned budget added: $${totalBudget.toLocaleString()}`);
	console.log('  Source: dashboard/on-course-branding');

	if (!apply) {
		console.log('');
		console.log('Dry run only. Re-run with --apply to persist changes.');
	}
}

main().catch((err: any) => {
	console.error('Failed:', err?.message || err);
	if (err?.data) {
		console.error('Details:', JSON.stringify(err.data, null, 2));
	}
	process.exit(1);
});
