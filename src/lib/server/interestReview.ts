type InterestKey = 'event' | 'tournament';

export type InterestSummaryItem = {
	id: string;
	name: string;
	status: string;
	location: string;
	date: string;
	totalInterest: number;
	proInterest: number;
	broadcasterInterest: number;
	vendorInterest: number;
	interestedUsers: Array<{ name: string; role: string }>;
	latestInterestAt: string;
};

export type DuplicateGroup = {
	groupKey: string;
	user: string;
	recordId: string;
	count: number;
	keepId: string;
	removeIds: string[];
	latestInterestAt: string;
};

export type DuplicateReport = {
	groupCount: number;
	duplicateRowCount: number;
	groups: DuplicateGroup[];
};

export type CleanupHistoryItem = {
	id: string;
	scope: string;
	eventGroupsMerged: number;
	eventRowsDeleted: number;
	tournamentGroupsMerged: number;
	tournamentRowsDeleted: number;
	totalGroupsMerged: number;
	totalRowsDeleted: number;
	performedBy: string;
	created: string;
};

export const displayNameFor = (profile: any, user: any) => {
	const fullName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();
	return fullName || user?.name || user?.email || user?.id || 'Unknown';
};

export const interestTimestamp = (row: any) => row.created ?? row.createdAt ?? row.updated ?? '';

export const detectDuplicateGroups = (rows: any[], key: InterestKey): DuplicateReport => {
	const grouped = new Map<string, any[]>();

	for (const row of rows) {
		if (!row.user || !row[key]) continue;
		const groupKey = `${row.user}::${row[key]}`;
		grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), row]);
	}

	const duplicates = Array.from(grouped.entries())
		.map(([groupKey, entries]) => ({
			groupKey,
			entries: [...entries].sort((a, b) => String(interestTimestamp(b)).localeCompare(String(interestTimestamp(a))))
		}))
		.filter((group) => group.entries.length > 1)
		.map((group) => ({
			groupKey: group.groupKey,
			user: group.entries[0].user,
			recordId: group.entries[0][key],
			count: group.entries.length,
			keepId: group.entries[0].id,
			removeIds: group.entries.slice(1).map((entry) => entry.id),
			latestInterestAt: interestTimestamp(group.entries[0])
		}));

	return {
		groupCount: duplicates.length,
		duplicateRowCount: duplicates.reduce((sum, group) => sum + group.removeIds.length, 0),
		groups: duplicates
	};
};

export const buildInterestSummary = (
	interestRows: any[],
	key: InterestKey,
	recordMap: Record<string, any>,
	userMap: Record<string, any>,
	profileByUserId: Record<string, any>
): InterestSummaryItem[] => {
	const grouped = new Map<string, InterestSummaryItem>();

	for (const interest of interestRows) {
		const recordId = interest[key];
		if (!recordId) continue;

		const user = userMap[interest.user] ?? interest.expand?.user ?? null;
		const profile = profileByUserId[interest.user] ?? null;
		const role = profile?.role ?? 'unknown';
		const target = recordMap[recordId] ?? interest.expand?.[key] ?? null;

		if (!grouped.has(recordId)) {
			grouped.set(recordId, {
				id: recordId,
				name: target?.name ?? 'Unknown',
				status: target?.status ?? 'unknown',
				location: target?.location ?? target?.venue ?? '',
				date: target?.eventDate ?? target?.startDate ?? '',
				totalInterest: 0,
				proInterest: 0,
				broadcasterInterest: 0,
				vendorInterest: 0,
				interestedUsers: [],
				latestInterestAt: ''
			});
		}

		const entry = grouped.get(recordId)!;
		entry.totalInterest += 1;
		if (role === 'pro') entry.proInterest += 1;
		if (role === 'broadcaster') entry.broadcasterInterest += 1;
		if (role === 'vendor') entry.vendorInterest += 1;
		entry.interestedUsers.push({
			name: displayNameFor(profile, user),
			role
		});

		const createdAt = interestTimestamp(interest);
		if (!entry.latestInterestAt || createdAt > entry.latestInterestAt) {
			entry.latestInterestAt = createdAt;
		}
	}

	return Array.from(grouped.values())
		.map((entry) => ({
			...entry,
			interestedUsers: entry.interestedUsers.slice(0, 5)
		}))
		.sort((a, b) => b.totalInterest - a.totalInterest || String(a.date).localeCompare(String(b.date)));
};

