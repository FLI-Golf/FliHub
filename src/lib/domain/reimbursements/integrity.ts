export type DuplicateClassification = 'new' | 'potential_duplicate' | 'exact_match';

export interface ReimbursementTransactionIdentity {
	claimantId: string;
	transactionDate: string;
	vendor?: string;
	amount: number;
	description: string;
	sourceTransactionId?: string;
	bankStatementId?: string;
	importBatchId?: string;
}

export interface DuplicateMatch<T extends ReimbursementTransactionIdentity = ReimbursementTransactionIdentity> {
	classification: DuplicateClassification;
	match?: T;
	reason?: string;
}

export interface DuplicateAuditGroup<T extends ReimbursementTransactionIdentity = ReimbursementTransactionIdentity> {
	classification: Exclude<DuplicateClassification, 'new'>;
	items: T[];
	occurrences: number;
	potentialDuplicatedAmount: number;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:(?:T| )\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

export function toDateOnly(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const match = value.trim().match(DATE_ONLY_PATTERN);
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const candidate = new Date(Date.UTC(year, month - 1, day));
	if (
		candidate.getUTCFullYear() !== year
		|| candidate.getUTCMonth() !== month - 1
		|| candidate.getUTCDate() !== day
	) return null;

	return `${match[1]}-${match[2]}-${match[3]}`;
}

export function formatDateOnly(
	value: unknown,
	options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
	const dateOnly = toDateOnly(value);
	if (!dateOnly) return '—';
	const [year, month, day] = dateOnly.split('-').map(Number);
	return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' })
		.format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function normalizeTransactionText(value: unknown): string {
	return String(value ?? '')
		.normalize('NFKC')
		.trim()
		.toLocaleLowerCase('en-US')
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.replace(/\s+/g, ' ');
}

function amountInCents(value: number): number {
	return Math.round(Number(value) * 100);
}

function sameNonEmptyContext(left?: string, right?: string): boolean {
	return !left || !right || left === right;
}

export function compareTransactions(
	incoming: ReimbursementTransactionIdentity,
	existing: ReimbursementTransactionIdentity
): DuplicateMatch {
	if (incoming.claimantId !== existing.claimantId) return { classification: 'new' };

	const incomingSourceId = normalizeTransactionText(incoming.sourceTransactionId);
	const existingSourceId = normalizeTransactionText(existing.sourceTransactionId);
	if (incomingSourceId && existingSourceId && incomingSourceId === existingSourceId) {
		return { classification: 'exact_match', match: existing, reason: 'Same source transaction ID' };
	}

	const sameDate = toDateOnly(incoming.transactionDate) === toDateOnly(existing.transactionDate);
	const sameAmount = amountInCents(incoming.amount) === amountInCents(existing.amount);
	if (!sameDate || !sameAmount) return { classification: 'new' };

	const sameVendor = normalizeTransactionText(incoming.vendor) === normalizeTransactionText(existing.vendor);
	const sameDescription = normalizeTransactionText(incoming.description) === normalizeTransactionText(existing.description);
	if (!sameVendor && !sameDescription) return { classification: 'new' };

	const sameContext = sameNonEmptyContext(incomingSourceId, existingSourceId)
		&& sameNonEmptyContext(incoming.bankStatementId, existing.bankStatementId)
		&& sameNonEmptyContext(incoming.importBatchId, existing.importBatchId);
	if (sameVendor && sameDescription && sameContext) {
		return { classification: 'exact_match', match: existing, reason: 'Same claimant, date, vendor, amount, and description' };
	}

	return {
		classification: 'potential_duplicate',
		match: existing,
		reason: sameContext
			? 'Same claimant, date, amount, and similar transaction details'
			: 'Same transaction details but a different statement or import batch'
	};
}

export function findBestDuplicateMatch<T extends ReimbursementTransactionIdentity>(
	incoming: ReimbursementTransactionIdentity,
	candidates: T[]
): DuplicateMatch<T> {
	let potential: DuplicateMatch<T> | null = null;
	for (const candidate of candidates) {
		const comparison = compareTransactions(incoming, candidate) as DuplicateMatch<T>;
		if (comparison.classification === 'exact_match') return comparison;
		if (comparison.classification === 'potential_duplicate' && !potential) potential = comparison;
	}
	return potential ?? { classification: 'new' };
}

export function groupSuspectedDuplicates<T extends ReimbursementTransactionIdentity>(
	transactions: T[]
): DuplicateAuditGroup<T>[] {
	const buckets = new Map<string, T[]>();
	for (const transaction of transactions) {
		const date = toDateOnly(transaction.transactionDate);
		if (!date || !transaction.claimantId || !Number.isFinite(transaction.amount)) continue;
		const key = `${transaction.claimantId}|${date}|${amountInCents(transaction.amount)}`;
		buckets.set(key, [...(buckets.get(key) ?? []), transaction]);
	}

	const groups: DuplicateAuditGroup<T>[] = [];
	for (const bucket of buckets.values()) {
		const ungrouped = new Set(bucket);
		while (ungrouped.size > 0) {
			const seed = ungrouped.values().next().value as T;
			ungrouped.delete(seed);
			const items = [seed];
			let classification: Exclude<DuplicateClassification, 'new'> = 'exact_match';

			let added = true;
			while (added) {
				added = false;
				for (const candidate of [...ungrouped]) {
					const matches = items.map((item) => compareTransactions(candidate, item));
					const match = matches.find((result) => result.classification !== 'new');
					if (!match) continue;
					items.push(candidate);
					ungrouped.delete(candidate);
					if (match.classification === 'potential_duplicate') classification = 'potential_duplicate';
					added = true;
				}
			}

			if (items.length > 1) {
				const totalInCents = items.reduce((sum, item) => sum + amountInCents(item.amount), 0);
				groups.push({
					classification,
					items,
					occurrences: items.length,
					potentialDuplicatedAmount: Math.max(0, totalInCents - amountInCents(items[0].amount)) / 100
				});
			}
		}
	}

	return groups.sort((left, right) => right.potentialDuplicatedAmount - left.potentialDuplicatedAmount);
}

const UNCONFIRMED_PURPOSE_PATTERNS = [
	/\batgpay\b/,
	/\bonline payment\b/,
	/\bcredit card (?:payment|repayment)\b/,
	/\bcard payment\b/,
	/\bbank transfer\b/,
	/\bpayment transfer\b/,
	/\bhoa\b/
];

export function requiresBusinessPurposeReview(transaction: Pick<ReimbursementTransactionIdentity, 'vendor' | 'description'>): boolean {
	const text = normalizeTransactionText(`${transaction.vendor ?? ''} ${transaction.description}`);
	return UNCONFIRMED_PURPOSE_PATTERNS.some((pattern) => pattern.test(text));
}