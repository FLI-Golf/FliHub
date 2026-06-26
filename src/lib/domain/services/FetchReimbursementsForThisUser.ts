import type PocketBase from 'pocketbase';

type AnyRecord = Record<string, any>;

export type ClaimantBreakdownEntry = {
	claimantId: string;
	label: string;
	count: number;
};

export type UserDirectoryEntry = {
	id: string;
	label: string;
	userId: string | null;
};

export type SessionUserMatchResult = {
	userIdInAllUsers: boolean;
	profileIdInAllUsers: boolean;
	profileIdInClaimants: boolean;
	matchingUserProfile: UserDirectoryEntry | null;
	matchingClaimant: ClaimantBreakdownEntry | null;
};

export type RollupClaimSummary = {
	claimantId: string;
	claimantLabel: string;
	claimCount: number;
	totalAmount: number;
	claimIds: string[];
	statusCounts: Record<string, number>;
};

export class FetchReimbursementsForThisUser {
	constructor(private readonly adminPb: PocketBase) {}

	async resolveDefaultProfileForSession(input: { profileId?: string | null; sessionUserId?: string | null }): Promise<UserDirectoryEntry | null> {
		const sessionUserId = input.sessionUserId ?? null;
		const profileId = input.profileId ?? null;

		if (sessionUserId) {
			const matchedProfile = await this.adminPb.collection('user_profiles').getFirstListItem(
				`userId = "${sessionUserId}"`,
				{ fields: 'id,userId,firstName,lastName,email' }
			).catch(() => null);

			if (matchedProfile) {
				return {
					id: matchedProfile.id,
					label: this.toUserLabel(matchedProfile),
					userId: matchedProfile.userId ?? null
				};
			}
		}

		if (!profileId) return null;

		const fallbackProfile = await this.adminPb.collection('user_profiles').getOne(profileId, {
			fields: 'id,userId,firstName,lastName,email'
		}).catch(() => null);

		if (!fallbackProfile) return null;

		return {
			id: fallbackProfile.id,
			label: this.toUserLabel(fallbackProfile),
			userId: fallbackProfile.userId ?? null
		};
	}

	async execute(input: { profileId?: string | null; sessionUserId?: string | null }) {
		const resolvedProfile = await this.resolveDefaultProfileForSession(input);
		const profileId = resolvedProfile?.id ?? null;
		const sessionUserId = input.sessionUserId ?? null;

		const myClaims = profileId
			? await this.adminPb.collection('reimbursement_claims').getFullList({
				filter: `claimant="${profileId}"`,
				sort: '-id',
				expand: 'claimant'
			}).catch(() => [])
			: [];

		const myClaimIds = (myClaims as AnyRecord[]).map((claim) => claim.id);
		const myItems = myClaimIds.length
			? await this.adminPb.collection('reimbursement_items').getFullList({
				filter: myClaimIds.map((id: string) => `claim="${id}"`).join('||'),
				sort: 'date',
				expand: 'vendorId'
			}).catch(() => [])
			: [];

		const myBankStatements = sessionUserId
			? await this.adminPb.collection('bank_statements').getFullList({
				filter: `user="${sessionUserId}"`,
				sort: '-created'
			}).catch(() => [])
			: [];

		return {
			resolvedProfile,
			myClaims,
			myItems,
			myBankStatements,
			myClaimIds
		};
	}

	async fetchAllUsers(): Promise<UserDirectoryEntry[]> {
		const allUsers = await this.adminPb.collection('user_profiles').getFullList({
			fields: 'id,userId,firstName,lastName,email',
			sort: 'firstName,lastName'
		}).catch(() => []);

		return (allUsers as AnyRecord[]).map((user) => ({
			id: user.id,
			label: this.toUserLabel(user),
			userId: user.userId ?? null
		}));
	}

	buildClaimantBreakdown(claims: AnyRecord[]): ClaimantBreakdownEntry[] {
		return [...new Map(
			claims
				.filter((claim) => claim.claimant)
				.map((claim) => {
					const claimant = claim.expand?.claimant;
					return [
						claim.claimant,
						{
							claimantId: claim.claimant,
							label: this.toUserLabel(claimant),
							count: claims.filter((candidate) => candidate.claimant === claim.claimant).length
						}
					];
				})
		).values()];
	}

	buildRollupSummary(claims: AnyRecord[]): RollupClaimSummary[] {
		const grouped = new Map<string, RollupClaimSummary>();

		for (const claim of claims) {
			if (!claim?.claimant) continue;

			const claimantId = String(claim.claimant);
			const claimantLabel = this.toUserLabel(claim.expand?.claimant);
			const existing = grouped.get(claimantId) ?? {
				claimantId,
				claimantLabel,
				claimCount: 0,
				totalAmount: 0,
				claimIds: [],
				statusCounts: {}
			};

			existing.claimCount += 1;
			existing.totalAmount += Number(claim.totalAmount || 0);
			existing.claimIds.push(String(claim.id));
			existing.statusCounts[claim.status || 'unknown'] = (existing.statusCounts[claim.status || 'unknown'] ?? 0) + 1;
			grouped.set(claimantId, existing);
		}

		return [...grouped.values()].sort((a, b) => b.totalAmount - a.totalAmount || a.claimantLabel.localeCompare(b.claimantLabel));
	}

	matchSessionUser(input: {
		sessionUserId?: string | null;
		profileId?: string | null;
		allUsers: UserDirectoryEntry[];
		claimantBreakdown: ClaimantBreakdownEntry[];
	}): SessionUserMatchResult {
		const sessionUserId = input.sessionUserId ?? null;
		const profileId = input.profileId ?? null;
		const userIdInAllUsers = !!(sessionUserId && input.allUsers.some((user) => user.userId === sessionUserId));
		const profileIdInAllUsers = !!(profileId && input.allUsers.some((user) => user.id === profileId));
		const matchingUserProfile = profileId
			? input.allUsers.find((user) => user.id === profileId) ?? null
			: null;
		const matchingClaimant = profileId
			? input.claimantBreakdown.find((claimant) => claimant.claimantId === profileId) ?? null
			: null;
		const profileIdInClaimants = !!matchingClaimant;

		return {
			userIdInAllUsers,
			profileIdInAllUsers,
			profileIdInClaimants,
			matchingUserProfile,
			matchingClaimant
		};
	}

	private toUserLabel(user: AnyRecord | null | undefined): string {
		return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'unknown';
	}
}