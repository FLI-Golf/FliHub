import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('admin', 'leader');

	// Load all talent + broadcaster_profiles to build the candidate list
	const [talentRecords, broadcasterProfiles, onboardingStatuses, signatures] = await Promise.all([
		ctx.pb.collection('talent').getFullList({ sort: 'name' }).catch(() => []),
		ctx.pb.collection('broadcaster_profiles').getFullList({ sort: 'name' }).catch(() => []),
		ctx.pb.collection('onboarding_status').getFullList().catch(() => []),
		ctx.pb.collection('document_signatures').getFullList().catch(() => [])
	]);

	// Index onboarding status by userId
	const statusByUser = new Map<string, any>();
	for (const s of onboardingStatuses) {
		statusByUser.set(s.userId, s);
	}

	// Count signatures per user
	const sigCountByUser = new Map<string, number>();
	for (const sig of signatures) {
		sigCountByUser.set(sig.userId, (sigCountByUser.get(sig.userId) ?? 0) + 1);
	}

	// Build unified candidate list
	const candidates = [
		...talentRecords.map((t: any) => ({
			id: t.id,
			userId: t.id, // talent records use their own id as userId in onboarding
			name: t.name,
			role: (() => {
				const rawRole = Array.isArray(t.talentType) ? t.talentType[0] : (t.talentType ?? 'pro');
				return rawRole === 'player' ? 'pro' : rawRole;
			})(),
			email: t.email ?? '',
			avatar: t.avatar ?? null,
			collectionId: t.collectionId
		})),
		...broadcasterProfiles.map((b: any) => ({
			id: b.id,
			userId: b.id,
			name: b.name,
			role: 'broadcaster',
			email: b.email ?? '',
			avatar: b.avatar ?? null,
			collectionId: b.collectionId
		}))
	];

	// Attach onboarding status to each candidate
	const enriched = candidates.map((c) => {
		const status = statusByUser.get(c.userId);
		const sigCount = sigCountByUser.get(c.userId) ?? 0;
		return {
			...c,
			pipelineStage: status?.pipelineStage ?? 'invited',
			welcomeSeen: status?.welcomeSeen ?? false,
			documentsInitialed: status?.documentsInitialed ?? false,
			contractSigned: status?.contractSigned ?? false,
			profileCompleted: status?.profileCompleted ?? false,
			completedAt: status?.completedAt ?? null,
			adminNotes: status?.adminNotes ?? '',
			signatureCount: sigCount,
			onboardingId: status?.id ?? null
		};
	});

	// Summary stats
	const stats = {
		total: enriched.length,
		invited: enriched.filter((c) => c.pipelineStage === 'invited').length,
		documentsSent: enriched.filter((c) => c.pipelineStage === 'documents_sent').length,
		documentsSigned: enriched.filter((c) => c.pipelineStage === 'documents_signed').length,
		profileComplete: enriched.filter((c) => c.pipelineStage === 'profile_complete').length,
		approved: enriched.filter((c) => c.pipelineStage === 'approved').length,
		rejected: enriched.filter((c) => c.pipelineStage === 'rejected').length
	};

	return { candidates: enriched, stats };
};
