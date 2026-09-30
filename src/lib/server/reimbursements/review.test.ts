import assert from 'node:assert/strict';
import test from 'node:test';
import { duplicateSignature, hasGroupSurvivorViolation, planGroupArchive } from './review.js';

const signature = duplicateSignature('claimant-1', '2026-07-19', 160.21);

const candidate = (id: string, extra: Record<string, unknown> = {}) => ({ id, signature, ...extra });

test('selecting every record in a group keeps exactly one survivor', () => {
	const plan = planGroupArchive(
		[candidate('a'), candidate('b'), candidate('c')],
		new Map([[signature, 3]])
	);
	assert.equal(plan.retainedIds.length, 1);
	assert.equal(plan.archiveIds.length, 2);
	assert.ok(!plan.archiveIds.includes(plan.retainedIds[0]));
});

test('the survivor prefers a record with receipts', () => {
	const plan = planGroupArchive(
		[candidate('a'), candidate('b', { receiptCount: 2 }), candidate('c')],
		new Map([[signature, 3]])
	);
	assert.deepEqual(plan.retainedIds, ['b']);
});

test('an existing keep decision outranks receipts', () => {
	const plan = planGroupArchive(
		[candidate('a', { receiptCount: 5 }), candidate('b', { duplicateReviewStatus: 'keep' })],
		new Map([[signature, 2]])
	);
	assert.deepEqual(plan.retainedIds, ['b']);
});

test('nothing is retained when an unselected record already survives', () => {
	const plan = planGroupArchive([candidate('a'), candidate('b')], new Map([[signature, 3]]));
	assert.deepEqual(plan.retainedIds, []);
	assert.deepEqual(plan.archiveIds.sort(), ['a', 'b']);
});

test('each group keeps its own survivor', () => {
	const other = duplicateSignature('claimant-1', '2026-08-19', 160.21);
	const plan = planGroupArchive(
		[candidate('a'), candidate('b'), { id: 'c', signature: other }, { id: 'd', signature: other }],
		new Map([[signature, 2], [other, 2]])
	);
	assert.equal(plan.retainedIds.length, 2);
	assert.equal(plan.archiveIds.length, 2);
});

test('survivor choice is deterministic for identical records', () => {
	const first = planGroupArchive([candidate('b'), candidate('a')], new Map([[signature, 2]]));
	const second = planGroupArchive([candidate('a'), candidate('b')], new Map([[signature, 2]]));
	assert.deepEqual(first.retainedIds, second.retainedIds);
});

test('archiving every record in a group is rejected', () => {
	const active = new Map([[signature, 3]]);
	assert.equal(hasGroupSurvivorViolation([signature, signature, signature], active), true);
});

test('archiving all but one record in a group is allowed', () => {
	const active = new Map([[signature, 3]]);
	assert.equal(hasGroupSurvivorViolation([signature, signature], active), false);
});

test('archiving a record with no known active sibling is rejected', () => {
	assert.equal(hasGroupSurvivorViolation([signature], new Map()), true);
});

test('violation in any one group rejects the whole selection', () => {
	const other = duplicateSignature('claimant-1', '2026-08-19', 160.21);
	const active = new Map([[signature, 3], [other, 2]]);
	assert.equal(hasGroupSurvivorViolation([signature, other, other], active), true);
});

test('signatures separate different billing dates and amounts', () => {
	assert.notEqual(signature, duplicateSignature('claimant-1', '2026-08-19', 160.21));
	assert.notEqual(signature, duplicateSignature('claimant-1', '2026-07-19', 160.22));
	assert.notEqual(signature, duplicateSignature('claimant-2', '2026-07-19', 160.21));
	assert.equal(signature, duplicateSignature('claimant-1', '2026-07-19 00:00:00.000Z', 160.21));
});
