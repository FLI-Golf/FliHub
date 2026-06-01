/**
 * POST /api/campaigns
 * Creates a campaign and links it to selected ambassador talent_marketing records.
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	ctx.requireRole('admin', 'leader', 'marketing', 'marketing_lead');

	const body = await request.json().catch(() => null);
	if (!body?.name || !body?.type) {
		return json({ message: 'name and type are required' }, { status: 400 });
	}

	const adminPb = await getAdminPocketBase();

	// Create the campaign
	const campaign = await adminPb.collection('campaigns').create({
		name:           body.name,
		type:           body.type,
		status:         body.status ?? 'Planning',
		budget:         Number(body.budget ?? 0),
		actualSpend:    0,
		startDate:      body.startDate ?? '',
		endDate:        body.endDate ?? '',
		targetAudience: body.targetAudience ?? '',
		goals:          body.goals ?? '',
		metrics:        body.metrics ?? '',
		goalId:         body.goalId || undefined,
	});

	// Link campaign to each selected ambassador's talent_marketing record
	const ambassadorIds: string[] = body.ambassadorIds ?? [];
	if (ambassadorIds.length > 0) {
		const profiles = await adminPb.collection('talent_marketing').getFullList({
			filter: ambassadorIds.map(id => `talentId = "${id}"`).join(' || '),
		}).catch(() => []);

		for (const profile of profiles as any[]) {
			const existing = profile.campaignIds
				? profile.campaignIds.split(',').filter(Boolean)
				: [];
			if (!existing.includes(campaign.id)) {
				await adminPb.collection('talent_marketing').update(profile.id, {
					campaignIds: [...existing, campaign.id].join(','),
				}).catch(() => {});
			}
		}
	}

	return json({ campaign, linked: ambassadorIds.length });
};
