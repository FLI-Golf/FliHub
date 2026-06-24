import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

type StadiumTask = {
	title: string;
	description: string;
	task_budget: number;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	checklist: string[];
};

type AssignmentRule = {
	titleIncludes: string[];
	vendorKeywords: string[];
	departmentKeywords: string[];
	vendorBucket: 'materials' | 'turf' | 'tools' | 'safety' | 'reserve';
};

const DEFAULT_PROJECT_ID = 'xptzufs2w7lz1j7';

const STADIUM_TASKS: StadiumTask[] = [
	{
		title: 'Stadium Course #1 - Structural Lumber & Framing',
		description: 'Procure and stage structural lumber and framing package for obstacle buildout.',
		task_budget: 90000,
		priority: 'urgent',
		checklist: [
			'~130 boards per obstacle (2x4 and 2x6 mix)',
			'$6,000 per obstacle allocation',
			'Includes bracing, base frames, delivery, and waste'
		]
	},
	{
		title: 'Stadium Course #1 - Plywood & Surface Paneling',
		description: 'Purchase plywood and surface paneling for camera-ready obstacle faces.',
		task_budget: 45000,
		priority: 'high',
		checklist: [
			'~177 sheets (4x8) after 25% waste factor',
			'$3,000 per obstacle allocation',
			'Branding-swap-ready panel surfaces'
		]
	},
	{
		title: 'Stadium Course #1 - Artificial Turf (Tee Boxes)',
		description: 'Install sports-grade turf systems for tee boxes and warmup pads.',
		task_budget: 35000,
		priority: 'high',
		checklist: [
			'9 tee boxes x 72 sq ft = 648 sq ft',
			'Sports-grade turf + shock pad + adhesive',
			'Include spares and warmup pads for two-round tournament play'
		]
	},
	{
		title: 'Stadium Course #1 - Reinforcement & Anchoring',
		description: 'Install steel reinforcement, base anchoring, and impact-zone safety bracing.',
		task_budget: 30000,
		priority: 'high',
		checklist: [
			'$2,000 per obstacle allocation',
			'Steel brackets and base anchoring',
			'Padding in high-impact zones'
		]
	},
	{
		title: 'Stadium Course #1 - Hardware & Fasteners',
		description: 'Source all screws, lag bolts, adhesives, and anchors for full build cycle.',
		task_budget: 20000,
		priority: 'medium',
		checklist: [
			'~1,000 fastener units per obstacle',
			'$1,333 per obstacle allocation',
			'Include screws, lag bolts, brackets, adhesives, and anchors'
		]
	},
	{
		title: 'Stadium Course #1 - Materials Contingency',
		description: 'Reserve contingency for waste, cut loss, and material price fluctuation.',
		task_budget: 30000,
		priority: 'medium',
		checklist: [
			'12% of materials total',
			'Cover waste and cut-loss variability',
			'Prevent emergency mid-build funding'
		]
	},
	{
		title: 'Stadium Course #1 - Major Power Tools & Cutting',
		description: 'Acquire core power tools, generators, and cutting equipment for construction crews.',
		task_budget: 15000,
		priority: 'high',
		checklist: [
			'2x table saws, 2x miter saws, 4x circular saws',
			'6x drill/driver kits and 2x generators',
			'Air compressor and contingency buffer'
		]
	},
	{
		title: 'Stadium Course #1 - Framing & Fastening Equipment',
		description: 'Procure framing nailers, specialty fastening systems, and power support gear.',
		task_budget: 8000,
		priority: 'medium',
		checklist: [
			'Framing and finish nailers',
			'Specialty fastener systems',
			'Extra batteries, chargers, and extension power'
		]
	},
	{
		title: 'Stadium Course #1 - Turf Installation Equipment',
		description: 'Acquire specialized turf installation and finishing equipment.',
		task_budget: 5000,
		priority: 'medium',
		checklist: [
			'Seaming and cutter tools',
			'Carpet stretcher and adhesive rollers',
			'Plate compactor and trim tools'
		]
	},
	{
		title: 'Stadium Course #1 - Material Handling & Setup',
		description: 'Equip teams with scaffolding, ladders, carts, and staging benches.',
		task_budget: 10000,
		priority: 'medium',
		checklist: [
			'Modular scaffolding package',
			'Extension ladders and A-frame ladders',
			'Hydraulic lift carts, hand trucks, and work benches'
		]
	},
	{
		title: 'Stadium Course #1 - Safety Equipment',
		description: 'Stock PPE, safety lines, signage, and first aid for build operations.',
		task_budget: 4000,
		priority: 'high',
		checklist: [
			'Harnesses and safety lines',
			'PPE inventory plus eye and ear protection',
			'Safety signage and first aid kits'
		]
	},
	{
		title: 'Stadium Course #1 - Maintenance & Replacement Reserve',
		description: 'Reserve budget for tool wear, repairs, and replacement consumables.',
		task_budget: 8000,
		priority: 'low',
		checklist: [
			'Saw blades, bits, and worn batteries',
			'Tool repairs and emergency replacement',
			'Heavy-use consumables reserve (16% of tools budget)'
		]
	},
	{
		title: 'Stadium Course #1 - Expansion Reserve (1-3 Obstacles)',
		description: 'Hold expansion reserve for adding 1-3 obstacles after initial build validation.',
		task_budget: 30000,
		priority: 'medium',
		checklist: [
			'Budget available for incremental obstacle additions',
			'Use post-build performance data to prioritize adds',
			'Release in tranches only after scope approval'
		]
	}
];

