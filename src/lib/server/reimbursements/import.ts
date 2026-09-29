import { createHash } from 'node:crypto';
import {
	findBestDuplicateMatch,
	requiresBusinessPurposeReview,
	toDateOnly,
	type DuplicateClassification,
	type ReimbursementTransactionIdentity
} from '$lib/domain/reimbursements/integrity';
import {
	DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL,
	REIMBURSEMENT_MAX_TOTAL_SETTING_KEY
} from '$lib/domain/schemas/reimbursement.schema';

const CATEGORIES = new Set(['travel', 'meals', 'equipment', 'software', 'marketing', 'legal', 'office', 'other']);
const STATUSES = new Set(['draft', 'submitted', 'under_review', 'approved', 'paid', 'rejected']);

export interface ReimbursementImportPreviewRow extends ReimbursementTransactionIdentity {
	rowIndex: number;
	classification: DuplicateClassification | 'invalid';
	claimTitle: string;
	claimantEmail: string;
	category: string;
	claimStatus: string;
	claimNotes: string;
	departmentId: string | null;
	vendorId: string | null;
	itemNotes: string;
	isHistorical: boolean;
	businessPurposeStatus: 'not_required' | 'unconfirmed';
	matchedRecordId?: string;
	reason?: string;
	errors: string[];
}

export interface ReimbursementImportPreview {
	batchId: string;
	rows: ReimbursementImportPreviewRow[];
	summary: {
		newTransactions: number;
		potentialDuplicates: number;
		exactMatches: number;
		invalidRows: number;
		totalProposedAmount: number;
		totalPotentiallyDuplicatedAmount: number;
	};
}

function normalizedEmail(value: unknown): string {
	return String(value ?? '').trim().toLocaleLowerCase('en-US');
}

