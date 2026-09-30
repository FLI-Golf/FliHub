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

export interface ArchiveCandidate {
	id: string;
	signature: string;
	duplicateReviewStatus?: string;
	receiptCount?: number;
	hasBankStatement?: boolean;
	created?: string;
}

/** Best-evidenced record wins, falling back to the oldest for a stable choice. */
function pickSurvivor(candidates: ArchiveCandidate[]): ArchiveCandidate {
	return [...candidates].sort((a, b) => {
		const kept = Number(b.duplicateReviewStatus === 'keep') - Number(a.duplicateReviewStatus === 'keep');
		if (kept) return kept;
		const receipts = (b.receiptCount ?? 0) - (a.receiptCount ?? 0);
		if (receipts) return receipts;
		const statement = Number(!!b.hasBankStatement) - Number(!!a.hasBankStatement);
		if (statement) return statement;
		const created = String(a.created ?? '').localeCompare(String(b.created ?? ''));
		if (created) return created;
		return a.id.localeCompare(b.id);
	})[0];
}

/**
 * Resolves a selection down to one surviving record per duplicate group.
 * A group keeps its survivor only when the selection would otherwise empty it.
 */
export function planGroupArchive(
	selected: ArchiveCandidate[],
	activeBySignature: Map<string, number>
): { archiveIds: string[]; retainedIds: string[] } {
	const bySignature = new Map<string, ArchiveCandidate[]>();
	for (const candidate of selected) {
		bySignature.set(candidate.signature, [...(bySignature.get(candidate.signature) ?? []), candidate]);
	}

	const archiveIds: string[] = [];
	const retainedIds: string[] = [];
	for (const [signature, candidates] of bySignature) {
		const activeTotal = activeBySignature.get(signature) ?? 0;
		if (candidates.length < activeTotal) {
			archiveIds.push(...candidates.map((candidate) => candidate.id));
			continue;
		}
		const survivor = pickSurvivor(candidates);
		retainedIds.push(survivor.id);
		archiveIds.push(...candidates.filter((candidate) => candidate.id !== survivor.id).map((candidate) => candidate.id));
	}

	return { archiveIds, retainedIds };
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
