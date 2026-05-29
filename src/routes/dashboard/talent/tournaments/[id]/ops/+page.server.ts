import { RequestContext } from '$lib/infra/RequestContext';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Default checklist items per phase
const DEFAULT_CHECKLIST: Record<string, { id: string; label: string }[]> = {
	pre: [
		{ id: 'venue_confirmed',    label: 'Venue confirmed & contracted' },
		{ id: 'course_setup',       label: 'Course setup / basket placement complete' },
		{ id: 'talent_travel',      label: 'Talent travel & accommodation booked' },
		{ id: 'broadcast_crew',     label: 'Broadcast crew scheduled' },
		{ id: 'sponsor_signage',    label: 'Sponsor signage & branding installed' },
		{ id: 'media_credentials',  label: 'Media credentials issued' },
		{ id: 'prize_pool_funded',  label: 'Prize pool funded & confirmed' },
		{ id: 'rules_briefing',     label: 'Rules briefing scheduled' },
		{ id: 'social_promo',       label: 'Social media promo posts scheduled' },
		{ id: 'volunteer_briefed',  label: 'Volunteers / marshals briefed' }
	],
	during: [
		{ id: 'registration_open',  label: 'Player registration desk open' },
		{ id: 'scoring_live',       label: 'Live scoring system active' },
		{ id: 'broadcast_live',     label: 'Broadcast stream live' },
		{ id: 'media_interviews',   label: 'Media interviews conducted' },
		{ id: 'results_verified',   label: 'Round results verified with players' },
		{ id: 'incident_log',       label: 'Incident log reviewed' }
	],
	post: [
		{ id: 'results_final',      label: 'Final results entered & verified' },
		{ id: 'payouts_generated',  label: 'Payouts generated in system' },
		{ id: 'payouts_approved',   label: 'Payouts approved' },
		{ id: 'payouts_sent',       label: 'Payouts sent to talent' },
		{ id: 'media_recap',        label: 'Media recap / highlight reel published' },
		{ id: 'sponsor_report',     label: 'Sponsor post-event report sent' },
		{ id: 'course_restored',    label: 'Course restored to original condition' },
		{ id: 'debrief_done',       label: 'Internal debrief completed' }
	]
};

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);

	const tournament = await ctx.pb.collection('tournaments').getOne(params.id).catch(() => null);
	if (!tournament) throw error(404, 'Tournament not found');

	// Load results for leaderboard
	const results = await ctx.pb.collection('tournament_results').getFullList({
		filter: `tournament = "${params.id}"`,
		expand: 'pro',
		sort: 'placement'
	}).catch(() => []);

	// Load talent for bulk import dropdown
	const talent = await ctx.pb.collection('talent').getFullList({
		sort: 'name',
		fields: 'id,name,gender'
	}).catch(() => []);

	// Load saved checklist state
	const checklistRecords = await ctx.pb.collection('tournament_ops_checklist').getFullList({
		filter: `tournamentId = "${params.id}"`
	}).catch(() => []);

	// Merge defaults with saved state
	const checkedIds = new Set(checklistRecords.map((r: any) => r.itemId));
	const checklistRecordMap = Object.fromEntries(checklistRecords.map((r: any) => [r.itemId, r]));

	const checklist = {
		pre:    DEFAULT_CHECKLIST.pre.map(item => ({ ...item, checked: checkedIds.has(item.id), recordId: checklistRecordMap[item.id]?.id ?? null })),
		during: DEFAULT_CHECKLIST.during.map(item => ({ ...item, checked: checkedIds.has(item.id), recordId: checklistRecordMap[item.id]?.id ?? null })),
		post:   DEFAULT_CHECKLIST.post.map(item => ({ ...item, checked: checkedIds.has(item.id), recordId: checklistRecordMap[item.id]?.id ?? null }))
	};

	return { tournament, results, talent, checklist };
};
