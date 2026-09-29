import assert from 'node:assert/strict';
import test from 'node:test';
import {
	compareTransactions,
	findBestDuplicateMatch,
	formatDateOnly,
	groupSuspectedDuplicates,
	requiresBusinessPurposeReview,
	toDateOnly,
	type ReimbursementTransactionIdentity
} from './integrity.js';

const base: ReimbursementTransactionIdentity = {
	claimantId: 'claimant-1',
	transactionDate: '2026-07-19',
	vendor: 'GitHub, Inc.',
	amount: 160.21,
	description: 'GitHub subscription'
};

test('identical transaction details are exact matches', () => {
	assert.equal(compareTransactions(base, { ...base }).classification, 'exact_match');
});

test('same source transaction ID is exact even if text changed', () => {
	const incoming = { ...base, description: 'Updated memo', sourceTransactionId: 'txn-001' };
	const existing = { ...base, sourceTransactionId: 'TXN-001' };
	assert.equal(compareTransactions(incoming, existing).classification, 'exact_match');
});

test('different billing periods are not duplicates', () => {
	const nextMonth = { ...base, transactionDate: '2026-08-19' };
	assert.equal(compareTransactions(nextMonth, base).classification, 'new');
});

test('different import context downgrades an otherwise exact match to potential', () => {
	const incoming = { ...base, importBatchId: 'batch-b' };
	const existing = { ...base, importBatchId: 'batch-a' };
	assert.equal(compareTransactions(incoming, existing).classification, 'potential_duplicate');
});

test('different source transaction IDs are potential rather than exact matches', () => {
	const incoming = { ...base, sourceTransactionId: 'txn-b' };
	const existing = { ...base, sourceTransactionId: 'txn-a' };
	assert.equal(compareTransactions(incoming, existing).classification, 'potential_duplicate');
});

test('best match prefers exact over potential candidates', () => {
	const potential = { ...base, description: 'GitHub monthly software', id: 'potential' };
	const exact = { ...base, id: 'exact' };
	const result = findBestDuplicateMatch(base, [potential, exact]);
	assert.equal(result.classification, 'exact_match');
	assert.equal((result.match as typeof exact).id, 'exact');
});

test('audit groups duplicates and counts only excess occurrences as exposure', () => {
	const groups = groupSuspectedDuplicates([
		{ ...base, sourceTransactionId: 'one' },
		{ ...base, sourceTransactionId: 'two' },
		{ ...base, sourceTransactionId: 'three' },
		{ ...base, transactionDate: '2026-08-19' }
	]);
	assert.equal(groups.length, 1);
	assert.equal(groups[0].occurrences, 3);
	assert.equal(groups[0].potentialDuplicatedAmount, 320.42);
});

test('date-only validation rejects rollover dates', () => {
	assert.equal(toDateOnly('2026-02-29'), null);
	assert.equal(toDateOnly('2026-09-19 00:00:00.000Z'), '2026-09-19');
	assert.equal(toDateOnly('2026-09-19 garbage'), null);
	assert.equal(toDateOnly('2026-09-19Tnot-a-time'), null);
});

test('date-only formatting is stable in multiple process timezones', () => {
	const originalTimezone = process.env.TZ;
	try {
		for (const timezone of ['America/Los_Angeles', 'UTC', 'Asia/Tokyo']) {
			process.env.TZ = timezone;
			assert.equal(formatDateOnly('2026-09-19'), 'Sep 19, 2026');
		}
	} finally {
		process.env.TZ = originalTimezone;
	}
});

test('payment and transfer descriptions require business-purpose review', () => {
	assert.equal(requiresBusinessPurposeReview({ vendor: 'ATGPay', description: 'Online payment' }), true);
	assert.equal(requiresBusinessPurposeReview({ vendor: 'Netlify', description: 'Monthly hosting' }), false);
});