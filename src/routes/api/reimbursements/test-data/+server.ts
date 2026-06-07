import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

const CLAIMANTS = [
	'l8wj56007t6cqoo', // Dustin Dinsmore
	'b1q8lmerdwzt1d4', // Mark Coleman
	'ipa0vii1qs3ycbj', // Gary Santos
	'z3gnzf5fg1284or', // Andrew Panza
	'cr1zmsps9yive0k', // Kimberly Martinez
	'l1dvc585cozc3ov', // Nate Panza
	'tsyjlae5ienzd8z', // Corey La Russo
	'j534vv0tvcc7q9c', // Gannon Buhr
];

const STATUSES = ['draft','submitted','submitted','under_review','under_review','approved','approved','approval_submittedto','paid','paid','rejected'];

const CATEGORIES = ['travel','meals','equipment','software','marketing','legal','office','other'];

const TITLES = [
	'March Travel — Phoenix Conference',
	'Team Lunch — Strategy Session',
	'Office Supplies Q2',
	'Software Licenses — Adobe Suite',
	'Marketing Materials — Trade Show',
	'Legal Review — Player Contracts',
	'San Diego Office Expenses',
	'Flight — Scottsdale to Portland',
	'Hotel — PDGA Worlds',
	'Equipment — Camera Gear',
	'Uber Rides — Event Week',
	'Client Dinner — Sponsor Meeting',
	'Printing — Sponsor Decks',
	'Parking — Tournament Day',
	'Internet — Remote Office',
	'Phone Bill — March',
	'Catering — Team Meeting',
	'Shipping — Apparel Samples',
	'Conference Registration',
	'Airfare — Board Meeting NYC',
	'Rental Car — Phoenix Trip',
	'Meals — Production Week',
	'Hardware — iPad for Scoring',
	'Subscription — Slack Annual',
	'PR Event — Media Day Expenses',
	'Travel — League Partnership Visit',
	'Office Furniture — Standing Desk',
	'Photography — Event Coverage',
	'Miscellaneous — Q1 Ops',
	'Background Check — New Hire',
];

const VENDORS = ['Delta Airlines','Marriott','Uber','Amazon','Adobe','Slack','FedEx','Staples','Costco','Best Buy','Apple','Google','Zoom','Dropbox','Canva'];
const PAYMENT_METHODS = ['bank_transfer','check','zelle','paypal'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randAmount() { return Math.round((Math.random() * 1800 + 20) * 100) / 100; }
function randDate(daysBack = 180) {
	const d = new Date();
	d.setDate(d.getDate() - randInt(0, daysBack));
	return d.toISOString().slice(0, 10);
}
function pad(n: number) { return String(n).padStart(3, '0'); }

async function getNextWO(adminPb: any, offset: number): Promise<string> {
	const existing = await adminPb.collection('reimbursement_claims')
		.getFullList({ fields: 'referenceNumber' }).catch(() => []);
	let max = 0;
	for (const r of existing) {
		const m = (r.referenceNumber ?? '').match(/^WO-(\d+)$/);
		if (m) { const n = parseInt(m[1]); if (n > max) max = n; }
	}
	return `WO-${pad(max + 1 + offset)}`;
}

// DELETE all test claims (those with WO- reference numbers)
export const DELETE: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const profile = ctx.profile;
	if (profile?.role !== 'admin' && profile?.role !== 'leader') {
		return json({ message: 'Unauthorized' }, { status: 403 });
	}

	try {
		const adminPb = await getAdminPocketBase();

		// Get all claims
		const claims = await adminPb.collection('reimbursement_claims')
			.getFullList({ fields: 'id,referenceNumber' });

		let deleted = 0;
		for (const claim of claims) {
			try {
				// Delete line items
				const items = await adminPb.collection('reimbursement_items')
					.getFullList({ filter: `claim="${claim.id}"`, fields: 'id' });
				for (const item of items) {
					await adminPb.collection('reimbursement_items').delete(item.id).catch(() => {});
				}
				// Delete matching work order if one exists
				if (claim.referenceNumber) {
					const wos = await adminPb.collection('work_orders')
						.getFullList({ filter: `work_order_number="${claim.referenceNumber}"`, fields: 'id' })
						.catch(() => []);
					for (const wo of wos) {
						await adminPb.collection('work_orders').delete(wo.id).catch(() => {});
					}
				}
				await adminPb.collection('reimbursement_claims').delete(claim.id);
				deleted++;
			} catch { /* skip */ }
		}

		return json({ ok: true, deleted });
	} catch (e: any) {
		return json({ message: e?.message ?? 'Failed' }, { status: 500 });
	}
};

