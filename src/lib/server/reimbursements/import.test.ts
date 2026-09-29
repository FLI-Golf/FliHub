import assert from 'node:assert/strict';
import test from 'node:test';
import { applyReimbursementImport, type ReimbursementImportPreview } from './import.js';

test('failed import rolls back every claim and item created by the request', async () => {
	const deletedClaims: string[] = [];
	const deletedItems: string[] = [];
	let itemCreateCount = 0;
	const pb = {
		collection(name: string) {
			if (name === 'settings') {
				return { getFirstListItem: async () => { throw new Error('No setting'); } };
			}
			if (name === 'reimbursement_claims') {
				return {
					create: async () => ({ id: 'claim-created' }),
					delete: async (id: string) => { deletedClaims.push(id); }
				};
			}
			if (name === 'reimbursement_items') {
				return {
					create: async () => {
						itemCreateCount++;
						if (itemCreateCount === 2) throw new Error('Simulated item failure');
						return { id: 'item-created' };
					},
					delete: async (id: string) => { deletedItems.push(id); }
				};
			}
			throw new Error(`Unexpected collection: ${name}`);
		}
	};

	const preview: ReimbursementImportPreview = {
		batchId: 'csv_test',
		summary: {
			newTransactions: 2,
			potentialDuplicates: 0,
			exactMatches: 0,
			invalidRows: 0,
			totalProposedAmount: 30,
			totalPotentiallyDuplicatedAmount: 0
		},
		rows: [10, 20].map((amount, rowIndex) => ({
			rowIndex,
			classification: 'new' as const,
			claimTitle: 'Test claim',
			claimantEmail: 'claimant@example.com',
			claimantId: 'claimant-id',
			transactionDate: `2026-09-${String(rowIndex + 1).padStart(2, '0')}`,
			vendor: 'Vendor',
			amount,
			description: `Item ${rowIndex + 1}`,
			importBatchId: 'csv_test',
			category: 'other',
			claimStatus: 'under_review',
			claimNotes: '',
			departmentId: null,
			vendorId: null,
			itemNotes: '',
			isHistorical: true,
			businessPurposeStatus: 'not_required' as const,
			errors: []
		}))
	};

	const result = await applyReimbursementImport(pb, preview);
	assert.equal(result.created, 0);
	assert.equal(result.failed, 2);
	assert.deepEqual(deletedItems, ['item-created']);
	assert.deepEqual(deletedClaims, ['claim-created']);
});