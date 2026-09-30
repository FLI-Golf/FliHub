import assert from 'node:assert/strict';
import test from 'node:test';
import { duplicateSignature, hasGroupSurvivorViolation } from './review.js';

const signature = duplicateSignature('claimant-1', '2026-07-19', 160.21);

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
