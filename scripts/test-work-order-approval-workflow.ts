/**
 * Seed data for testing direct event-payment approval -> work-order creation.
 *
 * Run:
 *   npx tsx scripts/test-work-order-approval-workflow.ts
 */

import * as dotenv from 'dotenv';
import PocketBase from 'pocketbase';

dotenv.config();

const PB_URL = (process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090').replace(/\/$/, '');
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

type TalentRecord = {
	id: string;
	name?: string;
	managerCutPercentage?: number;
	managerEmail?: string;
};

async function auth() {
	await pb.collection('_superusers').authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
}

async function resolveOperationsDepartment() {
	const existing = await pb.collection('departments').getFirstListItem('name = "Operations"').catch(() => null as any);
	if (existing) return existing;

	return pb.collection('departments').create({
		name: 'Operations',
		department_annual_budget: 50000,
		department_actual_expenses: 0,
	});
}

async function pickTalent(): Promise<TalentRecord[]> {
	const talent = await pb.collection('talent').getFullList({
		fields: 'id,name,managerCutPercentage,managerEmail',
		sort: 'name',
	});

	if (talent.length < 2) {
		throw new Error('Need at least 2 records in talent collection before seeding this test.');
	}

	return talent.slice(0, 2) as TalentRecord[];
}

async function createEvent(departmentId: string) {
	const ts = new Date();
	const event = await pb.collection('special_events').create({
		name: `Test Media Day Work Order ${ts.toISOString().slice(0, 19)}`,
		eventType: 'media',
		eventDate: ts.toISOString(),
		location: 'Sedona, AZ',
		status: 'scheduled',
		defaultRate: 400,
		budget: 1500,
		approvalThreshold: 500,
		requiresApproval: false,
		department: departmentId,
		description: 'Seeded for testing direct approval and pending work-order flow.',
		notes: '[seed][work-order-direct-approval]'
	});

	return event;
}

async function assignTalent(eventId: string, talent: TalentRecord[]) {
	const assignments: any[] = [];
	const rates = [450, 400];

	for (let i = 0; i < talent.length; i++) {
		const t = talent[i];
		const assignment = await pb.collection('event_talent').create({
			event: eventId,
			talent: t.id,
			role: 'player',
			status: 'confirmed',
			rateOverride: rates[i],
			confirmedRate: rates[i],
			bonusEligible: false,
			bonusEarned: false,
		});
		assignments.push(assignment);
	}

	return assignments;
}

async function createPendingPayments(eventId: string, assignments: any[], talent: TalentRecord[]) {
	const created: any[] = [];

	for (const a of assignments) {
		const t = talent.find((x) => x.id === a.talent);
		const amount = Number(a.confirmedRate ?? 0);
		const managerCut = Number(t?.managerCutPercentage ?? 0);
		const managerAmount = managerCut > 0 ? Math.round(amount * (managerCut / 100) * 100) / 100 : 0;

		const main = await pb.collection('event_payments').create({
			event: eventId,
			eventTalent: a.id,
			talent: a.talent,
			paymentType: 'appearance_fee',
			amount,
			status: 'pending',
			approvalRoute: 'direct',
			recipient: 'talent',
			managerCutPercentage: managerCut,
			managerAmount,
			isBonus: false,
		});
		created.push(main);

		if (managerAmount > 0) {
			const mgr = await pb.collection('event_payments').create({
				event: eventId,
				eventTalent: a.id,
				talent: a.talent,
				paymentType: 'appearance_fee',
				amount: managerAmount,
				status: 'pending',
				approvalRoute: 'direct',
				recipient: 'manager',
				description: `Manager cut for ${t?.name ?? a.talent}`,
				isBonus: false,
			});
			created.push(mgr);
		}
	}

	return created;
}

async function main() {
	try {
		console.log('\nSeeding direct-approval work-order test data...\n');
		await auth();

		const department = await resolveOperationsDepartment();
		const talent = await pickTalent();
		const event = await createEvent(department.id);
		const assignments = await assignTalent(event.id, talent);
		const payments = await createPendingPayments(event.id, assignments, talent);

		console.log('Seed complete.');
		console.log(`Event: ${event.name}`);
		console.log(`Event ID: ${event.id}`);
		console.log(`Talent assigned: ${assignments.length}`);
		console.log(`Payments created: ${payments.length}`);
		console.log('Expected payment status: pending');
		console.log('\nTest in UI:');
		console.log(`1) Open /dashboard/events/${event.id}`);
		console.log('2) Approve one pending payment from the event page');
		console.log('3) Verify a work order is created with status "pending"');
		console.log('4) Open /dashboard/work-orders to enter QB details and mark paid\n');
	} catch (err: any) {
		console.error('Seed failed:', err?.message ?? err);
		if (err?.data) console.error(JSON.stringify(err.data, null, 2));
		process.exit(1);
	}
}

main();
