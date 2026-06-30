import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase, getAdminPocketBaseForBaseUrl } from '$lib/infra/pocketbase/pbClient';
import { getRoleMenuVisibility } from '$lib/server/role-menu-visibility';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const TEST_ONBOARDING_EMAIL = 'paige@fligolf.com';
const REQUIRED_DOC_TYPES = [
	'player_information_packet',
	'player_opportunity_packet',
	'integrity_substance_policy',
	'legal_documents',
	'player_contract'
];

const SEED_STAGE_PAYLOADS: Record<string, Record<string, any>> = {
	invited: {
		pipelineStage: 'invited',
		welcomeSeen: false,
		documentsInitialed: false,
		contractSigned: false,
		profileCompleted: false,
		completedAt: null,
	},
	documents_sent: {
		pipelineStage: 'documents_sent',
		welcomeSeen: true,
		documentsInitialed: false,
		contractSigned: false,
		profileCompleted: false,
		completedAt: null,
	},
	documents_signed: {
		pipelineStage: 'documents_signed',
		welcomeSeen: true,
		documentsInitialed: true,
		contractSigned: true,
		profileCompleted: false,
		completedAt: null,
	},
	profile_complete: {
		pipelineStage: 'profile_complete',
		welcomeSeen: true,
		documentsInitialed: true,
		contractSigned: true,
		profileCompleted: true,
		completedAt: null,
	},
	approved: {
		pipelineStage: 'approved',
		welcomeSeen: true,
		documentsInitialed: true,
		contractSigned: true,
		profileCompleted: true,
	},
};

function normalizeSeedEmail(input: string | undefined | null): string {
	const value = String(input ?? '').trim().toLowerCase();
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailPattern.test(value) ? value : TEST_ONBOARDING_EMAIL;
}

async function resolveOnboardingTarget(ctx: any, pbForLookup?: any): Promise<{ userId: string; email: string }> {
	const lookupPb = pbForLookup ?? ctx.pb;
	const currentEmail = normalizeSeedEmail(String(ctx.pb.authStore.model?.email ?? ''));
	if (currentEmail === TEST_ONBOARDING_EMAIL) {
		return { userId: ctx.userId, email: currentEmail };
	}

	const users = await lookupPb.collection('users').getFullList({
		filter: `email = "${TEST_ONBOARDING_EMAIL}"`,
		fields: 'id,email'
	}).catch(() => []);

	const user = users[0] ?? null;
	if (!user?.id) {
		throw new Error(`Unable to find ${TEST_ONBOARDING_EMAIL}`);
	}

	return { userId: String(user.id), email: normalizeSeedEmail(String(user.email ?? TEST_ONBOARDING_EMAIL)) };
}

const collectionUserFieldCache = new Map<string, Array<{ name: string; multi: boolean }>>();

async function getCollectionUserFields(pb: any, collection: string): Promise<Array<{ name: string; multi: boolean }>> {
	if (collectionUserFieldCache.has(collection)) {
		return collectionUserFieldCache.get(collection)!;
	}

	let fields: any[] = [];
	try {
		const meta = await (pb as any).collections.getOne(collection);
		fields = (meta?.fields ?? meta?.schema ?? []) as any[];
	} catch {
		fields = [];
	}

	const explicit = fields
		.filter((f: any) => f?.name === 'userId' || f?.name === 'user')
		.filter((f: any) => ['text', 'relation'].includes(String(f?.type ?? '').toLowerCase()))
		.map((f: any) => ({ name: String(f.name), multi: String(f.type).toLowerCase() === 'relation' && Number(f?.maxSelect ?? f?.options?.maxSelect ?? 1) > 1 }));

	const fallbackByName = fields
		.filter((f: any) => /user/i.test(String(f?.name ?? '')))
		.filter((f: any) => ['text', 'relation'].includes(String(f?.type ?? '').toLowerCase()))
		.map((f: any) => ({ name: String(f.name), multi: String(f.type).toLowerCase() === 'relation' && Number(f?.maxSelect ?? f?.options?.maxSelect ?? 1) > 1 }));

	const merged = [...explicit, ...fallbackByName]
		.filter((item, idx, arr) => arr.findIndex((x) => x.name === item.name) === idx);

	const resolved = merged.length > 0 ? merged : [{ name: 'userId', multi: false }];
	collectionUserFieldCache.set(collection, resolved);
	return resolved;
}

async function buildUserLinkPayload(pb: any, collection: string, userId: string): Promise<Record<string, any>> {
	const userFields = await getCollectionUserFields(pb, collection);
	const payload: Record<string, any> = {};
	for (const field of userFields) {
		payload[field.name] = field.multi ? [userId] : userId;
	}
	return payload;
}