// POST — seed N claims
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

	try {
		const adminPb = await getAdminPocketBase();

		// Resolve the Tax-Exempt Reimbursements department once
		const reimbDept = await adminPb.collection('departments')
			.getFirstListItem(`name="Tax-Exempt Reimbursements"`, { fields: 'id' })
			.catch(() => null);
		const reimbDeptId = reimbDept?.id ?? null;

		let created = 0;

		for (let i = 0; i < count; i++) {
			const status      = rand(statuses);
			const claimant    = rand(CLAIMANTS);
			const title       = rand(TITLES) + ` #${i + 1}`;
			const wo          = await getNextWO(adminPb, i);
			const payMethod   = rand(PAYMENT_METHODS);
			const paidDate    = randDate(60);

			const claim = await adminPb.collection('reimbursement_claims').create({
				title,
				claimant,
				status,
				referenceNumber: wo,
				notes: '',
				reviewNotes: status === 'rejected'     ? 'Please resubmit with proper documentation.'
				           : status === 'under_review' ? 'Reviewing line items with CPA.' : '',
				paymentMethod:     status === 'paid' ? payMethod : '',
				paidDate:          status === 'paid' ? paidDate  : '',
				work_order_number: status === 'paid' ? wo        : '',
				department:        reimbDeptId,
				totalAmount: 0,
			});

			const itemCount = randInt(1, 4);
			let total = 0;
			for (let j = 0; j < itemCount; j++) {
				const amount = randAmount();
				total += amount;
				await adminPb.collection('reimbursement_items').create({
					claim:       claim.id,
					description: `${rand(CATEGORIES)} expense — ${rand(VENDORS)}`,
					amount,
					date:        randDate(90),
					category:    rand(CATEGORIES),
					vendor:      rand(VENDORS),
					notes:       '',
					work_order_number: status === 'paid' ? wo : '',
				});
			}

			const finalTotal = Math.round(total * 100) / 100;
			await adminPb.collection('reimbursement_claims').update(claim.id, {
				totalAmount: finalTotal
			});

			// Claims that have been handed off to QuickBooks or already paid must
			// have a matching work_orders record.
			if (status === 'paid' || status === 'approval_submittedto') {
				await adminPb.collection('work_orders').create({
					work_order_number: wo,
					claimId:           claim.id,
					submittedBy:       claimant,
					source:            'reimbursement',
					description:       title,
					amount:            finalTotal,
					approvedDate:      new Date(Date.now() - randInt(1, 30) * 86400000).toISOString(),
					paidDate:          status === 'paid' ? paidDate : null,
					paymentMethod:     status === 'paid' ? payMethod : '',
					status:            status === 'paid' ? 'paid' : 'open',
					notes:             status === 'paid'
						? `Reimbursement claim paid via ${payMethod.replace(/_/g, ' ')}`
						: 'Reimbursement claim approved and submitted to QuickBooks for payment processing.',
				}).catch((e: any) => console.error('[seed] WO create failed for', wo, e?.response?.data ?? e?.message));
			}

			created++;
		}

		return json({ ok: true, created });
	} catch (e: any) {
		return json({ message: e?.message ?? 'Failed' }, { status: 500 });
	}
};