export const buildCleanupHistory = (
	rows: any[],
	userMap: Record<string, any>,
	profileByUserId: Record<string, any>
): CleanupHistoryItem[] =>
	(rows ?? [])
		.map((row: any) => ({
			id: row.id,
			scope: row.scope ?? 'all',
			eventGroupsMerged: Number(row.eventGroupsMerged ?? 0),
			eventRowsDeleted: Number(row.eventRowsDeleted ?? 0),
			tournamentGroupsMerged: Number(row.tournamentGroupsMerged ?? 0),
			tournamentRowsDeleted: Number(row.tournamentRowsDeleted ?? 0),
			totalGroupsMerged: Number(row.totalGroupsMerged ?? 0),
			totalRowsDeleted: Number(row.totalRowsDeleted ?? 0),
			performedBy: displayNameFor(
				profileByUserId[row.performedBy] ?? null,
				userMap[row.performedBy] ?? row.expand?.performedBy ?? null
			),
			created: row.created ?? ''
		}))
		.sort((a, b) => String(b.created).localeCompare(String(a.created)));

const csvEscape = (value: unknown) => {
	const text = String(value ?? '');
	if (/[",\n]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
};

export const buildInterestReviewCsv = (input: {
	eventInterestSummary: InterestSummaryItem[];
	tournamentInterestSummary: InterestSummaryItem[];
	cleanupHistory: CleanupHistoryItem[];
}) => {
	const headers = [
		'section',
		'rank',
		'item_name',
		'date',
		'location',
		'status',
		'total_interest',
		'pro_interest',
		'broadcaster_interest',
		'vendor_interest',
		'interested_users',
		'cleanup_scope',
		'event_groups_merged',
		'event_rows_deleted',
		'tournament_groups_merged',
		'tournament_rows_deleted',
		'total_groups_merged',
		'total_rows_deleted',
		'performed_by',
		'created_at'
	];

	const rows: string[][] = [];

	input.eventInterestSummary.forEach((item, index) => {
		rows.push([
			'event_interest',
			String(index + 1),
			item.name,
			item.date,
			item.location,
			item.status,
			String(item.totalInterest),
			String(item.proInterest),
			String(item.broadcasterInterest),
			String(item.vendorInterest),
			item.interestedUsers.map((user) => `${user.name} (${user.role})`).join('; '),
			'', '', '', '', '', '', '', '', ''
		]);
	});

	input.tournamentInterestSummary.forEach((item, index) => {
		rows.push([
			'tournament_interest',
			String(index + 1),
			item.name,
			item.date,
			item.location,
			item.status,
			String(item.totalInterest),
			String(item.proInterest),
			String(item.broadcasterInterest),
			String(item.vendorInterest),
			item.interestedUsers.map((user) => `${user.name} (${user.role})`).join('; '),
			'', '', '', '', '', '', '', '', ''
		]);
	});

	input.cleanupHistory.forEach((item, index) => {
		rows.push([
			'cleanup_history',
			String(index + 1),
			'', '', '', '', '', '', '', '',
			item.scope,
			String(item.eventGroupsMerged),
			String(item.eventRowsDeleted),
			String(item.tournamentGroupsMerged),
			String(item.tournamentRowsDeleted),
			String(item.totalGroupsMerged),
			String(item.totalRowsDeleted),
			item.performedBy,
			item.created
		]);
		});

	return [headers, ...rows]
		.map((row) => row.map(csvEscape).join(','))
		.join('\n');
};