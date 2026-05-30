import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	const [leads, territories, userProfiles, opportunities, deals] = await Promise.all([
		pb.collection('franchise_leads').getFullList({
			sort: '-created',
			expand: 'assignedTo',
		}).catch(() => []),
		pb.collection('franchise_territories').getFullList({
			sort: 'name', fields: 'id,name,state,code,status'
		}).catch(() => []),
		pb.collection('user_profiles').getFullList({
			filter: 'role = "leader" || role = "sales"',
			sort: 'firstName,lastName',
			fields: 'id,firstName,lastName'
		}).catch(() => []),
		pb.collection('franchise_opportunities').getFullList({
			sort: '-created',
			fields: 'id,leadId,stage,dealValue,probability,closeDate'
		}).catch(() => []),
		pb.collection('franchise_deals').getFullList({
			sort: '-created',
			fields: 'id,status,totalFranchiseValue,totalPaidToDate,contractDate',
			expand: 'opportunityId'
		}).catch(() => []),
	]);

	// Build lookup maps
	const oppsByLead: Record<string, any[]> = {};
	for (const opp of opportunities as any[]) {
		if (!opp.leadId) continue;
		oppsByLead[opp.leadId] ??= [];
		oppsByLead[opp.leadId].push(opp);
	}

	const dealByOpp: Record<string, any> = {};
	for (const deal of deals as any[]) {
		const oppId = deal.expand?.opportunityId?.id ?? deal.opportunityId;
		if (oppId) dealByOpp[oppId] = deal;
	}

	// Enrich leads with opportunity, deal, and qualification score
	const enriched = (leads as any[]).map(lead => {
		const opps      = oppsByLead[lead.id] ?? [];
		const activeOpp = opps.find((o: any) => !['closed_lost','closed_won'].includes(o.stage));
		const wonOpp    = opps.find((o: any) => o.stage === 'closed_won');
		const deal      = wonOpp ? dealByOpp[wonOpp.id] : null;

		// Qualification score 0–100
		let qualScore = 0;
		if ((lead.netWorth ?? 0) >= 1_000_000)        qualScore += 30;
		else if ((lead.netWorth ?? 0) >= 500_000)      qualScore += 15;
		if ((lead.liquidCapital ?? 0) >= 500_000)      qualScore += 40;
		else if ((lead.liquidCapital ?? 0) >= 200_000) qualScore += 20;
		if (lead.experienceLevel === 'high')            qualScore += 20;
		else if (lead.experienceLevel === 'medium')     qualScore += 10;
		if (lead.territory)                             qualScore += 10;

		return {
			...lead,
			opps,
			activeOpp:    activeOpp ?? null,
			deal:         deal ?? null,
			qualScore,
			assignedName: lead.expand?.assignedTo
				? `${lead.expand.assignedTo.firstName ?? ''} ${lead.expand.assignedTo.lastName ?? ''}`.trim()
				: null,
		};
	});

	const stageCounts: Record<string, number> = {};
	for (const l of enriched) stageCounts[l.status] = (stageCounts[l.status] ?? 0) + 1;

	const pipelineValue = (opportunities as any[])
		.filter((o: any) => !['closed_lost','closed_won'].includes(o.stage))
		.reduce((s: number, o: any) => s + (o.dealValue ?? 0), 0);

	return { leads: enriched, territories, userProfiles, stageCounts, pipelineValue };
};
