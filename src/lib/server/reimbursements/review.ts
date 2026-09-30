import { toDateOnly } from '$lib/domain/reimbursements/integrity';

export const FINALIZED_STATUSES = new Set(['approved', 'paid', 'rejected']);

const REQUIRED_ITEM_FIELDS = [
	'businessPurposeStatus', 'businessPurposeConfirmedAt', 'businessPurposeConfirmedBy',
	'duplicateReviewStatus', 'isArchived', 'archivedAt', 'archivedBy', 'archiveReason'
];

// Cached after the integrity migration is detected once.
let schemaVerified = false;

export async function findMissingSchema(pb: any): Promise<string[]> {
	if (schemaVerified) return [];

	const missing: string[] = [];
	const itemsCollection = await pb.collections.getOne('reimbursement_items').catch(() => null);
	const presentFields = new Set((itemsCollection?.fields ?? []).map((field: any) => field.name));
	for (const field of REQUIRED_ITEM_FIELDS) {
		if (!presentFields.has(field)) missing.push(`reimbursement_items.${field}`);
	}

	const auditCollection = await pb.collections.getOne('reimbursement_item_audit').catch(() => null);
	if (!auditCollection) missing.push('reimbursement_item_audit');

	if (!missing.length) schemaVerified = true;
	return missing;
}

export function duplicateSignature(claimantId: string, date: unknown, amount: unknown): string {
	return `${claimantId}|${toDateOnly(date) ?? ''}|${Math.round(Number(amount) * 100)}`;
}

/** Archiving must never remove every active record sharing a duplicate signature. */
export function hasGroupSurvivorViolation(
	selectedSignatures: string[],
	activeBySignature: Map<string, number>
): boolean {
	const selectedBySignature = new Map<string, number>();
	for (const signature of selectedSignatures) {
		selectedBySignature.set(signature, (selectedBySignature.get(signature) ?? 0) + 1);
	}
	for (const [signature, count] of selectedBySignature) {
		if (count >= (activeBySignature.get(signature) ?? 0)) return true;
	}
	return false;
}

export async function recalculateClaimTotal(pb: any, claimId: string): Promise<number> {
	const items = await pb.collection('reimbursement_items').getFullList({
		filter: `claim = "${claimId}"`,
		fields: 'amount,isArchived'
	});
	const totalAmount = items
		.filter((item: any) => item.isArchived !== true)
		.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
	await pb.collection('reimbursement_claims').update(claimId, { totalAmount });
	return totalAmount;
}