async function getRowsByUser(pb: any, collection: string, userId: string, fields: string, sort = '-updated'): Promise<any[]> {
	const userFields = await getCollectionUserFields(pb, collection);
	const filters = userFields.flatMap((field) => [
		`${field.name} = "${userId}"`,
		`${field.name}.id = "${userId}"`,
		`${field.name} ?= "${userId}"`,
		`${field.name} ~ "${userId}"`,
	]);

	for (const filter of filters) {
		const rows = await pb.collection(collection).getFullList({
			filter,
			fields,
			sort,
		}).catch(async () => {
			return await pb.collection(collection).getFullList({
				filter,
				fields,
			}).catch(async () => {
				return await pb.collection(collection).getFullList({
					filter,
					sort,
				}).catch(async () => {
					return await pb.collection(collection).getFullList({
						filter,
					}).catch(() => null);
				});
			});
		});

		if (Array.isArray(rows) && rows.length > 0) {
			return rows as any[];
		}
	}

	// Final fallback: scan recent rows and match in-memory in case collection filter syntax differs.
	const scanned = await pb.collection(collection).getList(1, 200, { sort })
		.then((r: any) => r?.items ?? [])
		.catch(async () => {
			return await pb.collection(collection).getList(1, 200)
				.then((r: any) => r?.items ?? [])
				.catch(() => []);
		});
	const matched = (scanned as any[]).filter((row) => {
		for (const field of userFields) {
			const value = (row as any)?.[field.name];
			if (Array.isArray(value) && value.map(String).includes(userId)) return true;
			if (String(value ?? '') === userId) return true;
		}
		return false;
	});
	if (matched.length > 0) return matched;

	return [];
}

async function createWithUserFallback(pb: any, collection: string, userId: string, payload: Record<string, any>): Promise<any> {
	const linkPayload = await buildUserLinkPayload(pb, collection, userId);
	try {
		return await pb.collection(collection).create({ ...payload, ...linkPayload });
	} catch {
		return await pb.collection(collection).create(payload);
	}
}

async function updateWithUserFallback(pb: any, collection: string, recordId: string, userId: string, payload: Record<string, any>): Promise<any> {
	const linkPayload = await buildUserLinkPayload(pb, collection, userId);
	try {
		return await pb.collection(collection).update(recordId, { ...payload, ...linkPayload });
	} catch {
		return await pb.collection(collection).update(recordId, payload);
	}
}

function formatActionError(error: any, fallback: string): string {
	const pbMessage = error?.response?.message ?? error?.message ?? fallback;
	const pbData = error?.response?.data;
	if (pbData && typeof pbData === 'object') {
		const fields = Object.entries(pbData)
			.map(([key, value]: [string, any]) => {
				const msg = value?.message ?? '';
				return msg ? `${key}: ${msg}` : key;
			})
			.filter(Boolean)
			.join('; ');
		if (fields) return `${pbMessage} (${fields})`;
	}
	return String(pbMessage);
}

async function requireAdminSeedPb(): Promise<any> {
	const adminPb = await getAdminPocketBase().catch((error: any) => {
		throw new Error(`Admin seed unavailable: ${error?.message ?? 'Unable to authenticate admin PocketBase client'}`);
	});
	if (!adminPb) {
		throw new Error('Admin seed unavailable: missing admin PocketBase client');
	}
	return adminPb;
}

function getSessionPbBaseUrl(locals: any): string {
	const raw = String(locals?.pb?.baseUrl ?? '').trim();
	return raw ? raw.replace(/\/$/, '') : '';
}

async function requireAdminSeedPbForRequest(locals: any): Promise<{ pb: any; sessionBaseUrl: string; adminBaseUrl: string }> {
	const sessionBaseUrl = getSessionPbBaseUrl(locals);

	if (sessionBaseUrl) {
		const adminPb = await getAdminPocketBaseForBaseUrl(sessionBaseUrl).catch((error: any) => {
			throw new Error(`Admin seed unavailable for session base URL (${sessionBaseUrl}): ${error?.message ?? 'Unable to authenticate admin PocketBase client'}`);
		});
		return {
			pb: adminPb,
			sessionBaseUrl,
			adminBaseUrl: sessionBaseUrl,
		};
	}

	const adminPb = await requireAdminSeedPb();
	return {
		pb: adminPb,
		sessionBaseUrl: '(unknown)',
		adminBaseUrl: String(adminPb?.baseUrl ?? '(unknown)').replace(/\/$/, ''),
	};
}