const PHASE1_START = '2026-07-01';
const PHASE1_END = '2026-12-31';

const ASSIGNMENT_RULES: AssignmentRule[] = [
	{
		titleIncludes: ['Structural Lumber & Framing', 'Plywood & Surface Paneling', 'Reinforcement & Anchoring'],
		vendorKeywords: ['lumber', 'timber', 'construction', 'building', 'structural', 'steel', 'anchor', 'hardware'],
		departmentKeywords: ['operations', 'production', 'technical', 'product development'],
		vendorBucket: 'materials'
	},
	{
		titleIncludes: ['Artificial Turf', 'Turf Installation Equipment'],
		vendorKeywords: ['turf', 'landscape', 'sports', 'surface', 'floor'],
		departmentKeywords: ['operations', 'production'],
		vendorBucket: 'turf'
	},
	{
		titleIncludes: ['Hardware & Fasteners', 'Major Power Tools & Cutting', 'Framing & Fastening Equipment', 'Material Handling & Setup', 'Maintenance & Replacement Reserve'],
		vendorKeywords: ['tool', 'equipment', 'rental', 'industrial', 'hardware', 'supply'],
		departmentKeywords: ['operations', 'technical', 'production'],
		vendorBucket: 'tools'
	},
	{
		titleIncludes: ['Safety Equipment'],
		vendorKeywords: ['safety', 'ppe', 'protective', 'medical'],
		departmentKeywords: ['operations', 'legal', 'compliance'],
		vendorBucket: 'safety'
	},
	{
		titleIncludes: ['Materials Contingency', 'Expansion Reserve'],
		vendorKeywords: ['construction', 'supply', 'contractor'],
		departmentKeywords: ['operations', 'executive', 'finance'],
		vendorBucket: 'reserve'
	}
];

function getArgValue(flag: string): string | null {
	const idx = process.argv.findIndex((arg) => arg === flag);
	if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
	const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
	return inline ? inline.slice(flag.length + 1) : null;
}

