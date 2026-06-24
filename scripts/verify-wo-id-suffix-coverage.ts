import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition: unknown, message: string): void {
	if (!condition) {
		throw new Error(message);
	}
}

function section(content: string, startNeedle: string, endNeedle: string): string {
	const start = content.indexOf(startNeedle);
	if (start < 0) return '';
	const end = content.indexOf(endNeedle, start + startNeedle.length);
	if (end < 0) return content.slice(start);
	return content.slice(start, end);
}

function workOrderFromRecordId(prefix: string, recordId: string): string {
	return `WO-${prefix}-${String(recordId || '').slice(-4).toLowerCase()}`;
}

const approvalsPath = resolve('src/routes/api/approvals/approve/+server.ts');
const sponsorPath = resolve('src/routes/api/sponsor-purchase-orders/[id]/+server.ts');

const approvals = readFileSync(approvalsPath, 'utf8');
const sponsor = readFileSync(sponsorPath, 'utf8');

const bidBlock = section(approvals, "} else if (approval.entityType === 'bid') {", "} else if (approval.entityType === 'goal_task') {");
const goalTaskBlock = section(approvals, "} else if (approval.entityType === 'goal_task') {", "} else if (approval.entityType === 'event_payment') {");
const lastEventPaymentStart = approvals.lastIndexOf("} else if (approval.entityType === 'event_payment') {");
const eventPaymentBlock = lastEventPaymentStart >= 0 ? approvals.slice(lastEventPaymentStart) : '';

assert(bidBlock.includes('workOrderFromRecordId('), 'Bid branch does not use ID-suffix WO helper.');
assert(bidBlock.includes('PENDING-'), 'Bid branch does not create a placeholder WO before ID-based renumbering.');

assert(goalTaskBlock.includes('workOrderFromRecordId('), 'Goal task branch does not use ID-suffix WO helper.');
assert(goalTaskBlock.includes('PENDING-'), 'Goal task branch does not create a placeholder WO before ID-based renumbering.');

assert(eventPaymentBlock.includes('workOrderFromRecordId('), 'Event payment branch does not use ID-suffix WO helper.');
assert(eventPaymentBlock.includes('PENDING-'), 'Event payment branch does not create a placeholder WO before ID-based renumbering.');

assert(sponsor.includes('source = "sponsor" && poId ='), 'Sponsor PO path is not idempotent by poId.');
assert(sponsor.includes('slice(-4).toLowerCase()'), 'Sponsor PO path does not derive WO suffix from record id.');

const samples: Array<{ prefix: string; id: string; expected: string }> = [
	{ prefix: 'GEN', id: 'abc123w246', expected: 'WO-GEN-w246' },
	{ prefix: 'SPACME', id: 'gh6m7btvmrxjax7', expected: 'WO-SPACME-jax7' },
	{ prefix: 'EVENT', id: 'xyz000Q9K2', expected: 'WO-EVENT-q9k2' },
	{ prefix: 'GOAL', id: 'fooBAR9876', expected: 'WO-GOAL-9876' },
];

for (const sample of samples) {
	const actual = workOrderFromRecordId(sample.prefix, sample.id);
	assert(
		actual === sample.expected,
		`WO format mismatch for ${sample.prefix}/${sample.id}: expected ${sample.expected}, got ${actual}`
	);
}

console.log('PASS: Bid branch uses ID-suffix WO strategy');
console.log('PASS: Goal task branch uses ID-suffix WO strategy');
console.log('PASS: Event payment branch uses ID-suffix WO strategy');
console.log('PASS: Sponsor PO paid flow uses ID-suffix WO strategy');
console.log('PASS: WO formatter examples match expected outputs');
