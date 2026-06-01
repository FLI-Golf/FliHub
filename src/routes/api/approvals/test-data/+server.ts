import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

const USERS = [
	'l8wj56007t6cqoo', // Dustin Dinsmore
	'b1q8lmerdwzt1d4', // Mark Coleman
	'ipa0vii1qs3ycbj', // Gary Santos
	'z3gnzf5fg1284or', // Andrew Panza
	'cr1zmsps9yive0k', // Kimberly Martinez
	'l1dvc585cozc3ov', // Nate Panza
	'tsyjlae5ienzd8z', // Corey La Russo
];

const CATEGORIES = [
	'Marketing', 'Legal', 'Software', 'Hardware', 'Travel/Airefare',
	'Travel/Lodging', 'Travel/Auto Rental', 'Travel/Miscellaneous',
	'Office/San Diego', 'Office/Scottsdale', 'Reimbursement',
	'Executive/Management Staff', 'Office Staff', 'Advertising',
];
const ENTITY_TYPES = ['expense','expense','expense','project'];
const STATUSES = ['pending','pending','pending','approved','approved','rejected'];

const DESCRIPTIONS = [
	'Flight to Phoenix — league partnership meeting',
	'Hotel — PDGA Worlds coverage',
	'Adobe Creative Suite annual license',
	'Team lunch — strategy session',
	'Camera equipment for event coverage',
	'Legal review — player contracts',
	'Office supplies — Scottsdale HQ',
	'Uber rides — tournament week',
	'Conference registration — disc golf summit',
	'Marketing materials — trade show booth',
	'Slack annual subscription',
	'Catering — board meeting',
	'Printing — sponsor decks',
	'Background check — new hire',
	'Rental car — Phoenix trip',
];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randAmount() { return Math.round((Math.random() * 2000 + 50) * 100) / 100; }
function randDate(daysBack = 90) {
	const d = new Date();
	d.setDate(d.getDate() - randInt(0, daysBack));
	return d.toISOString();
}

// ── DELETE — wipe all expenses, approvals, work_orders and reset actuals ──────
export const DELETE: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const profile = ctx.profile;
	if (profile?.role !== 'admin' && profile?.role !== 'leader') {
		return json({ message: 'Unauthorized' }, { status: 403 });
	}

	const adminPb = await getAdminPocketBase();
	const results: Record<string, number> = { work_orders: 0, approvals: 0, expenses: 0, tasks_cleared: 0, projects_cleared: 0 };

	// Delete work orders
	const wos = await adminPb.collection('work_orders').getFullList({ fields: 'id' }).catch(() => []);
	for (const w of wos) { await adminPb.collection('work_orders').delete(w.id).catch(() => {}); results.work_orders++; }

	// Delete approvals
	const approvals = await adminPb.collection('approvals').getFullList({ fields: 'id' }).catch(() => []);
	for (const a of approvals) { await adminPb.collection('approvals').delete(a.id).catch(() => {}); results.approvals++; }

	// Delete expenses
	const expenses = await adminPb.collection('expenses').getFullList({ fields: 'id' }).catch(() => []);
	for (const e of expenses) { await adminPb.collection('expenses').delete(e.id).catch(() => {}); results.expenses++; }

	// Clear task flags + WO numbers
	const tasks = await adminPb.collection('tasks').getFullList({ fields: 'id,needs_review,work_order_number' }).catch(() => []);
	for (const t of tasks as any[]) {
		if (t.needs_review || t.work_order_number) {
			await adminPb.collection('tasks').update(t.id, { needs_review: false, work_order_number: '' }).catch(() => {});
			results.tasks_cleared++;
		}
	}

	// Zero project actuals
	const projects = await adminPb.collection('projects').getFullList({ fields: 'id,project_actual_expenses' }).catch(() => []);
	for (const p of projects as any[]) {
		if ((p.project_actual_expenses ?? 0) > 0) {
			await adminPb.collection('projects').update(p.id, { project_actual_expenses: 0 }).catch(() => {});
			results.projects_cleared++;
		}
	}

	return json({ ok: true, deleted: results });
};

// ── POST — seed N approvals (each with a linked expense) ─────────────────────
export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const profile = ctx.profile;
	if (profile?.role !== 'admin' && profile?.role !== 'leader') {
		return json({ message: 'Unauthorized' }, { status: 403 });
	}

	const body = await request.json().catch(() => ({}));
	const count    = Math.min(Math.max(parseInt(body.count ?? 10), 1), 200);
	const statuses: string[] = body.statuses?.length ? body.statuses : STATUSES;

	const adminPb = await getAdminPocketBase();

	// Get real task IDs to link expenses to
	const tasks = await adminPb.collection('tasks').getFullList({ fields: 'id', sort: '-id' }).catch(() => []);
	const taskIds = (tasks as any[]).map(t => t.id);

	let created = 0;
	for (let i = 0; i < count; i++) {
		const status    = rand(statuses);
		const submitter = rand(USERS);
		const amount    = randAmount();
		const taskId    = taskIds.length ? rand(taskIds) : null;

		// 1. Create expense
		const expense = await adminPb.collection('expenses').create({
			description:  rand(DESCRIPTIONS) + ` #${i + 1}`,
			amount,
			category:     rand(CATEGORIES),
			status:       status === 'pending' ? 'submitted' : status,
			date:         randDate(60).slice(0, 10),
			submittedBy:  submitter,
			taskId:       taskId || null,
			notes:        '',
		}).catch((e: any) => { console.error('expense create failed:', e?.message, JSON.stringify(e?.data)); return null; });

		if (!expense) continue;

		// 2. Create approval linked to expense
		const voters = status === 'approved'
			? [submitter]
			: status === 'rejected'
			? [submitter]
			: [];

		await adminPb.collection('approvals').create({
			entityType:    'expense',
			entityId:      expense.id,
			expenseId:     expense.id,
			status,
			requestedBy:   submitter,
			requestedDate: randDate(30),
			reviewedDate:  status !== 'pending' ? randDate(10) : null,
			amount,
			approvers:     voters,
			comments:      status === 'rejected' ? '<p>Missing receipts — please resubmit.</p>' : '',
		}).catch((e: any) => console.error('approval create failed:', e?.message));

		created++;
	}

	return json({ ok: true, created });
};