async function upsertOnboardingStatus(pb: any, userId: string, patch: Record<string, any>): Promise<void> {
	const existing = await getRowsByUser(pb, 'onboarding_status', userId, 'id');

	const now = new Date().toISOString();
	const payload = { ...patch, updatedAt: now };
	if (patch.pipelineStage === 'approved' && !payload.completedAt) {
		payload.completedAt = now;
	}

	if (existing.length > 0) {
		await updateWithUserFallback(pb, 'onboarding_status', existing[0].id, userId, payload);
		return;
	}

	await createWithUserFallback(pb, 'onboarding_status', userId, {
		welcomeSeen: false,
		documentsInitialed: false,
		contractSigned: false,
		profileCompleted: false,
		...payload,
	});
}

async function seedRequiredDocuments(pb: any, userId: string): Promise<void> {
	const existing = await getRowsByUser(pb, 'document_signatures', userId, 'id,documentType');
	const byType = new Map(existing.map((doc: any) => [String(doc.documentType ?? ''), doc]));
	const now = new Date().toISOString();

	for (const documentType of REQUIRED_DOC_TYPES) {
		const payload = {
			documentType,
			initials: 'PA',
			signatureDataUrl: '',
			agreed: true,
			signedAt: now,
		};

		const current = byType.get(documentType);
		if (current?.id) {
			await updateWithUserFallback(pb, 'document_signatures', current.id, userId, payload);
		} else {
			await createWithUserFallback(pb, 'document_signatures', userId, payload);
		}
	}
}

async function upsertFakePlayerProfile(pb: any, userId: string, email: string): Promise<void> {
	const existing = await getRowsByUser(pb, 'player_profiles', userId, 'id,status');
	const now = new Date().toISOString();
	const safeEmail = normalizeSeedEmail(email);

	const payload = {
		fullName: 'Paige Testuser',
		dateOfBirth: '1997-04-18',
		nationality: 'USA',
		countryOfResidence: 'United States',
		primaryLanguages: 'English',
		phone: '(555) 867-5309',
		email: safeEmail,
		mailingAddress: '123 Fairway Drive, Austin, TX 78701',
		emergencyContactName: 'Jordan Testuser',
		emergencyContactRelationship: 'Sibling',
		emergencyContactPhone: '(555) 200-3000',
		emergencyContactEmail: 'jordan.test@example.com',
		worldRanking: 88,
		yearsCompeting: 9,
		majorTournamentWins: '3',
		notableAchievements: '2x regional champion; top-10 national finish',
		otherLeagues: 'State Tour, Charity Open',
		playingStyle: 'Controlled power with aggressive putting',
		strongestSkills: 'Approach shots, pressure putts',
		knownInjuries: 'None',
		broadcastNickname: 'Paige Powerline',
		instagram: '@paigeplays',
		twitter: '@paigeplays',
		youtube: 'youtube.com/@paigeplays',
		otherSocialMedia: 'tiktok.com/@paigeplays',
		personalWebsite: 'https://paigeplays.example.com',
		mediaFeatures: 'Regional sports podcast guest',
		comfortableWithInterviews: true,
		openToBehindScenes: true,
		currentSponsorships: 'Demo sponsor account',
		openToNewSponsors: true,
		wantsLeagueSponsorHelp: true,
		personalBrandingGoals: 'Grow fanbase and secure equipment sponsors',
		hasAgent: true,
		repName: 'Alex Carter',
		repAgency: 'Summit Sports Mgmt',
		repPosition: 'Agent',
		repPhone: '(555) 410-2200',
		repEmail: 'alex.carter@example.com',
		participatedInBetting: false,
		understandsIntegrityPolicy: true,
		priorIntegrityViolations: false,
		integrityViolationDetails: null,
		excitementAboutLeague: 'Excited for team format and fan growth',
		careerGoals: 'Win a major and mentor younger players',
		additionalInfo: 'Auto-seeded onboarding profile for QA testing',
		status: 'submitted',
		submittedAt: now,
	};

	try {
		if (existing.length > 0) {
			await updateWithUserFallback(pb, 'player_profiles', existing[0].id, userId, payload);
			return;
		}

		await createWithUserFallback(pb, 'player_profiles', userId, payload);
		return;
	} catch (error) {
		// Fallback for schema variants: keep minimum fields needed to represent profile completion.
		const minimalPayload = {
			fullName: 'Paige Testuser',
			email: safeEmail,
			status: 'submitted',
			submittedAt: now,
		};

		if (existing.length > 0) {
			await updateWithUserFallback(pb, 'player_profiles', existing[0].id, userId, minimalPayload);
			return;
		}

		await createWithUserFallback(pb, 'player_profiles', userId, minimalPayload);
	}
}

