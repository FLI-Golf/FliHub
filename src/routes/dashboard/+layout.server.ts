import { isRedirect } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getEmailDeliveryStatus } from '$lib/server/email-config';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	try {
		// RequestContext.from handles:
		//   - unauthenticated → redirect to /auth/login
		//   - vendor role     → redirect to /vendor/dashboard
		const ctx = await RequestContext.from(locals, url);
		const { pb, profile } = ctx;
		const { emailDeliveryEnabled } = getEmailDeliveryStatus();

		const sidebarNotes: Record<string, string> = {};
		const sidebarNoteLines: Record<string, string[]> = {};
		sidebarNotes['/dashboard/settings'] = emailDeliveryEnabled ? 'email enabled' : 'email not wired';

		if (profile?.id) {
			const adminPb = await getAdminPocketBase().catch(() => null);
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
		let onboardingWelcomeNote: string | null = null;
		let onboardingBadge: string | null = null;
		let playerProfileNote: string | null = null;
		let onboardingPipelineStats: { total: number; docsSent: number; docsSigned: number } | null = null;
		if (profile?.role === 'leader' && profile?.id) {
			const depts = await pb.collection('departments')
				.getFullList({ filter: `headOfDepartment = "${profile.id}"` })
				.catch(() => []);
			userDepartment = depts[0] ?? null;
		}

		if (['pro', 'manager', 'broadcaster', 'admin', 'leader'].includes(profile?.role ?? '')) {
			const onboardingStatusRows = await pb.collection('onboarding_status').getFullList({
				filter: `userId = "${ctx.userId}"`,
				fields: 'id,welcomeSeen'
			}).catch(() => []);
			const onboardingStatus = onboardingStatusRows[0] ?? null;
			onboardingWelcomeNote = onboardingStatus?.welcomeSeen ? 'seen' : 'pending';
			sidebarNotes['/dashboard/welcome'] = onboardingWelcomeNote;

			const signatures = await pb.collection('document_signatures').getFullList({
				filter: `userId = "${ctx.userId}"`,
				fields: 'documentType'
			}).catch(() => []);

			const signedTypes = new Set(signatures.map((s: any) => String(s.documentType ?? '')));
			// Documents & Signing sidebar badge tracks the 4 initial docs only.
			const requiredTypes = [
				'player_information_packet',
				'player_opportunity_packet',
				'integrity_substance_policy',
				'legal_documents'
			];

			const signedCount = requiredTypes.filter((t) => signedTypes.has(t)).length;
			const pendingCount = Math.max(0, requiredTypes.length - signedCount);
			onboardingBadge = `${pendingCount} pending`;
			sidebarNotes['/dashboard/onboarding'] = onboardingBadge;

			const profiles = await pb.collection('player_profiles').getFullList({
				filter: `userId = "${ctx.userId}"`,
				fields: 'id,status,fullName,dateOfBirth,nationality,countryOfResidence,primaryLanguages,phone,email,mailingAddress,emergencyContactName,emergencyContactRelationship,emergencyContactPhone,emergencyContactEmail,worldRanking,yearsCompeting,majorTournamentWins,notableAchievements,otherLeagues,playingStyle,strongestSkills,knownInjuries,broadcastNickname,instagram,twitter,youtube,otherSocialMedia,personalWebsite,mediaFeatures,comfortableWithInterviews,openToBehindScenes,currentSponsorships,openToNewSponsors,wantsLeagueSponsorHelp,personalBrandingGoals,hasAgent,repName,repAgency,repPosition,repPhone,repEmail,participatedInBetting,understandsIntegrityPolicy,priorIntegrityViolations,integrityViolationDetails,excitementAboutLeague,careerGoals,additionalInfo'
			}).catch(() => []);

			const playerProfile = profiles[0] ?? null;
			if (!playerProfile) {
				playerProfileNote = '7 pending';
			} else if (playerProfile.status === 'approved') {
				playerProfileNote = 'approved';
			} else if (playerProfile.status === 'submitted') {
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
		}

		if (['admin', 'leader'].includes(profile?.role ?? '')) {
			const onboardingRows = await pb.collection('onboarding_status').getFullList({
				fields: 'id,pipelineStage'
			}).catch(() => []);

			const onboardingTotal = onboardingRows.length;
			const docsSent = onboardingRows.filter((r: any) => r.pipelineStage === 'documents_sent').length;
			const docsSigned = onboardingRows.filter((r: any) => r.pipelineStage === 'documents_signed').length;

			onboardingPipelineStats = { total: onboardingTotal, docsSent, docsSigned };
			sidebarNoteLines['/dashboard/onboarding/admin'] = [
				`${onboardingTotal} total`,
				`${docsSent} docs sent`,
				`${docsSigned} docs signed`
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
			onboardingWelcomeNote,
			onboardingBadge,
			playerProfileNote,
			onboardingPipelineStats,
			sidebarNotes,
			sidebarNoteLines
		};
	} catch (err: any) {
		// Always propagate redirects — never swallow them
		if (isRedirect(err)) throw err;
		console.error('Layout load error:', err?.message ?? err);
		return { user: null, userProfile: null, userDepartment: null, onboardingWelcomeNote: null, onboardingBadge: null, playerProfileNote: null, onboardingPipelineStats: null, sidebarNotes: {}, sidebarNoteLines: {} };
	}
};
