import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

function workOrderFromRecordId(prefix: string, recordId: string): string {
	return `WO-${prefix}-${String(recordId || '').slice(-4).toLowerCase()}`;
}

function deriveProjectCode(name: string): string {
	return String(name || 'EVENT')
		.replace(/[^a-zA-Z\s]/g, '')
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => w[0].toUpperCase())
		.join('')
		.slice(0, 6) || 'EVENT';
}

function extractEventPaymentId(notes: string): string | null {
	const match = String(notes || '').match(/\[EP:([^\]]+)\]/);
	return match?.[1] ?? null;
}

function getArgValue(flag: string): string | null {
	const idx = process.argv.findIndex((arg) => arg === flag);
	if (idx >= 0 && process.argv[idx + 1]) {
		return process.argv[idx + 1];
	}
	const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
	if (inline) {
		return inline.slice(flag.length + 1);
	}
	return null;
}

async function main() {
	const apply = process.argv.includes('--apply');
	const diagnose = process.argv.includes('--diagnose');
	const diagnoseCounts = process.argv.includes('--diagnose-counts');
	const cliUrl = getArgValue('--url');
	let url = cliUrl || process.env.POCKETBASE_URL || '';
	url = url.replace(/\/$/, '');

	const email = process.env.POCKETBASE_ADMIN_EMAIL;
	const password = process.env.POCKETBASE_ADMIN_PASSWORD;
	if (!url || !email || !password) {
		throw new Error('POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, and POCKETBASE_ADMIN_PASSWORD are required in .env');
	}

	const pb = new PocketBase(url);
	await (pb as any).admins.authWithPassword(email, password);

	if (diagnose || diagnoseCounts) {
		console.log('Dataset selection');
		console.log(`  env url: ${String(process.env.POCKETBASE_URL || '').replace(/\/$/, '') || '—'}`);
		console.log(`  cli --url: ${cliUrl ? cliUrl.replace(/\/$/, '') : '—'}`);
		console.log(`  active url: ${url}`);
		console.log('');
	}

	const expenses = await pb.collection('expenses').getFullList({
		fields: 'id,status,description,title,amount,notes,work_order_number,submittedBy,approvedDate,date'
	});

	if (diagnoseCounts) {
		const [approvals, workOrders, eventPayments] = await Promise.all([
			pb.collection('approvals').getFullList({ fields: 'id' }).catch(() => []),
			pb.collection('work_orders').getFullList({ fields: 'id' }).catch(() => []),
			pb.collection('event_payments').getFullList({ fields: 'id' }).catch(() => []),
		]);

		console.log('Diagnostic counts');
		console.log(`  dataset url: ${url}`);
		console.log(`  expenses: ${expenses.length}`);
		console.log(`  approvals: ${approvals.length}`);
		console.log(`  work_orders: ${workOrders.length}`);
		console.log(`  event_payments: ${eventPayments.length}`);
		console.log('');
	}

	if (diagnose) {
		console.log('Diagnostic mode');
		console.log(`  dataset url: ${url}`);
		console.log(`  total expenses fetched: ${expenses.length}`);
		const sample = (expenses as any[]).slice(0, 10);
		if (!sample.length) {
			console.log('  sample: no expenses returned');
		} else {
			console.log('  first 10 expenses (id | status | wo | ep | amount)');
			for (const e of sample) {
				const epId = extractEventPaymentId(e.notes || '');
				const wo = String(e.work_order_number || '').trim() || '—';
				const status = String(e.status || '').trim() || '—';
				const ep = epId || '—';
				const amount = Number(e.amount || 0).toFixed(2);
				console.log(`  ${e.id} | ${status} | ${wo} | ${ep} | ${amount}`);
			}
		}
		console.log('');
	}

	let scanned = 0;
	let skippedNonApproved = 0;
	let skippedHasWO = 0;
	let skippedNoMarker = 0;
	let created = 0;
	let linkedExisting = 0;
	let normalizedWO = 0;
	let expenseStamped = 0;
	const errors: Array<{ expenseId: string; message: string }> = [];

	for (const expense of expenses as any[]) {
		scanned += 1;
		if (String(expense.status || '').toLowerCase() !== 'approved') {
			skippedNonApproved += 1;
			continue;
		}

		const epId = extractEventPaymentId(expense.notes || '');
		if (!epId) {
			skippedNoMarker += 1;
			continue;
		}

		if (String(expense.work_order_number || '').trim()) {
			skippedHasWO += 1;
			continue;
		}

		const marker = `[EP:${epId}]`;
		const payment = await pb.collection('event_payments').getOne(epId, {
			expand: 'event',
			fields: 'id,amount,paymentType,recipient,event,expand.event.name'
		}).catch(() => null) as any;
		const eventName = payment?.expand?.event?.name || expense.title || expense.description || 'Event Payment';
		const eventCode = deriveProjectCode(eventName);

		try {
			const existingWO = await pb.collection('work_orders').getFirstListItem(
				`notes ~ '${marker}'`
			).catch(() => null) as any;

			let woId = existingWO?.id as string | undefined;
			let woNumber = existingWO?.work_order_number as string | undefined;

			if (existingWO) {
				const canonical = workOrderFromRecordId(eventCode, existingWO.id);
				if (!woNumber || woNumber !== canonical) {
					woNumber = canonical;
					normalizedWO += 1;
					if (apply) {
						await pb.collection('work_orders').update(existingWO.id, {
							work_order_number: canonical,
							expenseId: expense.id,
							expense: expense.id,
						});
					}
				}
				linkedExisting += 1;
			} else {
				const draftNumber = `WO-${eventCode}-PENDING-${Date.now()}`;
				if (apply) {
					const createdWO = await pb.collection('work_orders').create({
						work_order_number: draftNumber,
						source: 'expense',
						status: 'open',
						expenseId: expense.id,
						expense: expense.id,
						submittedBy: expense.submittedBy || null,
						description: (expense.description || expense.title || `${eventName} payout`).slice(0, 500),
						amount: Number(expense.amount || payment?.amount || 0),
						approvedDate: expense.approvedDate || new Date().toISOString(),
						notes: `${marker} Backfilled from approved expense ${expense.id}.`,
					});
					woId = createdWO.id;
					woNumber = workOrderFromRecordId(eventCode, createdWO.id);
					await pb.collection('work_orders').update(createdWO.id, {
						work_order_number: woNumber,
					});
				}
				created += 1;
				if (!apply) {
					woNumber = workOrderFromRecordId(eventCode, 'preview');
				}
			}

			if (apply && woNumber) {
				await pb.collection('expenses').update(expense.id, {
					work_order_number: woNumber,
					status: 'approved'
				});
				expenseStamped += 1;
			}

			console.log(`${apply ? 'APPLY' : 'DRY'} expense=${expense.id} ep=${epId} -> WO=${woNumber || 'pending'}`);
		} catch (err: any) {
			errors.push({ expenseId: expense.id, message: err?.message || String(err) });
			console.error(`ERROR expense=${expense.id}: ${err?.message || err}`);
		}
	}

	console.log('');
	console.log('Backfill summary');
	console.log(`  scanned: ${scanned}`);
	console.log(`  skipped (not approved): ${skippedNonApproved}`);
	console.log(`  skipped (already had work_order_number): ${skippedHasWO}`);
	console.log(`  skipped (no [EP:id] marker): ${skippedNoMarker}`);
	console.log(`  linked existing work orders: ${linkedExisting}`);
	console.log(`  created work orders: ${created}`);
	console.log(`  normalized existing WO numbers: ${normalizedWO}`);
	console.log(`  expenses stamped: ${expenseStamped}`);
	console.log(`  errors: ${errors.length}`);

	if (errors.length > 0) {
		process.exitCode = 1;
	}

	if (!apply) {
		console.log('');
		console.log('Dry-run only. Re-run with --apply to persist changes.');
	}
}

main().catch((err) => {
	console.error('Backfill failed:', err?.message || err);
	process.exit(1);
});