async function resetOnboardingData(pb: any, userId: string): Promise<void> {
	const [statusRows, documentRows, profileRows] = await Promise.all([
		getRowsByUser(pb, 'onboarding_status', userId, 'id'),
		getRowsByUser(pb, 'document_signatures', userId, 'id'),
		getRowsByUser(pb, 'player_profiles', userId, 'id'),
	]);

	for (const row of documentRows) {
		await pb.collection('document_signatures').delete(row.id).catch(() => {});
	}
	for (const row of profileRows) {
		await pb.collection('player_profiles').delete(row.id).catch(() => {});
	}
	for (const row of statusRows) {
		await pb.collection('onboarding_status').delete(row.id).catch(() => {});
	}
}

async function verifyOnboardingSeed(pb: any, userId: string): Promise<{
	hasProfile: boolean;
	profileStatus: string;
	hasOnboardingStatus: boolean;
	profileCompleted: boolean;
	documentsInitialed: boolean;
	contractSigned: boolean;
}> {
	const [profileRows, statusRows] = await Promise.all([
		getRowsByUser(pb, 'player_profiles', userId, 'id,status', '-updated'),
		getRowsByUser(pb, 'onboarding_status', userId, 'id,documentsInitialed,contractSigned,profileCompleted', '-updated'),
	]);

	const profileRowsAny = profileRows as any[];
	const statusRowsAny = statusRows as any[];
	const bestProfile =
		profileRowsAny.find((row) => String(row?.status ?? '').toLowerCase() === 'approved') ??
		profileRowsAny.find((row) => String(row?.status ?? '').toLowerCase() === 'submitted') ??
		profileRowsAny[0] ??
		null;

	return {
		hasProfile: Boolean(bestProfile?.id),
		profileStatus: String(bestProfile?.status ?? '').toLowerCase(),
		hasOnboardingStatus: statusRowsAny.length > 0,
		profileCompleted: statusRowsAny.some((row) => Boolean(row?.profileCompleted)),
		documentsInitialed: statusRowsAny.some((row) => Boolean(row?.documentsInitialed)),
		contractSigned: statusRowsAny.some((row) => Boolean(row?.contractSigned)),
	};
}

