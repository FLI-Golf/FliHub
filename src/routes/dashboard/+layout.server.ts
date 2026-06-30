import { isRedirect, redirect } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getEmailDeliveryStatus } from '$lib/server/email-config';
import { getAdminPocketBase, getAdminPocketBaseForBaseUrl } from '$lib/infra/pocketbase/pbClient';
import { RoleRouter } from '$lib/server/RoleRouter';
import { canRoleViewControlledMenu, getRoleMenuVisibility } from '$lib/server/role-menu-visibility';
import type { LayoutServerLoad } from './$types';

function getSessionPbBaseUrl(locals: any): string {
	const raw = String(locals?.pb?.baseUrl ?? '').trim();
	return raw ? raw.replace(/\/$/, '') : '';
}

async function getAdminReadPocketBase(locals: any): Promise<any | null> {
	const sessionBaseUrl = getSessionPbBaseUrl(locals);
	if (sessionBaseUrl) {
		return await getAdminPocketBaseForBaseUrl(sessionBaseUrl).catch(() => null);
	}
	return await getAdminPocketBase().catch(() => null);
}

async function getRowsByUser(readPb: any, collection: string, userId: string, fields: string, sort = '-updated'): Promise<any[]> {
	const filters = [
		`userId = "${userId}"`,
		`user = "${userId}"`,
		`userId.id = "${userId}"`,
		`user.id = "${userId}"`,
		`userId ?= "${userId}"`,
		`user ?= "${userId}"`,
	];

	for (const filter of filters) {
		const rows = await readPb.collection(collection).getFullList({
			filter,
			fields,
			sort,
		}).catch(async () => {
			return await readPb.collection(collection).getFullList({
				filter,
				fields,
			}).catch(async () => {
				return await readPb.collection(collection).getFullList({
					filter,
				}).catch(() => null);
			});
		});

		if (Array.isArray(rows) && rows.length > 0) return rows as any[];
	}

	const scanned = await readPb.collection(collection).getList(1, 200, { sort })
		.then((r: any) => r?.items ?? [])
		.catch(async () => {
			return await readPb.collection(collection).getList(1, 200)
				.then((r: any) => r?.items ?? [])
				.catch(() => []);
		});

	const matches = (scanned as any[]).filter((row) => {
		const userIdValue = row?.userId;
		const userValue = row?.user;
		if (Array.isArray(userIdValue) && userIdValue.map(String).includes(userId)) return true;
		if (Array.isArray(userValue) && userValue.map(String).includes(userId)) return true;
		if (String(userIdValue ?? '') === userId) return true;
		if (String(userValue ?? '') === userId) return true;
		return false;
	});

	return matches;
}

