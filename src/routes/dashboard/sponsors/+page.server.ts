import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { PIPELINE_STAGES, CLOSED_STAGES } from '$lib/domain/schemas/sponsor.schema';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile: userProfile } = ctx;

	try {
		const [sponsors, bridges, payments, userProfiles] = await Promise.all([
			pb.collection('sponsors').getFullList({ sort: '-updated', expand: 'assignedTo' }).catch(() => []),
			pb.collection('sponsor_franchise_bridge').getFullList({ sort: '-created', expand: 'sponsorId,assignedSalesRep' }).catch(() => []),
			pb.collection('sponsor_payments').getFullList({ sort: '-dueDate', fields: 'id,sponsor,amount,status,dueDate,paymentType' }).catch(() => []),
			pb.collection('user_profiles').getFullList({ filter: 'role = "leader" || role = "sales"', sort: 'firstName,lastName', fields: 'id,firstName,lastName,email,role' }).catch(() => [])
		]);

		const byStatus: Record<string, any[]> = {};
		for (const stage of [...PIPELINE_STAGES, ...CLOSED_STAGES]) {
			byStatus[stage] = (sponsors as any[]).filter(s => s.status === stage);
		}

		const activePayers = (sponsors as any[]).filter(s => s.status === 'active' || s.status === 'renewed' || s.status === 'contracted');
		const totalContractedValue = activePayers.reduce((sum, s) => sum + (s.annualCommitment || 0), 0);
		const totalReceived  = (payments as any[]).filter(p => p.status === 'received').reduce((sum, p) => sum + (p.amount || 0), 0);
		const totalOverdue   = (payments as any[]).filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0);
		const totalScheduled = (payments as any[]).filter(p => p.status === 'scheduled' || p.status === 'invoiced').reduce((sum, p) => sum + (p.amount || 0), 0);
		const pipelineValue  = (sponsors as any[]).filter(s => PIPELINE_STAGES.includes(s.status)).reduce((sum, s) => sum + (s.annualCommitment || 0), 0);

		const metrics = {
			total: (sponsors as any[]).length,
			byStatus,
			activePayers: activePayers.length,
			pipelineOpen: (sponsors as any[]).filter(s => PIPELINE_STAGES.includes(s.status)).length,
			franchiseInterested: (sponsors as any[]).filter(s => s.franchiseInterest).length,
			activeBridges: (bridges as any[]).filter(b => b.status !== 'declined' && b.status !== 'converted').length,
			convertedToFranchise: (sponsors as any[]).filter(s => s.status === 'converted_to_franchise').length,
			totalContractedValue, totalReceived, totalOverdue, totalScheduled, pipelineValue,
			byTier: {
				tier_1: (sponsors as any[]).filter(s => s.tier === 'tier_1').length,
				tier_2: (sponsors as any[]).filter(s => s.tier === 'tier_2').length,
				tier_3: (sponsors as any[]).filter(s => s.tier === 'tier_3').length,
				tier_4: (sponsors as any[]).filter(s => s.tier === 'tier_4').length
			}
		};

		return { userProfile, sponsors, bridges, payments, userProfiles, metrics, byStatus };
	} catch (err: any) {
		console.error('sponsors load error:', err?.message ?? err);
		return { sponsors: [], bridges: [], payments: [], userProfiles: [], metrics: null, byStatus: {} };
	}
};