async function buildSeedDebugSnapshot(pb: any, userId: string): Promise<string> {
	const readDebugCollection = async (collection: string): Promise<{ items: any[]; error: string | null }> => {
		try {
			const withSort = await pb.collection(collection).getList(1, 15, { sort: '-updated' });
			return { items: withSort?.items ?? [], error: null };
		} catch (firstError: any) {
			try {
				const withoutSort = await pb.collection(collection).getList(1, 15);
				return {
					items: withoutSort?.items ?? [],
					error: `sort_error:${String(firstError?.response?.message ?? firstError?.message ?? 'unknown')}`,
				};
			} catch (secondError: any) {
				return {
					items: [],
					error: `list_error:${String(secondError?.response?.message ?? secondError?.message ?? 'unknown')}`,
				};
			}
		}
	};

	const [profilesData, statusesData, signaturesData] = await Promise.all([
		readDebugCollection('player_profiles'),
		readDebugCollection('onboarding_status'),
		readDebugCollection('document_signatures'),
	]);

	const profiles = profilesData.items;
	const statuses = statusesData.items;
	const signatures = signaturesData.items;

	const userMatches = (rows: any[]) => rows.filter((row: any) => {
		const directUserId = String(row?.userId ?? '');
		const directUser = String(row?.user ?? '');
		if (directUserId === userId || directUser === userId) return true;
		const asText = JSON.stringify(row ?? {});
		return asText.includes(userId);
	});

	const profileMatches = userMatches(profiles as any[]);
	const statusMatches = userMatches(statuses as any[]);
	const signatureMatches = userMatches(signatures as any[]);

	const summarize = (rows: any[], kind: 'profile' | 'status' | 'signature') => rows.slice(0, 3).map((row: any) => {
		if (kind === 'profile') {
			return `${row.id}:${String(row.status ?? 'none')} (userId=${String(row.userId ?? '')}, user=${String(row.user ?? '')})`;
		}
		if (kind === 'status') {
			return `${row.id}:stage=${String(row.pipelineStage ?? 'none')} d=${Boolean(row.documentsInitialed)} c=${Boolean(row.contractSigned)} p=${Boolean(row.profileCompleted)} (userId=${String(row.userId ?? '')}, user=${String(row.user ?? '')})`;
		}
		return `${row.id}:${String(row.documentType ?? 'none')} (userId=${String(row.userId ?? '')}, user=${String(row.user ?? '')})`;
	}).join(' | ');

	return [
		`userId=${userId}`,
		`profiles(match/total)=${profileMatches.length}/${(profiles as any[]).length}`,
		`statuses(match/total)=${statusMatches.length}/${(statuses as any[]).length}`,
		`signatures(match/total)=${signatureMatches.length}/${(signatures as any[]).length}`,
		`profilesReadError=${profilesData.error ?? 'none'}`,
		`statusesReadError=${statusesData.error ?? 'none'}`,
		`signaturesReadError=${signaturesData.error ?? 'none'}`,
		`profileSample=${summarize(profileMatches, 'profile') || 'none'}`,
		`statusSample=${summarize(statusMatches, 'status') || 'none'}`,
		`signatureSample=${summarize(signatureMatches, 'signature') || 'none'}`,
	].join(' || ');
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile } = ctx;
	try {
		const role = String(userProfile?.role ?? '').toLowerCase();
		const isTalentRole = ['pro', 'manager', 'broadcaster'].includes(role);

		// Fetch all core data in parallel — each wrapped so one failure doesn't kill the page
		const [projects, departments, expenses, approvals, workOrders, sponsors, franchiseLeads, franchiseOpps, ticketSales, brandingPlacements, bankAccounts, roleMenuVisibility, tournamentsRaw, specialEventsRaw, campaignsRaw] = await Promise.all([
			pb.collection('projects').getFullList({ fields: 'id,name,status,department,project_budget,project_actual_expenses,project_forecasted_expenses,fiscalYear' }).catch(() => []),
			pb.collection('departments').getFullList({ fields: 'id,name,description,status,department_annual_budget,department_actual_expenses' }).catch(() => []),
			pb.collection('expenses').getFullList({ fields: 'id,amount,status,project' }).catch(() => []),
			pb.collection('approvals').getFullList({ fields: 'id,status' }).catch(() => []),
			pb.collection('work_orders').getFullList({ fields: 'id,amount,status' }).catch(() => []),
			pb.collection('sponsors').getFullList({ fields: 'id,status,tier,type,committed_amount,paid_amount' }).catch(() => []),
			pb.collection('franchise_leads').getFullList({ fields: 'id,status' }).catch(() => []),
			pb.collection('franchise_opportunities').getFullList({ fields: 'id,status' }).catch(() => []),
			pb.collection('ticket_sales').getFullList({ fields: 'id,status,grossRevenue,netRevenue,quantity,pricePerTicket,platformFees' }).catch(() => []),
			pb.collection('branding_placements').getFullList({ fields: 'id,status,grossRevenue,quantity,ratePerPlacement' }).catch(() => []),
			pb.collection('bank_accounts').getFullList({ fields: 'id,allocation,status' }).catch(() => []),
			getRoleMenuVisibility().catch(() => ({})),
			isTalentRole ? pb.collection('tournaments').getFullList({ fields: 'id,name,startDate,endDate,location,status', sort: 'startDate' }).catch(() => []) : Promise.resolve([]),
			isTalentRole ? pb.collection('special_events').getFullList({ fields: 'id,title,name,eventDate,startDate,endDate,location,status', sort: 'eventDate,startDate' }).catch(() => []) : Promise.resolve([]),
			isTalentRole ? pb.collection('campaigns').getFullList({ fields: 'id,name,title,startDate,endDate,status', sort: 'startDate' }).catch(() => []) : Promise.resolve([]),
		]);

		const now = Date.now();
		const toTs = (value: any): number => {
			if (!value) return 0;
			const t = new Date(String(value)).getTime();
			return Number.isFinite(t) ? t : 0;
		};

		const upcomingTournaments = (tournamentsRaw as any[])
			.filter((t) => {
				const ts = toTs(t.startDate);
				return ts === 0 || ts >= now;
			})
			.slice(0, 12)
			.map((t) => ({
				id: t.id,
				name: t.name,
				startDate: t.startDate ?? null,
				endDate: t.endDate ?? null,
				location: t.location ?? '',
				status: t.status ?? ''
			}));

		const upcomingSpecialEvents = (specialEventsRaw as any[])
			.filter((e) => {
				const ts = toTs(e.eventDate) || toTs(e.startDate);
				return ts === 0 || ts >= now;
			})
			.slice(0, 12)
			.map((e) => ({
				id: e.id,
				name: e.title || e.name || 'Untitled Event',
				eventDate: e.eventDate ?? null,
				startDate: e.startDate ?? null,
				endDate: e.endDate ?? null,
				location: e.location ?? '',
				status: e.status ?? ''
			}));

		const upcomingCampaigns = (campaignsRaw as any[])
			.filter((c) => {
				const ts = toTs(c.startDate);
				return ts === 0 || ts >= now;
			})
			.slice(0, 12)
			.map((c) => ({
				id: c.id,
				name: c.name || c.title || 'Untitled Campaign',
				startDate: c.startDate ?? null,
				endDate: c.endDate ?? null,
				status: c.status ?? ''
			}));
	
		// Budget rollup. The seed raise is the cash ceiling; department budgets can
		// include later operating/revenue-funded planning assumptions.
		const seedRaise = 7_500_000;
		const operatingPlanTotal = (departments as any[]).reduce((s, d) => s + (d.department_annual_budget ?? 0), 0);
		const actualSpend = (projects as any[]).reduce((s, p) => s + (p.project_actual_expenses ?? 0), 0);
		const forecasted  = (projects as any[]).reduce((s, p) => s + (p.project_forecasted_expenses ?? 0), 0);
	
		// Project status counts
		const pByStatus = { total: projects.length, in_progress: 0, planned: 0, completed: 0, draft: 0, cancelled: 0 };
		for (const p of projects as any[]) {
			if (p.status in pByStatus) (pByStatus as any)[p.status]++;
		}
	
		// Expense rollup
		const expTotal = (expenses as any[]).reduce((s, e) => s + (e.amount ?? 0), 0);
		const expApproved = (expenses as any[]).filter((e: any) => e.status === 'approved' || e.status === 'paid').reduce((s, e) => s + (e.amount ?? 0), 0);
		const expByStatus = { total: expenses.length, totalAmount: expTotal, approvedAmount: expApproved, submitted: 0, approved: 0, paid: 0, draft: 0 };
		for (const e of expenses as any[]) {
			if (e.status in expByStatus) (expByStatus as any)[e.status]++;
		}

		// Work orders rollup
		const woTotalAmount = (workOrders as any[]).reduce((s, wo) => s + (wo.amount ?? 0), 0);
		const woByStatus = { total: workOrders.length, totalAmount: woTotalAmount, open: 0, paid: 0, cancelled: 0 };
		for (const wo of workOrders as any[]) {
			if (wo.status in woByStatus) (woByStatus as any)[wo.status]++;
		}
	
		// Approvals
		const appByStatus = { total: approvals.length, pending: 0, approved: 0, rejected: 0, revision_requested: 0 };
		for (const a of approvals as any[]) {
			if (a.status in appByStatus) (appByStatus as any)[a.status]++;
		}
	
		// Sponsors
		const sponsorMetrics = {
			total: sponsors.length,
			totalCommitted: (sponsors as any[]).reduce((s, sp) => s + (sp.committed_amount ?? 0), 0),
			totalPaid: (sponsors as any[]).reduce((s, sp) => s + (sp.paid_amount ?? 0), 0),
			byTier: {} as Record<string, number>,
			byStatus: {} as Record<string, number>
		};
		for (const sp of sponsors as any[]) {
			if (sp.tier) sponsorMetrics.byTier[sp.tier] = (sponsorMetrics.byTier[sp.tier] ?? 0) + 1;
			if (sp.status) sponsorMetrics.byStatus[sp.status] = (sponsorMetrics.byStatus[sp.status] ?? 0) + 1;
		}
	
		// Department budget list for the table
		const departmentBudgets = (departments as any[]).map(d => {
			const dProjects = (projects as any[]).filter(p => p.department === d.id);
			const actual     = dProjects.reduce((s: number, p: any) => s + (p.project_actual_expenses ?? 0), 0);
			const forecasted = dProjects.reduce((s: number, p: any) => s + (p.project_forecasted_expenses ?? 0), 0);
			const budgeted   = dProjects.reduce((s: number, p: any) => s + (p.project_budget ?? 0), 0);
			// Use whichever is larger: the department's own budget field or the sum of
			// its projects' budgets. Prevents a stale/low department_annual_budget from
			// producing a nonsensical >100% spent figure.
			const budget = Math.max(d.department_annual_budget ?? 0, budgeted);
			return {
				id: d.id,
				name: d.name,
				description: d.description ?? '',
				status: d.status ?? 'active',

				budget,
				actual,
				forecasted,
				budgeted,
				projectCount: dProjects.length,
				projects: dProjects.map((p: any) => ({
					id: p.id,
					name: p.name,
					status: p.status,
					budget: p.project_budget ?? 0,
					actual: p.project_actual_expenses ?? 0,
					forecasted: p.project_forecasted_expenses ?? 0,
				}))
			};
		}).sort((a, b) => {
			// Active projects first, then by project count desc, then budget desc
			const aActive = a.projects.filter((p: any) => p.status === 'in_progress').length;
			const bActive = b.projects.filter((p: any) => p.status === 'in_progress').length;
			if (bActive !== aActive) return bActive - aActive;
			if (b.projectCount !== a.projectCount) return b.projectCount - a.projectCount;
			return b.budget - a.budget;
		});
	
		// Branding placement revenue rollup
		const bp = brandingPlacements as any[];
		const brandingMetrics = {
			totalContracted: bp.filter(r => !['proposed','cancelled'].includes(r.status)).reduce((s, r) => s + (r.grossRevenue ?? 0), 0),
			totalPaid:       bp.filter(r => ['paid','activated','completed'].includes(r.status)).reduce((s, r) => s + (r.grossRevenue ?? 0), 0),
			totalProposed:   bp.filter(r => r.status === 'proposed').reduce((s, r) => s + (r.grossRevenue ?? 0), 0),
			count:           bp.length,
		};

		// Ticket revenue rollup
		const ts = ticketSales as any[];
		const grossTicketRevenue = (r: any) => r.grossRevenue ?? ((r.quantity ?? 0) * (r.pricePerTicket ?? 0));
		const ticketMetrics = {
			totalGross:     ts.reduce((s, r) => s + grossTicketRevenue(r), 0),
			totalNet:       ts.reduce((s, r) => s + (r.netRevenue ?? 0), 0),
			totalReceived:  ts.filter(r => ['completed','reconciled'].includes(r.status)).reduce((s, r) => s + (r.netRevenue ?? 0), 0),
			totalProjected: ts.filter(r => ['projected','on_sale','sold_out'].includes(r.status)).reduce((s, r) => s + grossTicketRevenue(r), 0),
			count:          ts.length,
		};

		const activeBankAccounts = (bankAccounts as any[]).filter((acc: any) => !acc.status || acc.status === 'active');
		const totalBankBalance = activeBankAccounts.reduce((sum: number, acc: any) => sum + (Number(acc.allocation ?? 0) || 0), 0);
		const projectedRevenue =
			ticketMetrics.totalProjected +
			sponsorMetrics.totalCommitted +
			brandingMetrics.totalContracted +
			brandingMetrics.totalProposed;
		const incomeDebug = {
			total: projectedRevenue,
			breakdown: {
				ticketsProjected: ticketMetrics.totalProjected,
				sponsorsCommitted: sponsorMetrics.totalCommitted,
				brandingContracted: brandingMetrics.totalContracted,
				brandingProposed: brandingMetrics.totalProposed,
			}
		};

		console.debug('[dashboard] expenses-object', expByStatus);
		console.debug('[dashboard] income-object', incomeDebug);

		console.debug('[dashboard] work-orders-chart-inputs', {
			incomeTotal: projectedRevenue,
			expenseTotal: expTotal,
			bankAccountTotal: totalBankBalance,
			incomeBreakdown: {
				ticketsProjected: ticketMetrics.totalProjected,
				sponsorsCommitted: sponsorMetrics.totalCommitted,
				brandingContracted: brandingMetrics.totalContracted,
				brandingProposed: brandingMetrics.totalProposed,
			},
			recordCounts: {
				ticketSales: ts.length,
				sponsors: sponsors.length,
				brandingPlacements: bp.length,
				expenses: expenses.length,
				activeBankAccounts: activeBankAccounts.length,
			}
		});

		return {
			user: locals.pb.authStore.model,
			userProfile,
			roleMenuVisibility,
			upcoming: {
				tournaments: upcomingTournaments,
				specialEvents: upcomingSpecialEvents,
				campaigns: upcomingCampaigns,
			},
			metrics: {
				budget: {
					total: seedRaise,
					actual: actualSpend,
					forecasted,
					remaining: seedRaise - actualSpend,
					seedRaise,
					operatingPlanTotal
				},
				projects: pByStatus,
				expenses: expByStatus,
				workOrders: woByStatus,
				approvals: appByStatus,
				sponsors: sponsorMetrics,
				tickets: ticketMetrics,
				branding: brandingMetrics,
				cashflow: {
					totalBankBalance,
					projectedRevenue,
					revenueBreakdown: {
						ticketsProjected: ticketMetrics.totalProjected,
						sponsorsCommitted: sponsorMetrics.totalCommitted,
						brandingContracted: brandingMetrics.totalContracted,
						brandingProposed: brandingMetrics.totalProposed,
					}
				},
				franchise: {
					pipeline: {
						leads: franchiseLeads.length,
						opportunities: franchiseOpps.length,
						deals: 0
					}
				},
				departmentBudgets
			}
		};
	} catch (err: any) {
		console.error('dashboard load error:', err?.message ?? err);
		return {};
	}
};