async function findTaskByTitle(pb: PocketBase, projectId: string, title: string): Promise<any | null> {
	const escapedTitle = title.replace(/"/g, '\\"');
	const existing = await pb.collection('tasks').getFullList({
		filter: `projectId = "${projectId}" && title = "${escapedTitle}"`,
		fields: 'id,title'
	});
	return existing[0] ?? null;
}

function toChecklistMarkdown(items: string[]): string {
	return items.map((item) => `- [ ] ${item}`).join('\n');
}

function norm(value: string): string {
	return String(value || '').toLowerCase();
}

function scoreText(value: string, keywords: string[]): number {
	const text = norm(value);
	let score = 0;
	for (const kw of keywords) {
		if (text.includes(norm(kw))) score += 1;
	}
	return score;
}

function selectRule(taskTitle: string): AssignmentRule {
	for (const rule of ASSIGNMENT_RULES) {
		if (rule.titleIncludes.some((token) => taskTitle.includes(token))) {
			return rule;
		}
	}
	return ASSIGNMENT_RULES[0];
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

function upsertAssignmentNotes(existingNotes: string | undefined, lines: string[]): string {
	const base = String(existingNotes || '').trim();
	const blockHeader = 'Auto-assignment (Phase 1 · Pre-Tournaments):';
	const filtered = base
		.split('\n')
		.filter((line) => !line.includes('Auto-assignment (Phase 1 · Pre-Tournaments):') && !line.includes('Assigned Department:') && !line.includes('Preferred Vendor:') && !line.includes('Phase Window:'))
		.join('\n')
		.trim();
	const block = [blockHeader, ...lines].join('\n');
	return filtered ? `${filtered}\n\n${block}` : block;
}

function slug(value: string): string {
	return norm(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function runSecondPass(pb: PocketBase, projectId: string, apply: boolean): Promise<void> {
	const [project, tasks, vendors, departments] = await Promise.all([
		pb.collection('projects').getOne(projectId, { fields: 'id,name,department,vendors' }),
		pb.collection('tasks').getFullList({
			filter: `projectId = "${projectId}" && title ~ "Stadium Course #1"`,
			fields: 'id,title,notes,tags,assignedTo,status,startDate,dueDate'
		}),
		pb.collection('vendors').getFullList({ fields: 'id,name,type,active', sort: 'name' }),
		pb.collection('departments').getFullList({ fields: 'id,name,headOfDepartment,status', sort: 'name' })
	]);

	const activeVendors = vendors.filter((v: any) => v.active !== false);
	const activeDepartments = departments.filter((d: any) => String(d.status || '').toLowerCase() !== 'archived');

	const findBestDepartment = (keywords: string[]) => {
		let best: any = null;
		let bestScore = -1;
		for (const dept of activeDepartments) {
			const score = scoreText(String(dept.name || ''), keywords);
			if (score > bestScore) {
				best = dept;
				bestScore = score;
			}
		}
		return best;
	};

	const findVendorCandidates = (keywords: string[]) => {
		const candidates = activeVendors.map((vendor: any) => {
			const vendorType = Array.isArray(vendor.type)
				? vendor.type.join(' ')
				: String(vendor.type || '');
			const text = `${vendor.name || ''} ${vendorType}`;
			const score = scoreText(text, keywords);
			return { vendor, score };
		});
		return candidates
			.filter((entry) => entry.score > 0)
			.sort((a, b) => b.score - a.score || String(a.vendor.name || '').localeCompare(String(b.vendor.name || '')));
	};

	const fallbackDepartment =
		findBestDepartment(['operations', 'production', 'technical', 'venue', 'course']) ||
		activeDepartments[0] ||
		null;

	let taskUpdated = 0;
	let taskUnchanged = 0;
	let withVendorMatch = 0;
	let withDepartmentMatch = 0;
	const matchedVendorIds = new Set<string>(Array.isArray((project as any).vendors) ? (project as any).vendors : []);
	const bucketVendorPick = new Map<string, string>();

	for (const task of tasks as any[]) {
		const rule = selectRule(task.title);
		const department = findBestDepartment(rule.departmentKeywords) || fallbackDepartment;
		const candidates = findVendorCandidates(rule.vendorKeywords);
		let vendor: any = null;

		if (candidates.length > 0) {
			const preferredId = bucketVendorPick.get(rule.vendorBucket);
			if (preferredId) {
				vendor = candidates.find((c) => c.vendor.id === preferredId)?.vendor ?? null;
			}

			if (!vendor) {
				const unused = candidates.find((c) => !Array.from(bucketVendorPick.values()).includes(c.vendor.id));
				vendor = (unused ?? candidates[0]).vendor;
				bucketVendorPick.set(rule.vendorBucket, vendor.id);
			}
		}

		if (vendor?.id) matchedVendorIds.add(vendor.id);
		if (vendor) withVendorMatch += 1;
		if (department) withDepartmentMatch += 1;

		const nextTags = mergeTags(task.tags, [
			'phase-1',
			'pre-tournaments',
			department?.name ? `dept:${slug(department.name)}` : '',
			vendor?.name ? `vendor:${slug(vendor.name)}` : ''
		]);

		const nextNotes = upsertAssignmentNotes(task.notes, [
			`Assigned Department: ${department?.name || 'Unassigned'}`,
			`Preferred Vendor: ${vendor?.name || 'No keyword match found'}`,
			`Phase Window: ${PHASE1_START} → ${PHASE1_END}`
		]);

		const payload: Record<string, any> = {
			startDate: PHASE1_START,
			dueDate: PHASE1_END,
			tags: nextTags,
			notes: nextNotes
		};

		if (task.status !== 'completed' && task.status !== 'cancelled') {
			payload.status = 'todo';
		}

		if (department?.headOfDepartment) {
			payload.assignedTo = department.headOfDepartment;
		}

		const changed =
			task.startDate !== payload.startDate ||
			task.dueDate !== payload.dueDate ||
			task.tags !== payload.tags ||
			task.notes !== payload.notes ||
			(task.status !== payload.status && payload.status !== undefined) ||
			(payload.assignedTo !== undefined && task.assignedTo !== payload.assignedTo);

		if (!changed) {
			taskUnchanged += 1;
			console.log(`PASS2-SKIP ${task.title}`);
			continue;
		}

		if (apply) {
			await pb.collection('tasks').update(task.id, payload);
		}

		taskUpdated += 1;
		console.log(`${apply ? 'PASS2-UPD' : 'PASS2-PLAN'} ${task.title} | dept=${department?.name || 'none'} | vendor=${vendor?.name || 'none'}`);
	}

	const mergedVendorIds = Array.from(matchedVendorIds);
	const projectNeedsVendorUpdate = JSON.stringify([...(project as any).vendors || []].sort()) !== JSON.stringify([...mergedVendorIds].sort());
	const projectNeedsDeptUpdate = !(project as any).department && !!fallbackDepartment?.id;

	if (projectNeedsVendorUpdate || projectNeedsDeptUpdate) {
		if (apply) {
			await pb.collection('projects').update(projectId, {
				vendors: mergedVendorIds,
				...(projectNeedsDeptUpdate ? { department: fallbackDepartment.id } : {})
			});
		}
		console.log(`${apply ? 'PASS2-PROJ' : 'PASS2-PROJ-PLAN'} vendors=${mergedVendorIds.length}${projectNeedsDeptUpdate ? ` department=${fallbackDepartment?.name}` : ''}`);
	}

	console.log('');
	console.log('Second-pass summary');
	console.log(`  Stadium tasks scanned: ${tasks.length}`);
	console.log(`  Task updates: ${taskUpdated}`);
	console.log(`  Task unchanged: ${taskUnchanged}`);
	console.log(`  Department matches: ${withDepartmentMatch}`);
	console.log(`  Vendor matches: ${withVendorMatch}`);
	console.log(`  Project vendor links: ${mergedVendorIds.length}`);
	console.log('  Phase: Phase 1 · Pre-Tournaments');
}

async function main() {
	const apply = process.argv.includes('--apply');
	const skipCreate = process.argv.includes('--skip-create');
	const runSecondPassFlag = !process.argv.includes('--skip-second-pass');
	const projectId = getArgValue('--project') || DEFAULT_PROJECT_ID;
	const cliUrl = getArgValue('--url');

	let url = (cliUrl || process.env.POCKETBASE_URL || '').replace(/\/$/, '');
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';

	if (!url || !email || !password) {
		throw new Error('Missing required env: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD');
	}

	const pb = new PocketBase(url);
	await (pb as any).admins.authWithPassword(email, password);

	const project = await pb.collection('projects').getOne(projectId, { fields: 'id,name,status' });
	console.log(`${apply ? 'APPLY' : 'DRY-RUN'}: Stadium Course task seeding`);
	console.log(`Project: ${project.name} (${project.id})`);

	let created = 0;
	let skipped = 0;

	if (!skipCreate) {
		for (const task of STADIUM_TASKS) {
			const existing = await findTaskByTitle(pb, projectId, task.title);
			if (existing) {
				skipped += 1;
				console.log(`SKIP   ${task.title}`);
				continue;
			}

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
					notes: 'Generated from Dashboard > Stadium Course #1 budget model.',
					subTasksChecklist: toChecklistMarkdown(task.checklist)
				});
			}

			created += 1;
			console.log(`${apply ? 'CREATE ' : 'PLAN  '} ${task.title} ($${task.task_budget.toLocaleString()})`);
		}
	} else {
		skipped = STADIUM_TASKS.length;
		console.log('Creation pass skipped via --skip-create');
	}

	const totalBudget = STADIUM_TASKS.reduce((sum, t) => sum + t.task_budget, 0);
	console.log('');
	console.log('Summary');
	console.log(`  Tasks planned total: ${STADIUM_TASKS.length}`);
	console.log(`  Tasks created: ${created}`);
	console.log(`  Tasks skipped: ${skipped}`);
	console.log(`  Total planned budget: $${totalBudget.toLocaleString()}`);
	console.log('  Phase: Phase 1 · Pre-Tournaments');

	if (runSecondPassFlag) {
		console.log('');
		console.log('Running second-pass assignment...');
		await runSecondPass(pb, projectId, apply);
	}

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