function parseAmount(value: unknown): number | null {
	const normalized = String(value ?? '').replace(/[$,\s]/g, '');
	if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
	const amount = Number(normalized);
	return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function makeBatchId(rows: Record<string, string>[]): string {
	const canonical = rows.map((row) => Object.keys(row).sort().map((key) => [key, row[key]?.trim() ?? '']));
	return `csv_${createHash('sha256').update(JSON.stringify(canonical)).digest('hex').slice(0, 24)}`;
}

async function getMaxClaimTotal(pb: any): Promise<number> {
	const setting = await pb.collection('settings')
		.getFirstListItem(`key = "${REIMBURSEMENT_MAX_TOTAL_SETTING_KEY}"`, { fields: 'value' })
		.catch(() => null);
	const parsed = Number(setting?.value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL;
}

export async function previewReimbursementImport(
	pb: any,
	rows: Record<string, string>[]
): Promise<ReimbursementImportPreview> {
	const batchId = makeBatchId(rows);
	const [profiles, vendors, departments, claims, items, maxClaimTotal] = await Promise.all([
		pb.collection('user_profiles').getFullList({ fields: 'id,email' }),
		pb.collection('vendors').getFullList({ fields: 'id,name' }).catch(() => []),
		pb.collection('departments').getFullList({ fields: 'id,name' }).catch(() => []),
		pb.collection('reimbursement_claims').getFullList({ fields: 'id,claimant' }),
		pb.collection('reimbursement_items').getFullList({
			fields: 'id,claim,description,amount,date,vendor,sourceTransactionId,bankStatement,importBatchId,isArchived'
		}),
		getMaxClaimTotal(pb)
	]);

	const profileByEmail = new Map<string, { id: string }>(profiles.map((profile: any) => [normalizedEmail(profile.email), profile]));
	const vendorByName = new Map<string, { id: string }>(vendors.map((vendor: any) => [String(vendor.name).trim().toLocaleLowerCase('en-US'), vendor]));
	const departmentByName = new Map<string, { id: string }>(departments.map((department: any) => [String(department.name).trim().toLocaleLowerCase('en-US'), department]));
	const claimantByClaim = new Map(claims.map((claim: any) => [claim.id, claim.claimant]));
	const existingTransactions: Array<ReimbursementTransactionIdentity & { id: string }> = items
		.filter((item: any) => item.isArchived !== true)
		.map((item: any) => ({
			id: item.id,
			claimantId: claimantByClaim.get(item.claim) ?? '',
			transactionDate: toDateOnly(item.date) ?? '',
			vendor: item.vendor,
			amount: Number(item.amount),
			description: item.description,
			sourceTransactionId: item.sourceTransactionId,
			bankStatementId: item.bankStatement,
			importBatchId: item.importBatchId
		}));

	const previewRows: ReimbursementImportPreviewRow[] = [];
	for (let index = 0; index < rows.length; index++) {
		const row = rows[index];
		const errors: string[] = [];
		const email = normalizedEmail(row.claimantEmail);
		const profile = profileByEmail.get(email);
		const amount = parseAmount(row.itemAmount);
		const transactionDate = toDateOnly(row.itemDate);
		const description = row.itemDescription?.trim() ?? '';
		const claimTitle = row.claimTitle?.trim() ?? '';
		const category = row.itemCategory?.trim().toLocaleLowerCase('en-US') || 'other';
		const requestedStatus = row.claimStatus?.trim().toLocaleLowerCase('en-US') || 'draft';

		if (!claimTitle) errors.push('claimTitle is required');
		if (!email) errors.push('claimantEmail is required');
		else if (!profile) errors.push(`No user profile found for ${email}`);
		if (!description) errors.push('itemDescription is required');
		if (amount === null) errors.push('itemAmount must be a positive number with at most 2 decimals');
		if (!transactionDate) errors.push('itemDate must be a valid YYYY-MM-DD date');
		if (!CATEGORIES.has(category)) errors.push(`Invalid itemCategory: ${category}`);
		if (!STATUSES.has(requestedStatus)) errors.push(`Invalid claimStatus: ${requestedStatus}`);

		const vendorName = row.vendorName?.trim() ?? '';
		const vendor = vendorByName.get(vendorName.toLocaleLowerCase('en-US'));
		const departmentName = row.departmentName?.trim() ?? '';
		const department = departmentByName.get(departmentName.toLocaleLowerCase('en-US'));
		const transaction: ReimbursementImportPreviewRow = {
			rowIndex: index,
			classification: errors.length ? 'invalid' : 'new',
			claimTitle,
			claimantEmail: email,
			claimantId: profile?.id ?? '',
			transactionDate: transactionDate ?? '',
			vendor: vendorName,
			amount: amount ?? 0,
			description,
			sourceTransactionId: row.sourceTransactionId?.trim() || undefined,
			bankStatementId: row.bankStatementId?.trim() || undefined,
			importBatchId: row.importBatchId?.trim() || batchId,
			category,
			claimStatus: requestedStatus === 'paid' || requestedStatus === 'approved' ? 'under_review' : requestedStatus,
			claimNotes: row.claimNotes?.trim() ?? '',
			departmentId: department?.id ?? null,
			vendorId: vendor?.id ?? null,
			itemNotes: row.itemNotes?.trim() ?? '',
			isHistorical: row.isHistorical?.trim().toLocaleLowerCase('en-US') === 'true',
			businessPurposeStatus: requiresBusinessPurposeReview({ vendor: vendorName, description })
				? 'unconfirmed'
				: 'not_required',
			errors
		};

		if (!errors.length) {
			const candidates = [...existingTransactions, ...previewRows.filter((candidate) => candidate.classification !== 'invalid')];
			const match = findBestDuplicateMatch(transaction, candidates);
			transaction.classification = match.classification;
			transaction.matchedRecordId = (match.match as { id?: string } | undefined)?.id;
			transaction.reason = match.reason;
		}
		previewRows.push(transaction);
	}

	const claimTotals = new Map<string, number>();
	for (const row of previewRows.filter((candidate) => candidate.classification === 'new')) {
		const key = `${row.claimantId}::${row.claimTitle}`;
		claimTotals.set(key, (claimTotals.get(key) ?? 0) + row.amount);
	}
	for (const row of previewRows) {
		const key = `${row.claimantId}::${row.claimTitle}`;
		if (row.classification === 'new' && (claimTotals.get(key) ?? 0) > maxClaimTotal) {
			row.classification = 'invalid';
			row.errors.push(`Grouped claim total exceeds $${maxClaimTotal.toFixed(2)}`);
		}
	}

	const validRows = previewRows.filter((row) => row.classification !== 'invalid');
	return {
		batchId,
		rows: previewRows,
		summary: {
			newTransactions: validRows.filter((row) => row.classification === 'new').length,
			potentialDuplicates: validRows.filter((row) => row.classification === 'potential_duplicate').length,
			exactMatches: validRows.filter((row) => row.classification === 'exact_match').length,
			invalidRows: previewRows.filter((row) => row.classification === 'invalid').length,
			totalProposedAmount: validRows.reduce((sum, row) => sum + row.amount, 0),
			totalPotentiallyDuplicatedAmount: validRows
				.filter((row) => row.classification === 'potential_duplicate' || row.classification === 'exact_match')
				.reduce((sum, row) => sum + row.amount, 0)
		}
	};
}

export async function applyReimbursementImport(
	pb: any,
	preview: ReimbursementImportPreview,
	overrideRowIndexes: number[] = []
): Promise<{ created: number; skipped: number; failed: number; errors: string[] }> {
	const overrides = new Set(overrideRowIndexes);
	const selected = preview.rows.filter((row) =>
		row.classification === 'new'
		|| ((row.classification === 'potential_duplicate' || row.classification === 'exact_match') && overrides.has(row.rowIndex))
	);
	const maxClaimTotal = await getMaxClaimTotal(pb);
	const selectedClaimTotals = new Map<string, number>();
	for (const row of selected) {
		const key = `${row.claimantId}::${row.claimTitle}`;
		selectedClaimTotals.set(key, (selectedClaimTotals.get(key) ?? 0) + row.amount);
	}
	const overLimit = [...selectedClaimTotals.entries()].find(([, total]) => total > maxClaimTotal);
	if (overLimit) {
		return {
			created: 0,
			skipped: preview.rows.length - selected.length,
			failed: selected.length,
			errors: [`Selected rows would create a claim above the $${maxClaimTotal.toFixed(2)} limit`]
		};
	}
	const claimCache = new Map<string, string>();
	const createdClaimIds: string[] = [];
	const createdItemIds: string[] = [];
	let currentRow: ReimbursementImportPreviewRow | null = null;

	try {
		for (const row of selected) {
			currentRow = row;
			const claimKey = `${row.claimantId}::${row.claimTitle}`;
			let claimId = claimCache.get(claimKey);
			if (!claimId) {
				const groupedRows = selected.filter((candidate) => `${candidate.claimantId}::${candidate.claimTitle}` === claimKey);
				const claim = await pb.collection('reimbursement_claims').create({
					title: row.claimTitle,
					claimant: row.claimantId,
					status: row.claimStatus,
					totalAmount: groupedRows.reduce((sum, candidate) => sum + candidate.amount, 0),
					notes: row.claimNotes,
					department: row.departmentId,
					is_historical: row.isHistorical
				});
				const createdClaimId = String(claim.id);
				claimId = createdClaimId;
				claimCache.set(claimKey, createdClaimId);
				createdClaimIds.push(createdClaimId);
			}

			const item = await pb.collection('reimbursement_items').create({
				claim: claimId,
				description: row.description,
				amount: row.amount,
				date: row.transactionDate,
				category: row.category,
				vendor: row.vendor ?? '',
				vendorId: row.vendorId,
				notes: row.itemNotes,
				sourceTransactionId: row.sourceTransactionId ?? '',
				bankStatement: row.bankStatementId ?? null,
				importBatchId: preview.batchId,
				businessPurposeStatus: row.businessPurposeStatus,
				isArchived: false
			});
			createdItemIds.push(String(item.id));
		}
	} catch (error: any) {
		let rollbackFailed = false;
		for (const itemId of [...createdItemIds].reverse()) {
			await pb.collection('reimbursement_items').delete(itemId).catch(() => { rollbackFailed = true; });
		}
		for (const claimId of [...createdClaimIds].reverse()) {
			await pb.collection('reimbursement_claims').delete(claimId).catch(() => { rollbackFailed = true; });
		}
		const rowLabel = currentRow ? `Row ${currentRow.rowIndex + 2}: ` : '';
		return {
			created: 0,
			skipped: preview.rows.length - selected.length,
			failed: selected.length,
			errors: [
				`${rowLabel}${error?.response?.message ?? error?.message ?? 'Import failed'}${rollbackFailed ? ' (automatic rollback was incomplete; administrator review required)' : ' (all records from this import were rolled back)'}`
			]
		};
	}

	return {
		created: createdItemIds.length,
		skipped: preview.rows.length - selected.length,
		failed: 0,
		errors: []
	};
}