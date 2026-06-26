import type PocketBase from 'pocketbase';

type AnyRecord = Record<string, any>;

const normalize = (value: unknown): string =>
	String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ');

export type EarningsViewerType = 'pro' | 'manager' | 'unknown';

export type EarningsResolution = {
	viewerType: EarningsViewerType;
	filters: string[];
	diagnostics: Record<string, unknown>;
};

type StrategyContext = {
	role: string;
	profile: AnyRecord;
	userEmail: string;
	adminPb: PocketBase;
};

abstract class EarningsQueryStrategy {
	abstract readonly role: string;
	abstract resolve(ctx: StrategyContext): Promise<EarningsResolution>;
}

class ManagerEarningsQueryStrategy extends EarningsQueryStrategy {
	readonly role = 'manager';

	async resolve(ctx: StrategyContext): Promise<EarningsResolution> {
		if (!ctx.userEmail) {
			return {
				viewerType: 'manager',
				filters: [],
				diagnostics: {
					role: ctx.role,
					resolution: 'missing_manager_email',
				},
			};
		}

		return {
			viewerType: 'manager',
			filters: [`managerEmail = "${ctx.userEmail}"`, `recipient = "manager"`],
			diagnostics: {
				role: ctx.role,
				resolution: 'manager_email',
				managerEmail: ctx.userEmail,
			},
		};
	}
}

class ProLikeEarningsQueryStrategy extends EarningsQueryStrategy {
	readonly role = 'pro-like';

	async resolve(ctx: StrategyContext): Promise<EarningsResolution> {
		const profile = ctx.profile ?? {};
		let talentReference = String(profile.talentReference ?? '');
		let resolutionSource = talentReference ? 'profile.talentReference' : '';

		const firstName = normalize(profile.firstName ?? '');
		const lastName = normalize(profile.lastName ?? '');
		const fullName = normalize(`${profile.firstName ?? ''} ${profile.lastName ?? ''}`);

		if (!talentReference && ctx.userEmail) {
			const talent = await ctx.adminPb.collection('talent')
				.getFirstListItem(`email = "${ctx.userEmail}"`, { fields: 'id' })
				.catch(() => null);
			talentReference = String(talent?.id ?? '');
			if (talentReference) resolutionSource = 'talent.email';
		}

		if (!talentReference && (fullName || firstName || lastName)) {
			const talentRows = await ctx.adminPb.collection('talent').getFullList({ fields: 'id,name' }).catch(() => []);
			const exact = fullName
				? (talentRows as AnyRecord[]).find((t) => normalize(t.name) === fullName)
				: null;
			const startsWith = fullName
				? (talentRows as AnyRecord[]).find((t) => normalize(t.name).startsWith(fullName))
				: null;
			const tokenContains = (talentRows as AnyRecord[]).find((t) => {
				const n = normalize(t.name);
				if (firstName && lastName) return n.includes(firstName) && n.includes(lastName);
				if (fullName) return n.includes(fullName);
				return false;
			});
			const firstNameOnly = firstName
				? (talentRows as AnyRecord[]).find((t) => normalize(t.name).startsWith(firstName))
				: null;
			talentReference = String(exact?.id || startsWith?.id || tokenContains?.id || firstNameOnly?.id || '');
			if (talentReference) {
				if (exact?.id) resolutionSource = 'talent.name.exact';
				else if (startsWith?.id) resolutionSource = 'talent.name.startsWith';
				else if (tokenContains?.id) resolutionSource = 'talent.name.contains';
				else if (firstNameOnly?.id) resolutionSource = 'talent.name.firstName';
			}
		}

		if (!talentReference) {
			return {
				viewerType: 'pro',
				filters: [],
				diagnostics: {
					role: ctx.role,
					resolution: 'no_talent_match',
					userEmail: ctx.userEmail || null,
					firstName: profile.firstName ?? null,
					lastName: profile.lastName ?? null,
				},
			};
		}

		return {
			viewerType: 'pro',
			filters: [`pro = "${talentReference}"`, `recipient = "pro"`],
			diagnostics: {
				role: ctx.role,
				resolution: resolutionSource || 'unknown',
				resolvedTalentId: talentReference,
				userEmail: ctx.userEmail || null,
			},
		};
	}
}

class UnsupportedEarningsQueryStrategy extends EarningsQueryStrategy {
	readonly role = 'unsupported';

	async resolve(ctx: StrategyContext): Promise<EarningsResolution> {
		return {
			viewerType: 'unknown',
			filters: [],
			diagnostics: {
				role: ctx.role,
				resolution: 'unsupported_role',
			},
		};
	}
}

export function getEarningsQueryStrategy(role: string | null | undefined): EarningsQueryStrategy {
	if (role === 'manager') return new ManagerEarningsQueryStrategy();
	if (role === 'pro' || role === 'broadcaster') return new ProLikeEarningsQueryStrategy();
	return new UnsupportedEarningsQueryStrategy();
}
