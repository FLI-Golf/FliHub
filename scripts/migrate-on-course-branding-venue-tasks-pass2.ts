import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

type AssignmentRule = {
	titleIncludes: string[];
	vendorKeywords: string[];
	departmentKeywords: string[];
	vendorBucket: 'signage' | 'print' | 'install' | 'broadcast' | 'ops' | 'compliance';
};

const DEFAULT_PROJECT_ID = 'xptzufs2w7lz1j7';
const PHASE1_START = '2026-07-01';
const PHASE1_END = '2026-12-31';
const ASSIGNMENT_HEADER = 'Auto-assignment (On-Course Branding pass 2):';

const ASSIGNMENT_RULES: AssignmentRule[] = [
	{
		titleIncludes: ['Tee Signage', 'Wayfinding'],
		vendorKeywords: ['sign', 'signage', 'display', 'fabrication', 'print'],
		departmentKeywords: ['marketing', 'production', 'operations'],
		vendorBucket: 'signage'
	},
	{
		titleIncludes: ['Fairway Banner', 'Step-and-Repeat', 'Grandstand Vinyl'],
		vendorKeywords: ['banner', 'vinyl', 'wrap', 'graphics', 'print', 'media wall'],
		departmentKeywords: ['marketing', 'production', 'operations'],
		vendorBucket: 'print'
	},
	{
		titleIncludes: ['Grandstand Vinyl', 'VIP Entry'],
		vendorKeywords: ['installation', 'event', 'rigging', 'staging', 'contractor'],
		departmentKeywords: ['operations', 'production', 'technical'],
		vendorBucket: 'install'
	},
	{
		titleIncludes: ['Broadcast Tower'],
		vendorKeywords: ['broadcast', 'production', 'camera', 'media', 'stream'],
		departmentKeywords: ['production', 'technical', 'marketing'],
		vendorBucket: 'broadcast'
	},
	{
		titleIncludes: ['Daily QC', 'Replacement Loop'],
		vendorKeywords: ['operations', 'maintenance', 'event support', 'field'],
		departmentKeywords: ['operations', 'production'],
		vendorBucket: 'ops'
	},
	{
		titleIncludes: ['Compliance Audit'],
		vendorKeywords: ['compliance', 'audit', 'legal', 'reporting'],
		departmentKeywords: ['legal', 'compliance', 'operations', 'marketing'],
		vendorBucket: 'compliance'
	}
];

function getArgValue(flag: string): string | null {
	const idx = process.argv.findIndex((arg) => arg === flag);
	if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
	const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
	return inline ? inline.slice(flag.length + 1) : null;
}

function norm(value: string): string {
	return String(value || '').toLowerCase();
}

function slug(value: string): string {
	return norm(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function scoreText(value: string, keywords: string[]): number {
	const text = norm(value);
	let score = 0;
	for (const kw of keywords) {
		if (text.includes(norm(kw))) score += 1;
	}
	return score;
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
	const filtered = base
		.split('\n')
		.filter((line) => !line.includes(ASSIGNMENT_HEADER) && !line.includes('Assigned Department:') && !line.includes('Preferred Vendor:') && !line.includes('Phase Window:'))
		.join('\n')
		.trim();
	const block = [ASSIGNMENT_HEADER, ...lines].join('\n');
	return filtered ? `${filtered}\n\n${block}` : block;
}

function selectRule(taskTitle: string): AssignmentRule {
	for (const rule of ASSIGNMENT_RULES) {
		if (rule.titleIncludes.some((token) => taskTitle.includes(token))) {
			return rule;
		}
	}
	return ASSIGNMENT_RULES[0];
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

	const [project, tasks, vendors, departments] = await Promise.all([
		pb.collection('projects').getOne(projectId, { fields: 'id,name,department,vendors' }),
		pb.collection('tasks').getFullList({
			filter: `projectId = "${projectId}" && title ~ "On-Course Branding -"`,
			fields: 'id,title,notes,tags,assignedTo,status,startDate,dueDate'
		}),
		pb.collection('vendors').getFullList({ fields: 'id,name,type,active', sort: 'name' }),
		pb.collection('departments').getFullList({ fields: 'id,name,headOfDepartment,status', sort: 'name' })
	]);

	const activeVendors = (vendors as any[]).filter((v: any) => v.active !== false);
	const activeDepartments = (departments as any[]).filter((d: any) => String(d.status || '').toLowerCase() !== 'archived');

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
			const vendorType = Array.isArray(vendor.type) ? vendor.type.join(' ') : String(vendor.type || '');
			const text = `${vendor.name || ''} ${vendorType}`;
			const score = scoreText(text, keywords);
			return { vendor, score };
		});

		return candidates
			.filter((entry) => entry.score > 0)
			.sort((a, b) => b.score - a.score || String(a.vendor.name || '').localeCompare(String(b.vendor.name || '')));
	};

	const fallbackDepartment =
		findBestDepartment(['marketing', 'operations', 'production', 'event', 'branding']) ||
		activeDepartments[0] ||
		null;

	const bucketVendorPick = new Map<string, string>();
	const matchedVendorIds = new Set<string>(Array.isArray((project as any).vendors) ? (project as any).vendors : []);

	let taskUpdated = 0;
	let taskUnchanged = 0;
	let withVendorMatch = 0;
	let withDepartmentMatch = 0;

	console.log(`${apply ? 'APPLY' : 'DRY-RUN'}: On-Course Branding assignment pass 2`);
	console.log(`Project: ${(project as any).name} (${projectId})`);
	console.log(`Tasks scanned: ${(tasks as any[]).length}`);

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
				const used = Array.from(bucketVendorPick.values());
				const unused = candidates.find((c) => !used.includes(c.vendor.id));
				vendor = (unused ?? candidates[0]).vendor;
				bucketVendorPick.set(rule.vendorBucket, vendor.id);
			}
		}

		if (department) withDepartmentMatch += 1;
		if (vendor) withVendorMatch += 1;
		if (vendor?.id) matchedVendorIds.add(vendor.id);

		const nextTags = mergeTags(task.tags, [
			'phase-1',
			'pre-tournaments',
			'on-course-branding',
			department?.name ? `dept:${slug(department.name)}` : '',
			vendor?.name ? `vendor:${slug(vendor.name)}` : ''
		]);

		const nextNotes = upsertAssignmentNotes(task.notes, [
			`Assigned Department: ${department?.name || 'Unassigned'}`,
			`Preferred Vendor: ${vendor?.name || 'No keyword match found'}`,
			`Phase Window: ${PHASE1_START} -> ${PHASE1_END}`
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
	const existingVendors = Array.isArray((project as any).vendors) ? (project as any).vendors : [];
	const projectNeedsVendorUpdate = JSON.stringify([...existingVendors].sort()) !== JSON.stringify([...mergedVendorIds].sort());
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
	console.log(`  Task updates: ${taskUpdated}`);
	console.log(`  Task unchanged: ${taskUnchanged}`);
	console.log(`  Department matches: ${withDepartmentMatch}`);
	console.log(`  Vendor matches: ${withVendorMatch}`);
	console.log(`  Project vendor links: ${mergedVendorIds.length}`);
	console.log('  Matching model: stadium-course second-pass keyword scoring + vendor buckets');

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