export const actions: Actions = {
	seedOnboardingStage: async ({ locals, url, request }) => {
		const ctx = await RequestContext.from(locals, url);
		const seedCtx = await requireAdminSeedPbForRequest(locals);
		const seedPb = seedCtx.pb;
		const { userId, email } = await resolveOnboardingTarget(ctx, seedPb);
		const form = await request.formData();
		const requestedStage = String(form.get('stage') ?? 'documents_sent');
		const stagePayload = SEED_STAGE_PAYLOADS[requestedStage];

		if (!stagePayload) {
			return fail(400, { onboardingActionError: `Unknown stage: ${requestedStage}` });
		}

		try {
			await upsertOnboardingStatus(seedPb, userId, stagePayload);
			return {
				onboardingActionOk: true,
				onboardingActionMessage: `Seeded stage "${requestedStage}" for ${email}`,
			};
		} catch (error: any) {
			return fail(500, {
				onboardingActionError: `${formatActionError(error, 'Failed to seed onboarding stage')} (sessionPb=${seedCtx.sessionBaseUrl}, adminPb=${seedCtx.adminBaseUrl})`
			});
		}
	},

	completeOnboarding: async ({ locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		const seedCtx = await requireAdminSeedPbForRequest(locals);
		const seedPb = seedCtx.pb;
		const { userId, email } = await resolveOnboardingTarget(ctx, seedPb);

		try {
			await seedRequiredDocuments(seedPb, userId);
			await upsertFakePlayerProfile(seedPb, userId, email);
			await upsertOnboardingStatus(seedPb, userId, {
				...SEED_STAGE_PAYLOADS.approved,
				adminNotes: 'Auto-completed via dashboard test controls',
			});
			const verify = await verifyOnboardingSeed(seedPb, userId);
			if (!verify.hasProfile || !['submitted', 'approved'].includes(verify.profileStatus) || !verify.profileCompleted) {
				const debug = await buildSeedDebugSnapshot(seedPb, userId);
				throw new Error(`Verification failed: profile=${verify.profileStatus || 'missing'}, profileCompleted=${verify.profileCompleted}, docs=${verify.documentsInitialed}, contract=${verify.contractSigned} || debug=${debug}`);
			}

			return {
				onboardingActionOk: true,
				onboardingActionMessage: `Completed onboarding with seeded docs/profile for ${email}`,
			};
		} catch (error: any) {
			return fail(500, {
				onboardingActionError: `${formatActionError(error, 'Failed to complete onboarding')} (sessionPb=${seedCtx.sessionBaseUrl}, adminPb=${seedCtx.adminBaseUrl})`
			});
		}
	},

	seedOnboardingDataOnly: async ({ locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		const seedCtx = await requireAdminSeedPbForRequest(locals);
		const seedPb = seedCtx.pb;
		const { userId, email } = await resolveOnboardingTarget(ctx, seedPb);

		try {
			await seedRequiredDocuments(seedPb, userId);
			await upsertFakePlayerProfile(seedPb, userId, email);
			await upsertOnboardingStatus(seedPb, userId, {
				documentsInitialed: true,
				contractSigned: true,
				profileCompleted: true,
				adminNotes: 'Seed-only docs/profile completed',
			});
			const verify = await verifyOnboardingSeed(seedPb, userId);
			if (!verify.hasProfile || !['submitted', 'approved'].includes(verify.profileStatus) || !verify.profileCompleted) {
				const debug = await buildSeedDebugSnapshot(seedPb, userId);
				throw new Error(`Verification failed: profile=${verify.profileStatus || 'missing'}, profileCompleted=${verify.profileCompleted}, docs=${verify.documentsInitialed}, contract=${verify.contractSigned} || debug=${debug}`);
			}

			return {
				onboardingActionOk: true,
				onboardingActionMessage: `Seeded docs/profile only for ${email} (pipelineStage unchanged, progress synced)`,
			};
		} catch (error: any) {
			return fail(500, {
				onboardingActionError: `${formatActionError(error, 'Failed to seed docs/profile only')} (sessionPb=${seedCtx.sessionBaseUrl}, adminPb=${seedCtx.adminBaseUrl})`
			});
		}
	},

	resetOnboarding: async ({ locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		const seedCtx = await requireAdminSeedPbForRequest(locals);
		const seedPb = seedCtx.pb;
		const { userId, email } = await resolveOnboardingTarget(ctx, seedPb);

		try {
			await resetOnboardingData(seedPb, userId);
			return {
				onboardingActionOk: true,
				onboardingActionMessage: `Reset onboarding data for ${email}`,
			};
		} catch (error: any) {
			return fail(500, {
				onboardingActionError: `${formatActionError(error, 'Failed to reset onboarding data')} (sessionPb=${seedCtx.sessionBaseUrl}, adminPb=${seedCtx.adminBaseUrl})`
			});
		}
	},
};
