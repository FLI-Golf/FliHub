import { RequestContext } from '$lib/infra/RequestContext';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Checklist items per phase
const CHECKLIST: Record<string, { id: string; label: string }[]> = {
	design: [
		{ id: 'specs_finalised',    label: 'Dimensions & specs finalised' },
		{ id: 'branding_approved',  label: 'Branding / logo placement approved' },
		{ id: 'power_requirements', label: 'Power & cabling requirements documented' },
		{ id: 'structural_review',  label: 'Structural load review complete' }
	],
	vendor_quote: [
		{ id: 'min_two_quotes',     label: 'Minimum 2 vendor quotes received' },
		{ id: 'vendor_selected',    label: 'Preferred vendor selected' },
		{ id: 'lead_time_confirmed',label: 'Lead time confirmed vs. event schedule' }
	],
	installation: [
		{ id: 'site_prepared',      label: 'Install site prepared & cleared' },
		{ id: 'power_run',          label: 'Power & data cabling run to location' },
		{ id: 'mounting_complete',  label: 'Mounting structure complete' },
		{ id: 'panel_installed',    label: 'Display panels installed & secured' },
		{ id: 'weatherproofing',    label: 'Weatherproofing / enclosure sealed' }
	],
	testing: [
		{ id: 'power_on_test',      label: 'Power-on test passed' },
		{ id: 'scoring_feed',       label: 'Live scoring feed connected & verified' },
		{ id: 'visibility_check',   label: 'Visibility check from spectator areas' },
		{ id: 'failover_tested',    label: 'Failover / backup display tested' },
		{ id: 'signoff',            label: 'Operations sign-off complete' }
	]
};

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);

	const scoreboard = await ctx.pb.collection('scoreboards').getOne(params.id).catch(() => null);
	if (!scoreboard) throw error(404, 'Scoreboard not found');

	const [quotes, checklistRecords, approval, expense, workOrder] = await Promise.all([
		ctx.pb.collection('scoreboard_vendor_quotes').getFullList({
			filter: `scoreboardId = "${params.id}"`,
			sort:   'amount'
		}).catch(() => []),
		ctx.pb.collection('scoreboard_checklist').getFullList({
			filter: `scoreboardId = "${params.id}"`
		}).catch(() => []),
		scoreboard.approvalId
			? ctx.pb.collection('approvals').getOne(scoreboard.approvalId).catch(() => null)
			: null,
		scoreboard.expenseId
			? ctx.pb.collection('expenses').getOne(scoreboard.expenseId, { fields: 'id,title,amount,status' }).catch(() => null)
			: null,
		scoreboard.workOrderId
			? ctx.pb.collection('work_orders').getOne(scoreboard.workOrderId, { fields: 'id,title,status,workOrderNumber' }).catch(() => null)
			: null
	]);

	// Merge checklist defaults with saved state
	const checkedIds = new Set(checklistRecords.map((r: any) => r.itemId));
	const checklist = Object.fromEntries(
		Object.entries(CHECKLIST).map(([phase, items]) => [
			phase,
			items.map(item => ({ ...item, checked: checkedIds.has(item.id) }))
		])
	);

	return { scoreboard, quotes, checklist, approval, expense, workOrder };
};