export const load: LayoutServerLoad = async ({ locals, url }) => {
	try {
		// RequestContext.from handles:
		//   - unauthenticated → redirect to /auth/login
		//   - vendor role     → redirect to /vendor/dashboard
		const ctx = await RequestContext.from(locals, url);
		const { pb, profile } = ctx;
		const { emailDeliveryEnabled } = getEmailDeliveryStatus();
		const roleMenuVisibility = await getRoleMenuVisibility();
		const routeIsAllowed = canRoleViewControlledMenu(ctx.role, url.pathname, roleMenuVisibility);
		if (routeIsAllowed === false) {
			throw redirect(303, '/dashboard');
		}
		const sessionModel = (locals.pb?.authStore?.model ?? {}) as any;
		const adminPb = await getAdminReadPocketBase(locals);

		await new RoleRouter(pb).logSessionRole({
			sessionUser: {
				id: sessionModel.id,
				email: sessionModel.email,
				username: sessionModel.username,
			},
			role: profile?.role ?? 'unknown',
		});

		const sidebarNotes: Record<string, string> = {};
		const sidebarNoteLines: Record<string, string[]> = {};
		sidebarNotes['/dashboard/settings'] = emailDeliveryEnabled ? 'email enabled' : 'email not wired';

		if (profile?.id) {
			if (adminPb) {
				const myClaimsCount = await adminPb.collection('reimbursement_claims').getList(1, 1, {
					filter: `claimant="${profile.id}"`,
					fields: 'id'
				}).then((r: any) => Number(r?.totalItems ?? 0)).catch(() => 0);

				sidebarNotes['/dashboard/reimbursements'] = `${myClaimsCount} claim${myClaimsCount === 1 ? '' : 's'}`;
			}
		}

		const countRecords = async (collection: string, filter?: string): Promise<number> => {
			const result = await pb.collection(collection).getList(1, 1, {
				fields: 'id',
				...(filter ? { filter } : {})
			}).catch(() => null);
			return Number(result?.totalItems ?? 0);
		};

		let userDepartment = null;
		let onboardingBadge: string | null = null;
		let playerProfileNote: string | null = null;
		let onboardingState: {
			stageKey: string;
			stageLabel: string;
			completionPercent: number;
			isComplete: boolean;
			message: string;
			ctaLabel: string;
			ctaHref: string;
		} | null = null;
		let onboardingPipelineStats: {
			total: number;
			invited: number;
			docsSent: number;
			docsSigned: number;
			approved: number;
			rejected: number;
		} | null = null;
		if (['leader', 'admin'].includes(profile?.role ?? '') && profile?.id) {
			const depts = await pb.collection('departments')
				.getFullList({ filter: `headOfDepartment = "${profile.id}"` })
				.catch(() => []);
			userDepartment = depts[0] ?? null;
		}

		if (profile?.id) {
			const readPb = adminPb ?? pb;

			const signatures = await getRowsByUser(
				readPb,
				'document_signatures',
				ctx.userId,
				'documentType',
				'-updated'
			).catch(() => []);

			const onboardingStatusRows = await getRowsByUser(
				readPb,
				'onboarding_status',
				ctx.userId,
				'id,pipelineStage,welcomeSeen,documentsInitialed,contractSigned,profileCompleted',
				'-updated'
			).catch(() => []);
			const onboardingStatus = onboardingStatusRows[0] ?? null;
			const onboardingStatusAny = {
				documentsInitialed: (onboardingStatusRows as any[]).some((row: any) => Boolean(row?.documentsInitialed)),
				contractSigned: (onboardingStatusRows as any[]).some((row: any) => Boolean(row?.contractSigned)),
				profileCompleted: (onboardingStatusRows as any[]).some((row: any) => Boolean(row?.profileCompleted)),
			};

			const signedTypes = new Set(signatures.map((s: any) => String(s.documentType ?? '')));
			// Documents & Signing sidebar badge tracks the 4 initial docs only.
			const requiredTypes = [
				'player_information_packet',
				'player_opportunity_packet',
				'integrity_substance_policy',
				'legal_documents'
			];

			const signedCount = requiredTypes.filter((t) => signedTypes.has(t)).length;
			const documentsInitialedFromStatus = onboardingStatusAny.documentsInitialed;
			const pendingCount = documentsInitialedFromStatus
				? 0
				: Math.max(0, requiredTypes.length - signedCount);
			onboardingBadge = `${pendingCount} pending`;
			sidebarNotes['/dashboard/onboarding'] = onboardingBadge;
			const documentsInitialed = Boolean(onboardingStatusAny.documentsInitialed || pendingCount === 0);
			const contractSigned = Boolean(onboardingStatusAny.contractSigned || signedTypes.has('player_contract'));

			const profiles = await getRowsByUser(
				readPb,
				'player_profiles',
				ctx.userId,
				'id,status,fullName,dateOfBirth,nationality,countryOfResidence,primaryLanguages,phone,email,mailingAddress,emergencyContactName,emergencyContactRelationship,emergencyContactPhone,emergencyContactEmail,worldRanking,yearsCompeting,majorTournamentWins,notableAchievements,otherLeagues,playingStyle,strongestSkills,knownInjuries,broadcastNickname,instagram,twitter,youtube,otherSocialMedia,personalWebsite,mediaFeatures,comfortableWithInterviews,openToBehindScenes,currentSponsorships,openToNewSponsors,wantsLeagueSponsorHelp,personalBrandingGoals,hasAgent,repName,repAgency,repPosition,repPhone,repEmail,participatedInBetting,understandsIntegrityPolicy,priorIntegrityViolations,integrityViolationDetails,excitementAboutLeague,careerGoals,additionalInfo',
				'-updated'
			).catch(() => []);

			const normalizedProfiles = profiles as any[];
			const profileApproved = normalizedProfiles.find((p: any) => String(p?.status ?? '').toLowerCase() === 'approved') ?? null;
			const profileSubmitted = normalizedProfiles.find((p: any) => String(p?.status ?? '').toLowerCase() === 'submitted') ?? null;
			const playerProfile = profileApproved ?? profileSubmitted ?? normalizedProfiles[0] ?? null;

			if (onboardingStatusAny.profileCompleted) {
				playerProfileNote = playerProfile?.status === 'approved' ? 'approved' : 'submitted';
			} else if (!playerProfile) {
				playerProfileNote = '7 pending';
			} else if (String(playerProfile.status ?? '').toLowerCase() === 'approved') {
				playerProfileNote = 'approved';
			} else if (String(playerProfile.status ?? '').toLowerCase() === 'submitted') {
				playerProfileNote = 'submitted';
			} else {
				const hasValue = (...values: any[]) => values.some((v) => {
					if (typeof v === 'boolean') return v;
					if (typeof v === 'number') return Number.isFinite(v);
					if (typeof v === 'string') return v.trim().length > 0;
					return v !== null && v !== undefined;
				});

				const stepCompletion = [
					hasValue(
						playerProfile.fullName,
						playerProfile.dateOfBirth,
						playerProfile.nationality,
						playerProfile.countryOfResidence,
						playerProfile.primaryLanguages,
						playerProfile.phone,
						playerProfile.email,
						playerProfile.mailingAddress,
						playerProfile.emergencyContactName,
						playerProfile.emergencyContactRelationship,
						playerProfile.emergencyContactPhone,
						playerProfile.emergencyContactEmail
					),
					hasValue(
						playerProfile.worldRanking,
						playerProfile.yearsCompeting,
						playerProfile.majorTournamentWins,
						playerProfile.notableAchievements,
						playerProfile.otherLeagues,
						playerProfile.playingStyle,
						playerProfile.strongestSkills,
						playerProfile.knownInjuries
					),
					hasValue(
						playerProfile.broadcastNickname,
						playerProfile.instagram,
						playerProfile.twitter,
						playerProfile.youtube,
						playerProfile.otherSocialMedia,
						playerProfile.personalWebsite,
						playerProfile.mediaFeatures,
						playerProfile.comfortableWithInterviews,
						playerProfile.openToBehindScenes
					),
					hasValue(
						playerProfile.currentSponsorships,
						playerProfile.openToNewSponsors,
						playerProfile.wantsLeagueSponsorHelp,
						playerProfile.personalBrandingGoals
					),
					hasValue(
						playerProfile.hasAgent,
						playerProfile.repName,
						playerProfile.repAgency,
						playerProfile.repPosition,
						playerProfile.repPhone,
						playerProfile.repEmail
					),
					hasValue(
						playerProfile.participatedInBetting,
						playerProfile.understandsIntegrityPolicy,
						playerProfile.priorIntegrityViolations,
						playerProfile.integrityViolationDetails
					),
					hasValue(
						playerProfile.excitementAboutLeague,
						playerProfile.careerGoals,
						playerProfile.additionalInfo
					)
				];

				const completedSteps = stepCompletion.filter(Boolean).length;
				const pendingSteps = Math.max(0, 7 - completedSteps);
				playerProfileNote = `${pendingSteps} pending`;
			}
			sidebarNotes['/dashboard/player-profile'] = playerProfileNote;

			const profileCompleted = Boolean(onboardingStatusAny.profileCompleted || ['submitted', 'approved'].includes(String(playerProfile?.status ?? '').toLowerCase()));
			const pipelineStage = String(onboardingStatus?.pipelineStage ?? '').toLowerCase();
			const isComplete = pipelineStage === 'approved' || (documentsInitialed && contractSigned && profileCompleted);
			const started = Boolean(onboardingStatus || signatures.length > 0 || playerProfile);
			const completedCount = [documentsInitialed, contractSigned, profileCompleted].filter(Boolean).length;
			const completionPercent = isComplete ? 100 : Math.round((completedCount / 3) * 100);

			let stageKey = 'not_started';
			let stageLabel = 'Not Started';
			let message = 'Optional onboarding helps personalize your dashboard and profile.';
			let ctaLabel = 'Start Onboarding';
			let ctaHref = '/dashboard/onboarding';

			if (isComplete) {
				stageKey = 'completed';
				stageLabel = 'Completed';
				message = 'Onboarding is complete. You can update your info anytime.';
				ctaLabel = 'Review My Info';
				ctaHref = '/dashboard/player-profile';
			} else if (profileCompleted && documentsInitialed && contractSigned) {
				stageKey = 'ready_for_approval';
				stageLabel = 'Ready For Approval';
				message = 'Everything is submitted. We are waiting for final approval.';
				ctaLabel = 'View Documents';
				ctaHref = '/dashboard/onboarding';
			} else if (profileCompleted) {
				stageKey = 'profile_done';
				stageLabel = 'Profile Complete';
				message = 'Profile is complete. Finish documents to continue.';
				ctaLabel = 'Finish Documents';
				ctaHref = '/dashboard/onboarding';
			} else if (documentsInitialed || contractSigned || started) {
				stageKey = 'in_progress';
				stageLabel = 'In Progress';
				message = 'Onboarding started. Continue where you left off.';
				ctaLabel = 'Continue Onboarding';
				ctaHref = '/dashboard/onboarding';
			}

			onboardingState = {
				stageKey,
				stageLabel,
				completionPercent,
				isComplete,
				message,
				ctaLabel,
				ctaHref,
			};
		}

		if (['admin', 'leader'].includes(profile?.role ?? '')) {
			const [onboardingTotal, invited, docsSent, docsSigned, approved, rejected] = await Promise.all([
				countRecords('talent'),
				countRecords('onboarding_status', 'pipelineStage = "invited"'),
				countRecords('onboarding_status', 'pipelineStage = "documents_sent"'),
				countRecords('onboarding_status', 'pipelineStage = "documents_signed"'),
				countRecords('onboarding_status', 'pipelineStage = "approved"'),
				countRecords('onboarding_status', 'pipelineStage = "rejected"')
			]);

			onboardingPipelineStats = { total: onboardingTotal, invited, docsSent, docsSigned, approved, rejected };
			sidebarNoteLines['/dashboard/onboarding/admin'] = [
				`${onboardingTotal} total`,
				`${invited} invited`,
				`${docsSent} docs sent`,
				`${docsSigned} docs signed`,
				`${approved} approved`,
				`${rejected} rejected`
			];

			const [
				departmentsCount,
				peopleCount,
				projectsCount,
				activeProjectsCount,
				activeGoalsCount,
				manageEventsCount,
				expensesPendingCount,
				approvalsPendingCount,
				workOrdersOpenCount,
				reimbursementsPendingReviewCount,
				sponsorsCount,
				franchiseLeadsCount,
				franchiseDealsCount,
				bankAccountsCount,
				ticketSalesCount,
				contentItemsCount,
				talentCount,
				tournamentsCount,
				eventsCount,
				trademarksCount,
				campaignsCount,
				vendorsCount
			] = await Promise.all([
				countRecords('departments'),
				countRecords('people'),
				countRecords('projects'),
				countRecords('projects', 'status = "in_progress"'),
				countRecords('marketing_goals', 'status = "in_progress" || status = "In Progress" || status = "in progress"'),
				countRecords('special_events'),
				countRecords('expenses', 'status = "submitted"'),
				countRecords('approvals', 'status = "pending"'),
				countRecords('work_orders', 'status = "open"'),
				countRecords('reimbursement_claims', 'status = "submitted" || status = "under_review"'),
				countRecords('sponsors'),
				countRecords('franchise_leads'),
				countRecords('franchise_deals'),
				countRecords('bank_accounts'),
				countRecords('ticket_sales'),
				countRecords('content_production'),
				countRecords('talent'),
				countRecords('tournaments'),
				countRecords('events'),
				countRecords('trademarks'),
				countRecords('campaigns'),
				countRecords('vendors')
			]);

			sidebarNotes['/dashboard/departments'] = `${departmentsCount} total`;
			sidebarNotes['/dashboard/people'] = `${peopleCount} total`;
			sidebarNotes['/dashboard/projects'] = `${projectsCount} total`;
			sidebarNotes['/dashboard'] = `${projectsCount} projects`;
			sidebarNotes['/dashboard/active-projects'] = `${activeProjectsCount} active`;
			sidebarNotes['/dashboard/active-goals'] = `${activeGoalsCount} active`;
			sidebarNotes['/dashboard/manage-events'] = `${manageEventsCount} total`;
			sidebarNotes['/dashboard/manage-media-content'] = `${contentItemsCount} items`;
			sidebarNotes['/dashboard/active-income'] = `${sponsorsCount + franchiseLeadsCount + franchiseDealsCount + ticketSalesCount} records`;
			sidebarNotes['/dashboard/expenses'] = `${expensesPendingCount} pending`;
			sidebarNotes['/dashboard/approvals'] = `${approvalsPendingCount} pending`;
			sidebarNotes['/dashboard/work-orders'] = `${workOrdersOpenCount} open`;
			sidebarNotes['/dashboard/reimbursements/admin'] = `${reimbursementsPendingReviewCount} pending review`;
			sidebarNotes['/dashboard/sponsors'] = `${sponsorsCount} total`;
			sidebarNotes['/dashboard/sales'] = `${franchiseLeadsCount} leads`;
			sidebarNotes['/dashboard/franchise-sales'] = `${franchiseDealsCount} deals`;
			sidebarNotes['/dashboard/bank-accounts'] = `${bankAccountsCount} accounts`;
			sidebarNotes['/dashboard/ticket-revenue'] = `${ticketSalesCount} records`;
			sidebarNotes['/dashboard/content'] = `${contentItemsCount} items`;
			sidebarNotes['/dashboard/talent'] = `${talentCount} total`;
			sidebarNotes['/dashboard/talent/tournaments'] = `${tournamentsCount} total`;
			sidebarNotes['/dashboard/events'] = `${eventsCount} total`;
			sidebarNotes['/dashboard/trademarks'] = `${trademarksCount} total`;
			sidebarNotes['/dashboard/campaigns'] = `${campaignsCount} total`;
			sidebarNotes['/dashboard/vendors'] = `${vendorsCount} total`;
		}

		return {
			user: locals.pb?.authStore?.model ?? null,
			userProfile: profile,
			userDepartment,
			onboardingState,
			onboardingBadge,
			playerProfileNote,
			onboardingPipelineStats,
			roleMenuVisibility,
			sidebarNotes,
			sidebarNoteLines
		};
	} catch (err: any) {
		// Always propagate redirects — never swallow them
		if (isRedirect(err)) throw err;
		console.error('Layout load error:', err?.message ?? err);
		return { user: null, userProfile: null, userDepartment: null, onboardingState: null, onboardingBadge: null, playerProfileNote: null, onboardingPipelineStats: null, roleMenuVisibility: {}, sidebarNotes: {}, sidebarNoteLines: {} };
	}
};
